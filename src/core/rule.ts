import { carryCommand } from "../utils";
import { errorLog, successLog, warnLog } from "../utils/log";
import type {
    PomeloRuleMatcherOptions,
    PomeloMatcher,
    PomeloRuleMatchedItem,
    PomeloRuleOptions,
    PomeloRuleUnit,
    PomeloRunContext,
} from "../models";
import { getResourceString as _getResource } from "../utils";
import { isRegExpOption } from "../utils";
import { PomeloEngine } from "./pomelo";

// 创建匹配器
function createMatcher(
    options: PomeloRuleMatcherOptions
): PomeloMatcher | undefined {
    if (typeof options === "function") {
        return (item: PomeloRuleMatchedItem) => options(item);
    } else if (typeof options === "string") {
        return (item: PomeloRuleMatchedItem) =>
            new RegExp(options, "i").test(item.title);
    } else if (isRegExpOption(options)) {
        return (item: PomeloRuleMatchedItem) =>
            new RegExp(options.expr, options.flag).test(item.title);
    } else {
        if (!options) {
            return void 0;
        } else {
            return (item: PomeloRuleMatchedItem) => {
                return options.some((opts) => {
                    return opts.every((opt) =>
                        typeof opt === "string"
                            ? new RegExp(opt, "i").test(item.title)
                            : new RegExp(opt.expr, opt.flag).test(item.title)
                    );
                });
            };
        }
    }
}

interface PomeloRuleCreateParams {
    name: string;
    engine: PomeloEngine;
    unit: PomeloRuleUnit;
    context: PomeloRunContext;
}
export class PomeloRule {
    name: string;
    engine: PomeloEngine;
    options?: PomeloRuleOptions;
    accept?: PomeloMatcher;
    reject?: PomeloMatcher;
    get _config() {
        return this.engine.config!;
    }
    get _record() {
        return this.engine.record!;
    }
    constructor(params: PomeloRuleCreateParams) {
        const { engine, name, unit } = params;
        this.engine = engine;
        this.name = name;
        this.options = unit.options;
        this.accept = createMatcher(unit.accept);
        this.reject = createMatcher(unit.reject);
    }
    public match<T extends PomeloRuleMatchedItem>(
        context: PomeloRunContext,
        item: T
    ) {
        // 先匹配拒绝条件
        if (this.reject && this.reject(item)) {
            this.onRejected(context, item);
            return false;
        }
        // 再匹配接受条件
        if (this.accept && this.accept(item)) {
            this.onAccepted(context, item);
            return true;
        }
        // 未匹配任何行为
        return false;
    }
    private async _carryCommand(
        command: string | string[],
        item: PomeloRuleMatchedItem
    ) {
        const _command = this.replaceVar(command, item);
        return await carryCommand(_command);
    }
    private _replaceBase(content: string, item: PomeloRuleMatchedItem) {
        content = (content + "")
            .replaceAll("{{rule.name}}", this.name)
            .replaceAll("{{item.link}}", item.link)
            .replaceAll("{{item.title}}", item.title);

        if (this._config.replace) {
            Object.entries(this._config.replace).forEach(([key, value]) => {
                content = content.replaceAll(key, value);
            });
        }
        if (this.options?.replace) {
            Object.entries(this.options?.replace).forEach(([key, value]) => {
                content = content.replaceAll(key, value);
            });
        }

        return content;
    }
    public replaceVar(content: string | string[], item: PomeloRuleMatchedItem) {
        if (!content) return "";

        if (Array.isArray(content)) {
            return content.map((str) => this._replaceBase(str, item));
        } else {
            return this._replaceBase(content, item);
        }
    }
    async onAcceptedAction(item: PomeloRuleMatchedItem) {
        // 触发规则 Hook
        const ruleAcceptHook = this.options?.actions?.accept;
        if (ruleAcceptHook && ruleAcceptHook.command) {
            await this._carryCommand(ruleAcceptHook.command, item);
            return ruleAcceptHook.download === void 0
                ? true
                : ruleAcceptHook.download;
        }

        // 触发全局 Hook
        const globalAcceptHook = this._config.actions?.accept;
        if (globalAcceptHook && globalAcceptHook.command) {
            await this._carryCommand(globalAcceptHook.command, item);
            return globalAcceptHook.download === void 0
                ? true
                : globalAcceptHook.download;
        }

        return true;
    }
    async onRejectedAction(item: PomeloRuleMatchedItem) {
        // 触发规则 Hook
        const ruleRejectHook = this.options?.actions?.reject;
        if (ruleRejectHook && ruleRejectHook.command) {
            await this._carryCommand(ruleRejectHook.command, item);
        }

        // 触发全局 Hook
        const globalRejectHook = this._config.actions?.reject;
        if (globalRejectHook && globalRejectHook.command) {
            await this._carryCommand(globalRejectHook.command, item);
        }
    }
    async onAccepted(context: PomeloRunContext, item: PomeloRuleMatchedItem) {
        const { recordMap: downloadMap, onlyRecord, plugins } = context;
        const pluginContext = {
            ...context,
            rule: this,
        };

        plugins.forEach((p) => p.onBeforeAccept?.(pluginContext, item));

        //判断是否已经下载过了
        if (downloadMap.link[item.link] || downloadMap.title[item.title]) {
            return warnLog(item.title + " has been downloaded but accepted");
        }
        //判断是否存在有效记录
        if (
            this._record.accepted.isValid("link", item.link) ||
            this._record.accepted.isValid("title", item.title)
        ) {
            return warnLog(
                `checked [record]: ${item.title} when accepted, download will be skipped.`
            );
        }
        //执行下载和记录
        try {
            //打印接受日志
            successLog(`accept ${item.title} by [rule]: ${this.name}`);
            this._record.accepted.add("title", item.title);
            this._record.accepted.add("link", item.link);

            //判断是否仅需要记录
            if (onlyRecord) {
                return;
            }

            downloadMap.link[item.link] = true;
            downloadMap.title[item.title] = true;

            await this.onAcceptedAction(item);

            plugins.forEach((p) => p.onAccepted?.(pluginContext, item));
        } catch (error) {
            // 出现错误要重置之前的操作
            this._record.accepted.delete("title", item.title);
            this._record.accepted.delete("link", item.link);
            downloadMap.link[item.link] = false;
            downloadMap.title[item.title] = false;
            errorLog(`download failed!\nitem: ${item.title}\nerror: ${error}`);
        }
    }
    async onRejected(context: PomeloRunContext, item: PomeloRuleMatchedItem) {
        if (
            this._record.rejected.isValid("link", item.link) ||
            this._record.rejected.isValid("title", item.title)
        ) {
            return warnLog(
                `checked [record]: ${item.title} when rejected, download will be skipped.`
            );
        }
        await this.onRejectedAction(item);
        successLog(`reject ${item.title} by [rule]: ${this.name}`);
        this._record.rejected.add("title", item.title);
        this._record.rejected.add("link", item.link);

        const pluginContext = {
            ...context,
            rule: this,
        };
        context.plugins.forEach((p) => p.onRejected?.(pluginContext, item));
    }
    onBeforeParse(_: PomeloRunContext) {
        console.time("2.match rule--" + this.name);
    }
    onParsed({ intervalTimeCount }: PomeloRunContext) {
        console.timeEnd("2.match rule--" + this.name);
        intervalTimeCount && intervalTimeCount();
    }
}
