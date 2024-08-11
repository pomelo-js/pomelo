import { PomeloRegExp, RuleHandlerOption } from "../models/rule";

export function isRegExpOption(opt: RuleHandlerOption): opt is PomeloRegExp {
    const _tmp = opt as PomeloRegExp;
    if (!_tmp) return false;
    return !!_tmp.expr && !!_tmp.flag;
}
