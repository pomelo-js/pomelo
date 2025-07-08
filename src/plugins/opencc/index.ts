import { PomeloPlugin } from "../../models";
import { Converter } from "opencc-js";

const converter = Converter({ from: "tw", to: "cn" });

export function OpenCC(): PomeloPlugin {
    return {
        name: "pomelo-opencc",
        async onBeforeAccept(_, item) {
            item.title = converter(item.title);
        },
    };
}
