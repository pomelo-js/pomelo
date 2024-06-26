import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { load as loadYaml } from "js-yaml";
import { PomeloConfig } from "../models/config";
import { PomeloRecordMap } from "../models/record";

//加载配置文件,支持五种
export async function loadConfig(path: string): Promise<PomeloConfig> {
    const tsConfigPath = path + "/pomelo.config.ts";
    if (existsSync(tsConfigPath)) {
        //这里使用默认导出
        return (await import(tsConfigPath)).default;
    }

    const jsConfigPath = path + "/pomelo.config.js";
    if (existsSync(jsConfigPath)) {
        //这里使用默认导出
        return (await import(jsConfigPath)).default;
    }

    const jsonConfigPath = path + "/pomelo.json";
    if (existsSync(jsonConfigPath)) {
        return (await import(jsonConfigPath)).default;
    }

    const yamlConfigPath = path + "/pomelo.yaml";
    if (existsSync(yamlConfigPath)) {
        const config = loadYaml(
            (await readFile(yamlConfigPath)).toString()
        ) as PomeloConfig;
        return config;
    }

    const ymlConfigPath = path + "/pomelo.yml";
    if (existsSync(ymlConfigPath)) {
        const config = loadYaml(
            (await readFile(ymlConfigPath)).toString()
        ) as PomeloConfig;
        return config;
    } else {
        throw `failed to find pomelo.config.ts/pomelo.json/pomelo.yaml/pomelo.yml from ${path}, please use -d to specify the path of the dir to the configuration file.`;
    }
}

//加载记录文件
export async function loadRecord(path: string): Promise<PomeloRecordMap> {
    const emptyRecord: PomeloRecordMap = {
        accepted: {
            title: {},
            link: {},
        },
        rejected: {
            title: {},
            link: {},
        },
    };
    const recordPath = path + "/__record.json";
    if (existsSync(recordPath)) {
        const record = (await import(recordPath)).default;
        return {
            ...emptyRecord,
            ...record,
        };
    } else {
        return { ...emptyRecord };
    }
}
