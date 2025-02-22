import { resolve } from "path";
import { createIntervalTimeCount, getResourceString } from "../utils";
import { successLog, warnLog } from "../utils/log";
import type {
    PomeloTaskContext,
    PomeloConfig,
    PomeloMatchContext,
    PomeloRuleContext,
    PomeloPlugin,
} from "../models";
import { createRule, matchRule } from "./rule";
import {
    checkConfig,
    loadConfig,
    loadRecord,
    parseToMillisecond,
} from "../utils";
import { PomeloRecord } from "./record";

interface PomeloRunOptions {
    onlyRecord: boolean;
}

// Pomelo引擎
export class PomeloEngine {
    private _isInited = false;
    public config: PomeloConfig | null = null;
    public record: PomeloRecord | null = null;
    private context: PomeloTaskContext | null = null;

    private _checkInit() {
        if (!this._isInited) {
            throw "The engine has not been initialized.";
            // errorLog("The engine has not been initialized.");
        }
    }

    //#region 初始化
    public async init(config: PomeloConfig, record?: PomeloRecord) {}
    public async initFromFile(configPath?: string, recordPath?: string) {
        // 格式化路径
        const _configPath = resolve(configPath || ".");

        // 读取配置文件和记录文件
        this.config = checkConfig(await loadConfig(_configPath));
        this.record = new PomeloRecord(this.config, _configPath);
        if (this.config.record && recordPath) {
            this.record = new PomeloRecord(
                this.config,
                recordPath,
                await loadRecord(recordPath)
            );
        }

        // 初始化上下文
        this.context = {
            config: this.config,
            record: this.record,
            plugins: [],
            intervalTimeCount: void 0,
            downloadMap: {
                link: {},
                title: {},
            },
            onlyRecord: false,
        };

        //#region 绑定 process 回调
        const interuptHandler = () => {
            warnLog(
                "SIGINT event is triggered, the exit event callback will be executed soon."
            );
            // 在这里执行清理工作
            process.exit(); // 这会触发 exit 事件
        };
        process.on("SIGTERM", interuptHandler);
        process.on("SIGINT", interuptHandler);
        process.on("SIGABRT", interuptHandler);
        process.on("SIGQUIT", interuptHandler);
        process.on("SIGKILL", interuptHandler);
        process.on("exit", () => {
            successLog("stop task");
            console.timeEnd("all tasks");
            this.context?.record.save();
        });
        //#endregion

        // 完成初始化
        this._isInited = true;
    }
    //#endregion

    //#region 运行
    public async run(options?: PomeloRunOptions) {
        this._checkInit();

        options = {
            onlyRecord: false,
            ...options,
        };
        this.context!.onlyRecord = options.onlyRecord;

        const interval = parseToMillisecond(this.config!.interval || 0);
        if (interval) {
            let id = 0;
            successLog(
                `start interval task, interval: ${interval}, current: ${id}`
            );
            this.context!.intervalTimeCount = createIntervalTimeCount(
                `interval task--${id++}`
            );
            await this._task();
            setInterval(async () => {
                successLog(
                    `start interval task, interval: ${interval}, current: ${id}`
                );
                this.context!.intervalTimeCount = createIntervalTimeCount(
                    `interval task--${id}`
                );
                await this._task();
                // 每次定时任务结束后都要保存一次
                this.context?.record.save();
            }, interval);
        } else {
            console.time("all tasks");
            successLog("start once task");
            await this._task();
        }
    }
    private async _task() {
        this._checkInit();
        if (Array.isArray(this.config!.resource.url)) {
            for (const url of this.config!.resource.url) {
                await this._roundTask(url);
            }
        } else {
            this._roundTask(this.config!.resource.url);
        }
    }
    private async _roundTask(url: string) {
        this._checkInit();
        const { config, plugins } = this.context!;

        // 获取resource并且记录耗时
        successLog("get resource from " + url);
        console.time("get resource");
        const resource = await getResourceString(url);
        console.timeEnd("get resource");

        // 处理resource
        let parser: PomeloPlugin["parser"] = config.resource.parser;
        let worker: PomeloPlugin["worker"] = config.resource.worker;

        // 遍历插件，只有最后一个配置的worker和parser会生效
        plugins.forEach((p) => {
            parser = p.parser;
            worker = p.worker;
        });

        if (!parser || !worker) {
            throw "please support right parser and worker!";
        }

        // parse要放外面,避免重复
        const parsed = await parser(resource);
        if (!parsed) throw "the parser dont return valid analytic product";

        // 遍历规则集
        // 这里不需要await,不然会出现规则匹配顺序异常
        Object.entries(config.rules).forEach(([name, unit]) => {
            const ruleContext: PomeloRuleContext = {
                ruleUnit: {
                    ...unit,
                    name,
                },
                ...this.context!,
            };
            const rule = createRule(ruleContext);

            plugins.forEach((p) => p.onBeforeParse?.());
            rule.onBeforeParse?.();

            const matchContext: PomeloMatchContext = {
                resource,
                rule,
                ...this.context!,
            };

            worker?.(parsed, (content, link) => {
                matchRule({ ...matchContext, content, link });
            });

            plugins.forEach((p) => p.onParsed?.());
            rule.onParsed?.();
        });
    }
    //#endregion

    //#region 配置插件
    public use(plugin: PomeloPlugin) {
        this._checkInit();
        this.context!.plugins.push(plugin);
    }
    //#endregion
}
