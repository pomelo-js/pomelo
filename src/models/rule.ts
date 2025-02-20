import { PomeloConfig } from "./config";

export type PomeloHandler = (content: string) => boolean;
export interface PomeloRule {
    name: string;
    resource?: PomeloConfig["resource"];
    options: PomeloRuleOptions;
    accept?: PomeloHandler;
    reject?: PomeloHandler;
    _download: (item: PomeloRuleMatchedItem) => Promise<void> | void;
    _replaceVar: (
        content: string | string[],
        item: PomeloRuleMatchedItem
    ) => string | string[];
    _replaceBase: (content: string, item: PomeloRuleMatchedItem) => string;
    _carryCommand: (
        command: string | string[],
        item: PomeloRuleMatchedItem
    ) => Promise<void> | void;
    onBeforeParse?: () => void;
    onParsed?: () => void;
    onAccepted?: (title: string, link: string) => Promise<void>;
    onRejected?: (title: string, link: string) => void;
    onAcceptedHook: (item: PomeloRuleMatchedItem) => boolean | Promise<boolean>;
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
    replace?: Record<string, string>;
    hooks?: PomeloConfig["hooks"];
    download?: {
        /**
         * 下载目录
         */
        dir?: string;
    };
}
