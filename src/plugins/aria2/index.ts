import { PomeloPlugin } from "../../models";
import { errorLog } from "../../utils/log";

interface GlobalDownloadOptions {
    // 默认支持 aria2 & json-rpc 下载
    dir?: string;
    env: boolean;
    host: string;
    port: string;
    token: string;
}

interface RuleDownloadOptions {
    /**
     * 下载目录
     */
    dir?: string;
}

export function Aria2(): PomeloPlugin {
    return {
        name: "pomelo-aria2",
        async onAccepted(context, item) {
            const _mark = "3.post download request to aria2 -- " + item.link;
            console.time(_mark);

            const { config, rule } = context;
            const globalDownloadOptions = (config as any).plugins
                ?.aria2 as GlobalDownloadOptions;

            const ruleDownloadOptions = (rule as any).plugins
                ?.aria2 as RuleDownloadOptions;

            if (!globalDownloadOptions && !ruleDownloadOptions) {
                return;
            }

            let token =
                process.env["POMELO_ARIA2_TOKEN"] ||
                globalDownloadOptions.token ||
                "";
            let host =
                process.env["POMELO_ARIA2_HOST"] ||
                globalDownloadOptions.host ||
                "";
            let port =
                process.env["POMELO_ARIA2_PORT"] ||
                globalDownloadOptions.port ||
                "";

            const dir = rule.replaceVar(
                ruleDownloadOptions?.dir || globalDownloadOptions?.dir || "/",
                item
            );
            const data = {
                jsonrpc: "2.0",
                method: "aria2.addUri",
                id: "pomelo-aria2-" + Date.now(),
                params: [`token:${token}`, [item.link], { dir }],
            };

            try {
                await fetch(`${host}:${port}/jsonrpc`, {
                    method: "POST",
                    body: JSON.stringify(data),
                });
            } catch (error) {
                errorLog("plugins/pomelo-aria2 is errored! " + error);
            }

            console.timeEnd(_mark);
        },
    };
}
