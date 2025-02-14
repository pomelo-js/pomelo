import { PomeloRule, PomeloRuleMatchedItem } from "../models";

/**
 * 替换字符串中对 rule 变量的引用
 * @param str 源字符串
 * @param rule 规则
 * @param link 链接
 */
export function replaceRuleVar(
    str: string,
    rule: PomeloRule,
    item: PomeloRuleMatchedItem
) {
    return str
        .replaceAll("{{rule.name}}", rule.name)
        .replaceAll("{{item.link}}", item.link)
        .replaceAll("{{item.title}}", item.title)
        .replaceAll("{{rule.options.download.dir}}", rule.options.download.dir);
}
