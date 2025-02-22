import { resolve } from "path";
import { createIntervalTimeCount, getResourceString } from "../utils";
import { successLog, warnLog } from "../utils/log";
import type { PomeloRunContext, PomeloConfig, PomeloPlugin } from "../models";
import { PomeloRule } from "./rule";
import {
    checkConfig,
    loadConfig,
    loadRecord,
    parseToMillisecond,
} from "../utils";
import { PomeloRecord } from "./record";

interface PomeloRunOptions {
    onlyRecord: boolean;
    plugins: PomeloPlugin[];
}

// Pomelo引擎
export class PomeloEngine {
    private _isInited = false;
    public config: PomeloConfig | null = null;
    public record: PomeloRecord | null = null;
    // private context: PomeloRunContext | null = null;

    private _checkInit() {
        if (!this._isInited) {
            throw "The engine has not been initialized.";
            // errorLog("The engine has not been initialized.");
        }
    }

    //#region 初始化

    public async init(config: PomeloConfig, record?: PomeloRecord) {
        if (this._isInited) {
            return warnLog("The pomelo engine has been initialized.");
        }

        this.config = config;
        this.record = record || new PomeloRecord(this.config);
        this._initBase();
    }
    public async initFromFile(
        configPath?: string,
        recordPath: string = resolve(".")
    ) {
        if (this._isInited) {
            return warnLog("The pomelo engine has been initialized.");
        }

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
        this._initBase();
    }
    private async _initBase() {
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
            this.record!.save();
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
            plugins: [],
            ...options,
        };

        // 初始化上下文
        const context: PomeloRunContext = {
            config: this.config!,
            record: this.record!,
            intervalTimeCount: void 0,
            downloadMap: {
                link: {},
                title: {},
            },
            ...options,
        };

        const interval = parseToMillisecond(this.config!.interval || 0);
        if (interval) {
            let id = 0;
            successLog(
                `start interval task, interval: ${interval}, current: ${id}`
            );
            context.intervalTimeCount = createIntervalTimeCount(
                `interval task--${id++}`
            );
            await this._task(context);
            setInterval(async () => {
                successLog(
                    `start interval task, interval: ${interval}, current: ${id}`
                );
                context.intervalTimeCount = createIntervalTimeCount(
                    `interval task--${id}`
                );
                await this._task(context);
                // 每次定时任务结束后都要保存一次
                this.record!.save();
            }, interval);
        } else {
            console.time("all tasks");
            successLog("start once task");
            await this._task(context);
        }
    }
    private async _task(context: PomeloRunContext) {
        this._checkInit();
        const url = this.config!.resource.url;
        if (Array.isArray(url)) {
            for (const _url of url) {
                await this._roundTask(context, _url);
            }
        } else {
            this._roundTask(context, url);
        }
    }
    private async _roundTask(context: PomeloRunContext, url: string) {
        this._checkInit();
        const { config, plugins } = context;

        // 获取 resource 并且记录耗时
        successLog("get resource from " + url);
        console.time("get resource");
        const resource = await getResourceString(url);
        console.timeEnd("get resource");

        // 处理 resource
        let parser: PomeloPlugin["parser"] = config.resource.parser;
        let worker: PomeloPlugin["worker"] = config.resource.worker;

        // 遍历插件，只有最后一个配置的 worker 和 parser 会生效
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
        // 这里不需要 await ,不然会出现规则匹配顺序异常
        Object.entries(config.rules).forEach(([name, unit]) => {
            const rule = new PomeloRule({
                name,
                engine: this,
                unit,
            });

            plugins.forEach((p) => p.onBeforeParse?.(context));
            rule.onBeforeParse?.(context);

            worker?.(parsed, (title, link) => {
                rule.match(context, { title, link });
            });

            plugins.forEach((p) => p.onParsed?.(context));
            rule.onParsed(context);
        });
    }
    //#endregion
}
