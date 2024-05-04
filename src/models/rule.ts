import { PomeloConfig } from "./config";

export type PomeloHandler = (content: string) => boolean;
export interface PomeloRule {
    name: string;
    resource?: PomeloConfig["resource"];
    option: PomeloDownloadOption;
    accept?: PomeloHandler;
    reject?: PomeloHandler;
    onBeforeParse?: () => void;
    onParsed?: () => void;
    onAccepted?: (title: string, link: string) => Promise<void>;
    onRejected?: (title: string, link: string) => void;
}

export type PomeloRuleMap = {
    [name in string]: PomeloRuleUnit;
};

export interface PomeloRegExp {
    expr: string;
    flag: string;
}
export interface PomeloRuleUnit {
    option: PomeloDownloadOption;
    accept: RuleHandlerOption;
    reject: RuleHandlerOption;
}

export type RuleHandlerOption =
    | PomeloRegExp[][]
    | string[][]
    | string
    | PomeloRegExp
    | PomeloHandler;

export type PomeloDownloadOption = {
    dir: string;
    host?: string;
    port?: string;
    token?: string;
};
