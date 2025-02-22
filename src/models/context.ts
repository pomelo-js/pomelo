import { PomeloRecord } from "../core/record";
import { PomeloConfig } from "./config";
import { PomeloPlugin } from "./plugin";
import {  PomeloRuleUnit } from "./rule";

// 运行上下文
export type PomeloRunContext = {} & PomeloBaseContext;

// 规则上下文
export type PomeloRuleContext = {
    ruleUnit: {
        name: string;
    } & PomeloRuleUnit;
} & PomeloBaseContext;

// 基础上下文
export type PomeloBaseContext = {
    config: PomeloConfig;
    record: PomeloRecord;
    onlyRecord: boolean;
    intervalTimeCount?: () => void;
    downloadMap: {
        link: Record<string, boolean>;
        title: Record<string, boolean>;
    }; //映射下载情况
    plugins: PomeloPlugin[];
};
