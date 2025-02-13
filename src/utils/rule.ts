import { PomeloRule } from "../models";

/**
 * 替换字符串中对 rule 变量的引用
 * @param str 源字符串
 * @param rule 规则
 */
export function replaceRuleVar(str: string, rule: PomeloRule) {
    return str
        .replaceAll("{{rule.name}}", rule.name)
        .replaceAll("{{rule.options.download.dir}}", rule.options.download.dir);
}
