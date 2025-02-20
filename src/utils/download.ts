import { readFile } from "fs/promises";
import { PomeloRule, PomeloRuleMatchedItem } from "../models/rule";
import { PomeloConfig } from "../models/config";
import { resolve } from "path";
import { get } from "node:http";

// 推送下载请求到aria2
export async function postAria2DownloadRequest(
    config: PomeloConfig,
    rule: PomeloRule,
    item: PomeloRuleMatchedItem
) {
    const { aria2 } = config.download!;
    let token = process.env["POMELO_ARIA2_TOKEN"] || aria2!.token || "";
    let host = process.env["POMELO_ARIA2_HOST"] || aria2!.host || "";
    let port = process.env["POMELO_ARIA2_PORT"] || aria2!.port || "";

    const dir = rule._replaceVar(
        rule.options.download?.dir || config.download!.dir!,
        item
    );
    const data = {
        jsonrpc: "2.0",
        method: "aria2.addUri",
        id: "pomelo-aria2-" + Date.now(),
        params: [`token:${token}`, [item.link], { dir }],
    };

    return fetch(`${host}:${port}/jsonrpc`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// 获取资源
export async function getResourceString(url: string): Promise<string> {
    try {
        // 网络下载
        if (url.includes("http") || url.includes("https")) {
            const [host, port] = (
                process.env["HTTP_PROXY"] ||
                process.env["HTTPS_PROXY"] ||
                ":"
            )?.split(":");
            if (host && port) {
                return new Promise((resolve) => {
                    get(
                        {
                            path: url,
                            host,
                            port,
                        },
                        (res) => {
                            const chunks: Buffer[] = [];
                            res.on("data", (chunk) => {
                                chunks.push(chunk);
                            });
                            res.on("end", () => {
                                resolve(
                                    Buffer.concat(chunks as any).toString()
                                );
                            });
                        }
                    );
                });
            } else {
                const res = await fetch(url);
                return await res.text();
            }
        } else {
            //本地加载
            const buf = await readFile(resolve(url));
            return buf.toString();
        }
    } catch (error) {
        throw "Failed to get RSS feed, please check uri!";
    }
}
