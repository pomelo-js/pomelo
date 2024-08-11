import { postDownloadRequest } from "./api";
import { errorLog, successLog, warnLog } from "../utils/log";
import type {
    PomeloMatchContext,
    PomeloRuleContext,
    PomeloRule,
    RuleHandlerOption,
    PomeloHandler,
} from "../models";
import { getResourceString as _getResource } from "../utils";
import { isRegExpOption } from "../utils";

//规则匹配器
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

//创建匹配器
function createMatcher(optss: RuleHandlerOption): PomeloHandler | undefined {
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
        option: ruleUnit.option,
        accept: createMatcher(ruleUnit.accept),
        reject: createMatcher(ruleUnit.reject),
        async onAccepted(title: string, link: string) {
            //判断是否已经下载过了
            if (downloadMap[link]) {
                return warnLog(title + " has been downloaded but accepted");
            }
            //判断是否存在有效记录
            if (record.accepted.isValid("link", link)) {
                return warnLog(
                    `checked [record]: ${title} when accepted, post download request will be skipped.`
                );
            }
            //执行下载和记录
            try {
                //打印接受日志
                successLog(`accept ${title} by [rule]: ${ruleUnit.name}`);
                record.accepted.add("title", title);
                record.accepted.add("link", link);

                //判断是否仅需要记录
                if (!onlyRecord) {
                    console.time("3.post download request to aria2 --" + link);
                    downloadMap[link] = true;
                    await postDownloadRequest(
                        config,
                        link,
                        this.option,
                        this.name
                    );
                    console.timeEnd(
                        "3.post download request to aria2 --" + link
                    );
                }
            } catch (error) {
                //出现错误要重置之前的操作
                record.accepted.delete("title", title);
                record.accepted.delete("link", link);
                downloadMap[link] = false;
                errorLog(
                    `post download request failed!\nitem: ${title}\nerror: ${error}`
                );
            }
        },
        onRejected(title: string, link: string) {
            if (record.rejected.isValid("link", link)) {
                return warnLog(
                    `checked [record]: ${title} when rejected, download request will be skipped.`
                );
            }
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
