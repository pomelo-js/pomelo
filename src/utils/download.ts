import { readFile } from "fs/promises";
import { PomeloRule } from "../models/rule";
import { PomeloConfig } from "../models/config";
import { resolve } from "path";
import { get } from "node:http";
import { replaceRuleVar } from "./rule";
import { $ } from "bun";
import { carryCommand } from "./shell";

// 推送下载请求到aria2
export async function postAria2DownloadRequest(
    config: PomeloConfig,
    url: string,
    rule: PomeloRule
) {
    const { aria2 } = config.download;
    let token = process.env["POMELO_ARIA2_TOKEN"] || aria2!.token || "";
    let host = process.env["POMELO_ARIA2_HOST"] || aria2!.host || "";
    let port = process.env["POMELO_ARIA2_PORT"] || aria2!.port || "";

    const dir = replaceRuleVar(rule.options.download.dir, rule);
    const data = {
        jsonrpc: "2.0",
        method: "aria2.addUri",
        id: "pomelo-aria2-" + Date.now(),
        params: [`token:${token}`, [url], { dir }],
    };

    return fetch(`${host}:${port}/jsonrpc`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// 执行 rclone 命令
export async function carryCustomDownloadCommand(
    config: PomeloConfig,
    rule: PomeloRule
) {
    const { custom } = config.download;
    const command = replaceRuleVar(custom!.command, rule);
    return await carryCommand(command);
}

// 获取并且解析资源,返回一个合法的js对象
export async function getResourceString(
    options: PomeloConfig["resource"]
): Promise<string> {
    try {
        if (options.url.includes("http") || options.url.includes("https")) {
            const [host, port] = (
                process.env["HTTP_PROXY"] ||
                process.env["HTTPS_PROXY"] ||
                ":"
            )?.split(":");
            if (host && port) {
                return new Promise((resolve) => {
                    get(
                        {
                            path: options.url,
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
                const res = await fetch(options.url);
                return await res.text();
            }
        } else {
            //本地加载
            const buf = await readFile(resolve(options.url));
            return buf.toString();
        }
    } catch (error) {
        throw "Failed to get RSS feed, please check uri!";
    }
}
