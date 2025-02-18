import { PomeloConfig } from "./config";

export type PomeloHandler = (content: string) => boolean;
export interface PomeloRule {
    name: string;
    resource?: PomeloConfig["resource"];
    options: PomeloRuleOptions;
    accept?: PomeloHandler;
    reject?: PomeloHandler;
    _download: (item: PomeloRuleMatchedItem) => Promise<void> | void;
    _replaceVar: (content: string, item: PomeloRuleMatchedItem) => string;
    _carryCommand: (item: PomeloRuleMatchedItem) => Promise<void> | void;
    onBeforeParse?: () => void;
    onParsed?: () => void;
    onAccepted?: (title: string, link: string) => Promise<void>;
    onRejected?: (title: string, link: string) => void;
}

export interface PomeloRuleMatchedItem {
    link: string;
    title: string;
}

export type PomeloRuleMap = {
    [name in string]: PomeloRuleUnit;
};

export interface PomeloRegExp {
    expr: string;
    flag: string;
}
export interface PomeloRuleUnit {
    options: PomeloRuleOptions;
    accept: RuleHandlerOptions;
    reject: RuleHandlerOptions;
}

export type RuleHandlerOptions =
    | PomeloRegExp[][]
    | string[][]
    | string
    | PomeloRegExp
    | PomeloHandler;

export interface PomeloRuleOptions {
    download: {
        /**
         * 下载目录
         */
        dir: string;
        /**
         * 要执行的命令
         */
        command?: string;
    };
}
