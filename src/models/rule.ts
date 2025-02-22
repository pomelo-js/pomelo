import { PomeloConfig } from "./config";

export type PomeloMatcher<
    T extends PomeloRuleMatchedItem = PomeloRuleMatchedItem
> = (item: T) => boolean;
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
    options?: PomeloRuleOptions;
    accept: PomeloRuleMatcherOptions;
    reject: PomeloRuleMatcherOptions;
}

export type PomeloRuleMatcherOptions =
    | PomeloRegExp[][]
    | string[][]
    | string
    | PomeloRegExp
    | PomeloMatcher;

export interface PomeloRuleOptions {
    replace?: Record<string, string>;
    actions?: PomeloConfig["actions"];
    plugins?: Record<string, any>;
}
