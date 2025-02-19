import { resolve } from "path";
import { getResourceString } from "../utils";
import { errorLog, successLog, warnLog } from "../utils/log";
import type {
    PomeloTaskContext,
    PomeloConfig,
    PomeloMatchContext,
    PomeloRuleContext,
    PomeloRecordMap,
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

// 初始化
async function _init({
    configMap,
    recordMap,
    onlyRecord,
}: {
    configMap: PomeloConfig | string;
    recordMap?: PomeloRecordMap | string;
    onlyRecord: boolean;
}) {
    try {
        //#region 解析路径, record 路径默认与 config 路径一致
        const configPath =
            typeof configMap === "string" ? resolve(configMap) : resolve(".");

        const recordPath =
            typeof recordMap === "string" ? resolve(recordMap) : configPath;
        //#endregion

        //#region 加载配置和记录
        const config =
            typeof configMap === "string"
                ? checkConfig(await loadConfig(configPath))
                : checkConfig(configMap);

        let record: PomeloRecord = new PomeloRecord(config, configPath);
        if (config.record) {
            if (typeof recordMap === "string" || !recordMap) {
                record = new PomeloRecord(
                    config,
                    configPath,
                    await loadRecord(recordPath)
                );
            } else {
                record = new PomeloRecord(config, configPath, recordMap);
            }
        }
        //#endregion

        //第一次执行时更新一次__record,删除过期的记录
        record.clean();

        //#region 解析定时任务
        const interval = parseToMillisecond(config.interval || 0);
        const intervalTimeCount = (id: number) => {
            console.time("interval task--" + id);
            return () => console.timeEnd("interval task--" + id);
        };
        //#endregion

        //#region 封装对象上下文
        const context: PomeloTaskContext = {
            config,
            record,
            plugins: [],
            intervalTimeCount: void 0,
            downloadMap: {
                link: {},
                title: {},
            },
            onlyRecord,
        };
        //#endregion

        //#region 绑定 process 回调
        //中断信号处理
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
            context.record.save();
        });
        //#endregion

        //#region 任务调度
        if (interval) {
            return {
                task: async () => {
                    let id = 0;
                    successLog(
                        `start interval task, interval: ${config.interval}, current: ${id}`
                    );
                    context.intervalTimeCount = intervalTimeCount(id++);
                    await _task(context);

                    setInterval(async () => {
                        successLog(
                            `start interval task, interval: ${config.interval}, current: ${id}`
                        );
                        context.intervalTimeCount = intervalTimeCount(id++);
                        await _task(context);
                        context.record.save(); //每次定时任务结束后都要保存一次
                    }, interval);
                },
                context,
            };
        } else {
            return {
                task: async () => {
                    console.time("all tasks");
                    successLog("start once task");
                    await _task(context);
                },
                context,
            };
        }
        //#endregion
    } catch (error) {
        errorLog(error + "");
        return null;
    }
}

// 任务上下文
async function _task(context: PomeloTaskContext) {
    const { config, plugins } = context;

    //获取resource并且记录耗时
    successLog("get resource from " + config.resource.url);
    console.time("get resource");
    const resource = await getResourceString(config.resource);
    console.timeEnd("get resource");

    //处理resource
    let parser: PomeloPlugin["parser"] = config.resource.parser;
    let worker: PomeloPlugin["worker"] = config.resource.worker;
    //遍历插件，只有最后一个配置的worker和parser会生效
    plugins.forEach((p) => {
        parser = p.parser;
        worker = p.worker;
    });
    if (parser && worker) {
        //parse要放外面,避免重复
        const parsed = await parser(resource);
        if (!parsed) throw "the parser dont return valid analytic product";

        //遍历规则集
        //这里不需要await,不然会出现规则匹配顺序异常
        Object.entries(config.rules).forEach(([name, unit]) => {
            const ruleContext: PomeloRuleContext = {
                ruleUnit: {
                    ...unit,
                    name,
                },
                ...context,
            };
            const rule = createRule(ruleContext);

            plugins.forEach((p) => p.onBeforeParse?.());
            rule.onBeforeParse?.();

            const matchContext: PomeloMatchContext = {
                resource,
                rule,
                ...context,
            };

            worker?.(parsed, (content, link) => {
                matchRule({ ...matchContext, content, link });
            });

            plugins.forEach((p) => p.onParsed?.());
            rule.onParsed?.();
        });
    } else {
        throw "please support right parser and worker!";
    }
}

export async function createPomelo({
    config,
    record,
    onlyRecord = false,
}: {
    config: PomeloConfig | string;
    record?: PomeloRecordMap | string;
    onlyRecord?: boolean;
}) {
    try {
        const result = await _init({
            configMap: config,
            recordMap: record,
            onlyRecord,
        });
        if (!result) throw "init error!";
        return {
            task: result.task,
            use(plugin: PomeloPlugin) {
                result.context.plugins.push(plugin);
            },
        };
    } catch (error) {
        throw "error in createPomelo: " + error;
    }
}

export default createPomelo;
