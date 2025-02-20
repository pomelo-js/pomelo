import { postAria2DownloadRequest, carryCommand } from "../utils";
import { errorLog, successLog, warnLog } from "../utils/log";
import type {
    PomeloMatchContext,
    PomeloRuleContext,
    PomeloRule,
    RuleHandlerOptions,
    PomeloHandler,
    PomeloRuleMatchedItem,
} from "../models";
import { getResourceString as _getResource } from "../utils";
import { isRegExpOption } from "../utils";

// 规则匹配器
export function matchRule<T extends { content: string; link: string }>(
    context: PomeloMatchContext & T
) {
    const { content, link, rule, plugins } = context;

    //先匹配拒绝条件
    if (rule.reject && rule.reject(content)) {
        plugins.forEach((p) => p.onRejected?.(content, link));
        rule.onRejected?.(content, link);
        return false;
    }

    //再匹配接受条件
    if (rule.accept && rule.accept(content)) {
        plugins.forEach((p) => p.onAccepted?.(content, link));
        rule.onAccepted?.(content, link);
        return true;
    }

    //未匹配任何行为
    return false;
}

// 创建匹配器
function createMatcher(optss: RuleHandlerOptions): PomeloHandler | undefined {
    if (typeof optss === "function") {
        return (content: string) => optss(content);
    } else if (typeof optss === "string") {
        return (content: string) => new RegExp(optss, "i").test(content);
    } else if (isRegExpOption(optss)) {
        return (content: string) =>
            new RegExp(optss.expr, optss.flag).test(content);
    } else {
        if (!optss) {
            return void 0;
        } else {
            return (content: string) => {
                return optss.some((opts) => {
                    return opts.every((opt) =>
                        typeof opt === "string"
                            ? new RegExp(opt, "i").test(content)
                            : new RegExp(opt.expr, opt.flag).test(content)
                    );
                });
            };
        }
    }
}

//创建规则
export function createRule(context: PomeloRuleContext): PomeloRule {
    const {
        config,
        ruleUnit,
        onlyRecord = false,
        intervalTimeCount,
        record,
        downloadMap,
    } = context;
    return {
        name: ruleUnit.name,
        options: ruleUnit.options,
        accept: createMatcher(ruleUnit.accept),
        reject: createMatcher(ruleUnit.reject),
        async _carryCommand(
            command: string | string[],
            item: PomeloRuleMatchedItem
        ) {
            const _command = this._replaceVar(command, item);
            return await carryCommand(_command);
        },
        _replaceBase(content: string, item: PomeloRuleMatchedItem) {
            content = (content + "")
                .replaceAll("{{rule.name}}", this.name)
                .replaceAll("{{item.link}}", item.link)
                .replaceAll("{{item.title}}", item.title)
                .replaceAll(
                    "{{rule.options.download.dir}}",
                    this.options.download?.dir || ""
                );

            if (config.replace) {
                Object.entries(config.replace).forEach(([key, value]) => {
                    content = content.replaceAll(key, value);
                });
            }
            if (this.options.replace) {
                Object.entries(this.options.replace).forEach(([key, value]) => {
                    content = content.replaceAll(key, value);
                });
            }

            return content;
        },
        _replaceVar(content: string | string[], item: PomeloRuleMatchedItem) {
            if (!content) return "";

            if (Array.isArray(content)) {
                return content.map((str) => this._replaceBase(str, item));
            } else {
                return this._replaceBase(content, item);
            }
        },
        async _download(item: PomeloRuleMatchedItem) {
            // 选择不同的下载方法
            if (config.download?.aria2 && config.download.aria2.enabled) {
                console.time("3.post download request to aria2 --" + item.link);
                await postAria2DownloadRequest(config, this, item);
                console.timeEnd(
                    "3.post download request to aria2 --" + item.link
                );
            }
        },
        async onAcceptedAction(item: PomeloRuleMatchedItem) {
            // 触发规则 Hook
            const ruleAcceptHook = this.options.actions?.accept;
            if (ruleAcceptHook && ruleAcceptHook.command) {
                await this._carryCommand(ruleAcceptHook.command, item);
                return ruleAcceptHook.download === void 0
                    ? true
                    : ruleAcceptHook.download;
            }

            // 触发全局 Hook
            const globalAcceptHook = config.actions?.accept;
            if (globalAcceptHook && globalAcceptHook.command) {
                await this._carryCommand(globalAcceptHook.command, item);
                return globalAcceptHook.download === void 0
                    ? true
                    : globalAcceptHook.download;
            }

            return true;
        },
        async onRejectedAction(item: PomeloRuleMatchedItem) {
            // 触发规则 Hook
            const ruleRejectHook = this.options.actions?.reject;
            if (ruleRejectHook && ruleRejectHook.command) {
                await this._carryCommand(ruleRejectHook.command, item);
            }

            // 触发全局 Hook
            const globalRejectHook = config.actions?.reject;
            if (globalRejectHook && globalRejectHook.command) {
                await this._carryCommand(globalRejectHook.command, item);
            }
        },
        async onAccepted(title: string, link: string) {
            //判断是否已经下载过了
            if (downloadMap.link[link] || downloadMap.title[title]) {
                return warnLog(title + " has been downloaded but accepted");
            }
            //判断是否存在有效记录
            if (
                record.accepted.isValid("link", link) ||
                record.accepted.isValid("title", title)
            ) {
                return warnLog(
                    `checked [record]: ${title} when accepted, download will be skipped.`
                );
            }
            //执行下载和记录
            try {
                //打印接受日志
                successLog(`accept ${title} by [rule]: ${ruleUnit.name}`);
                record.accepted.add("title", title);
                record.accepted.add("link", link);

                const item = { title, link };
                const isDownload = await this.onAcceptedAction(item);
                //判断是否仅需要记录
                if (onlyRecord) {
                    return;
                }

                downloadMap.link[link] = true;
                downloadMap.title[title] = true;

                // 触发 accepted hook
                if (isDownload) {
                    await this._download(item);
                }
            } catch (error) {
                // 出现错误要重置之前的操作
                record.accepted.delete("title", title);
                record.accepted.delete("link", link);
                downloadMap.link[link] = false;
                downloadMap.title[title] = false;
                errorLog(`download failed!\nitem: ${title}\nerror: ${error}`);
            }
        },
        async onRejected(title: string, link: string) {
            if (
                record.rejected.isValid("link", link) ||
                record.rejected.isValid("title", title)
            ) {
                return warnLog(
                    `checked [record]: ${title} when rejected, download will be skipped.`
                );
            }
            await this.onRejectedAction({
                title,
                link,
            });
            successLog(`reject ${title} by [rule]: ${ruleUnit.name}`);
            record.rejected.add("title", title);
            record.rejected.add("link", link);
        },
        onBeforeParse() {
            console.time("2.match rule--" + ruleUnit.name);
        },
        onParsed() {
            console.timeEnd("2.match rule--" + ruleUnit.name);
            intervalTimeCount && intervalTimeCount();
        },
    };
}
