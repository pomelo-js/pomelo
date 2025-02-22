import { PomeloRule } from "../core";
import { PomeloRecord } from "../core/record";
import { PomeloConfig } from "./config";
import { PomeloPlugin } from "./plugin";

// 运行上下文
export type PomeloRunContext = {} & PomeloBaseContext;

export interface PomeloPluginContext extends PomeloRunContext {
    rule: PomeloRule;
}

// 基础上下文
export type PomeloBaseContext = {
    config: PomeloConfig;
    record: PomeloRecord;
    onlyRecord: boolean;
    intervalTimeCount?: () => void;
    recordMap: {
        link: Record<string, boolean>;
        title: Record<string, boolean>;
    }; //映射下载情况
    plugins: PomeloPlugin[];
};
