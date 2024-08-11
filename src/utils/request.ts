import { readFile } from "fs/promises";
import { PomeloDownloadOption } from "../models/rule";
import { PomeloConfig } from "../models/config";
import { resolve } from "path";
import { get } from "node:http";

// 推送下载请求到aria2
export async function postDownloadRequest(
    config: PomeloConfig,
    link: string,
    opts: PomeloDownloadOption,
    ruleName: string
) {
    let token =
        process.env["POMELO_ARIA2_TOKEN"] ||
        opts.token ||
        config.aria2.token ||
        "";

    let host =
        process.env["POMELO_ARIA2_HOST"] ||
        opts.host ||
        config.aria2.host ||
        "";
    let port =
        process.env["POMELO_ARIA2_PORT"] ||
        opts.port ||
        config.aria2.port ||
        "";

    const url = `${host}:${port}/jsonrpc`;

    const dir = opts.dir.replaceAll("{{rule.name}}", ruleName);
    const data = {
        jsonrpc: "2.0",
        method: "aria2.addUri",
        id: "pomelo-aria2-" + Date.now(),
        params: [`token:${token}`, [link], { dir }],
    };

    return fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

//获取并且解析资源,返回一个合法的js对象
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
                                resolve(Buffer.concat(chunks).toString());
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
