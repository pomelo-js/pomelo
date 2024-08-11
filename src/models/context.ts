import { PomeloRecord } from "../core/record";
import { PomeloConfig } from "./config";
import { PomeloPlugin } from "./plugin";
import { PomeloRule, PomeloRuleUnit } from "./rule";

export type PomeloTaskContext = {} & PomeloCommonContext;

export type PomeloRuleContext = {
    ruleUnit: {
        name: string;
    } & PomeloRuleUnit;
} & PomeloCommonContext;

export type PomeloMatchContext = {
    resource: string;
    rule: PomeloRule;
} & PomeloCommonContext;

export type PomeloCommonContext = {
    config: PomeloConfig;
    record: PomeloRecord;
    onlyRecord: boolean;
    intervalTimeCount?: () => void;
    downloadMap: Record<string, boolean>; //映射下载情况
    plugins: PomeloPlugin[];
};
