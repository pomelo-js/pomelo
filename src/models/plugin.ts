import { PomeloConfig } from "./config";
import { PomeloPluginContext, PomeloRunContext } from "./context";
import { PomeloRuleMatchedItem } from "./rule";

export type PomeloPlugin = {
    name?: string;
    onAccepted?: (
        this: PomeloPlugin,
        context: PomeloPluginContext,
        item: PomeloRuleMatchedItem
    ) => void;
    onRejected?: (
        this: PomeloPlugin,
        context: PomeloPluginContext,
        item: PomeloRuleMatchedItem
    ) => void;
    onBeforeAccept?: (
        this: PomeloPlugin,
        context: PomeloPluginContext,
        item: PomeloRuleMatchedItem
    ) => void;
    onBeforeReject?: (
        this: PomeloPlugin,
        context: PomeloPluginContext,
        item: PomeloRuleMatchedItem
    ) => void;
    onBeforeParse?: (this: PomeloPlugin, context: PomeloRunContext) => void;
    onParsed?: (this: PomeloPlugin, context: PomeloRunContext) => void;
    parser?: PomeloConfig["resource"]["parser"];
    worker?: PomeloConfig["resource"]["worker"];
};
