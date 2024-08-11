import { writeFileSync } from "fs";
import type {
    PomeloConfig,
    PomeloRecordMap,
    PomeloRecordPartMap,
    RecordUnit,
} from "../models";
import { errorLog } from "../utils/log";
import { join } from "path";
import { parseToMillisecond } from "../utils";

const emptyRecordPartMap = {
    title: {},
    link: {},
};
const emptyRecordMap: PomeloRecordMap = {
    accepted: { ...emptyRecordPartMap },
    rejected: { ...emptyRecordPartMap },
};

class PomeloRecordPart {
    map: PomeloRecordPartMap;
    config: PomeloConfig;
    constructor(
        config: PomeloConfig,
        map: PomeloRecordPartMap = { ...emptyRecordPartMap }
    ) {
        this.config = config;
        this.map = { ...emptyRecordPartMap, ...map };
    }
    public delete(type: "title" | "link", key: string) {
        this.map[type][key] = void 0;
    }
    public add(type: "title" | "link", key: string) {
        const expired = this.config.record?.expire
            ? parseToMillisecond(this.config.record.expire) / 1000 //这里要转化成秒
            : 60 * 60 * 60;
        this.map[type][key] = this.createRecord(expired);
    }
    private createRecord(expired: number): RecordUnit {
        return {
            expired: expired + Math.floor(Date.now() / 1000), //秒时间戳
        };
    }
    //判断记录是否有效
    public isValid(type: "title" | "link", key: string): boolean {
        const expired = this.map[type][key]?.expired;
        return expired ? expired > Math.floor(Date.now() / 1000) : false;
    }
    public clean() {
        const newMap: PomeloRecordMap["accepted"] = {
            title: {},
            link: {},
        };
        const titles = Object.entries(this.map.title);
        titles.forEach(([key, val]) => {
            const secondStamp = Math.floor(Date.now() / 1000);
            //保留没过期的RecordUnit
            if (val?.expired && val?.expired > secondStamp) {
                newMap.title[key] = val;
            }
        });
        const links = Object.entries(this.map.link);
        links.forEach(([key, val]) => {
            const secondStamp = Math.floor(Date.now() / 1000);
            //保留没过期的RecordUnit
            if (val?.expired && val?.expired > secondStamp) {
                newMap.link[key] = val;
            }
        });
        //替换
        this.map = newMap;
    }
}

export class PomeloRecord {
    config: PomeloConfig;
    path: string;
    accepted: PomeloRecordPart;
    rejected: PomeloRecordPart;
    constructor(
        config: PomeloConfig,
        path: string,
        recordMap: PomeloRecordMap = { ...emptyRecordMap }
    ) {
        this.config = config;
        this.path = path;
        this.accepted = new PomeloRecordPart(config, recordMap["accepted"]);
        this.rejected = new PomeloRecordPart(config, recordMap["rejected"]);
    }
    //清理过期记录
    public clean() {
        this.accepted.clean();
        this.rejected.clean();
    }
    //保存
    public save() {
        if (!this.config.record) return;

        //先清洗一遍record
        this.clean();
        try {
            writeFileSync(join(this.path + "/__record.json"), this.toJSON());
        } catch (error) {
            errorLog(`error in saved record!\nerror:${error}`);
        }
    }
    public toJSON() {
        return JSON.stringify({
            accepted: this.accepted.map,
            rejected: this.rejected.map,
        });
    }
}
