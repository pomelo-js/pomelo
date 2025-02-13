import { PomeloRuleMap } from "./rule";

export interface PomeloConfig {
    interval?: number | string;
    record?: {
        expire: number | string;
    };
    resource: {
        url: string;
        parser?: (str: string) => object | Promise<object> | undefined | null; //将字符串解析成合法js对象
        worker?: (
            resource: object,
            handler: (content: string, link: string) => void | Promise<void>
        ) => void | Promise<void>; //处理解析后的对象
    };
    download: {
        // 默认支持 aria2 & json-rpc 下载
        aria2?: {
            enabled: boolean;
            env: boolean;
            host: string;
            port: string;
            token: string;
        };
        // 默认支持 自定义bun-shell 下载
        custom?: {
            enabled: boolean;
            command: string;
        };
    };
    rules: PomeloRuleMap;
}
