import { PomeloRuleMap } from "./rule";

export interface PomeloConfig {
    interval?: number | string;
    record?: {
        expire: number | string;
    };
    replace?: Record<string, string>;
    resource: {
        url: string | string[];
        parser?: (str: string) => object | Promise<object> | undefined | null; //将字符串解析成合法js对象
        worker?: (
            resource: object,
            handler: (content: string, link: string) => void | Promise<void>
        ) => void | Promise<void>; //处理解析后的对象
    };
    download?: {
        // 默认支持 aria2 & json-rpc 下载
        dir?: string;
        aria2?: {
            enabled: boolean;
            env: boolean;
            host: string;
            port: string;
            token: string;
        };
    };
    actions?: {
        accept?: {
            download: boolean;
            command?: string[] | string;
        };
        reject?: {
            command?: string[] | string;
        };
    };
    rules: PomeloRuleMap;
}
