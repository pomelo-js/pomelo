import { PomeloConfig } from "./config";
import { PomeloRunContext } from "./context";

export type PomeloPlugin = {
    name?: string;
    onAccepted?: (
        this: PomeloPlugin,
        context: PomeloRunContext,
        item: any
    ) => void;
    onRejected?: (
        this: PomeloPlugin,
        context: PomeloRunContext,
        item: any
    ) => void;
    onBeforeParse?: (this: PomeloPlugin, context: PomeloRunContext) => void;
    onParsed?: (this: PomeloPlugin, context: PomeloRunContext) => void;
    parser?: PomeloConfig["resource"]["parser"];
    worker?: PomeloConfig["resource"]["worker"];
};
