import { readFile } from "fs/promises";
import { resolve } from "path";
import { get } from "node:http";

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
