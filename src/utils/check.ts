import { PomeloConfig } from "../models/config";

/**
 * 检查是否是正确端口号
 */
function checkPort(port: string) {
    return (!parseInt(port) && parseInt(port) < 0) || parseInt(port) > 65535;
}

/**
 * 检查是否是正确主机
 */
function checkHost(host: string) {
    return !/https?:\\/.test(host);
}

// checker
export function checkConfig(config: PomeloConfig) {
    try {
        const { interval, resource, record, download } = config;
        //检查interval
        if (interval && typeof interval === "string") {
            switch (interval[interval.length - 1]) {
                case "s":
                case "m":
                case "h":
                case "d":
                    break;
                default:
                    throw "string interval configuration items must end with the characters s (seconds), m (minutes), h (hours), d (days)";
            }
        }
        //检查resource
        if (resource) {
            if (!resource.url)
                throw "resource.url is a required configuration item";
        } else {
            throw "resource is a required configuration item";
        }
        //TODO 检查 record 配置
        if (record) {
        }
        /**检查下载配置
         * 优先级排序：
         * 1. aria2
         * 2. rclone & pikpak
         * 3. custom
         **/
        if (download) {
            let allow = false;
            // 检查 aria2 下载配置
            if (download.aria2 && download.aria2.enabled) {
                if (typeof download.aria2.env !== "boolean") {
                    throw "download.aria2.env must be boolean";
                }
                if (download.aria2.host && checkHost(download.aria2.port)) {
                    throw "download.aria2.host must be https or http protocols";
                }
                if (download.aria2.port && checkPort(download.aria2.port)) {
                    throw "invalid download.aria2.port";
                }
                if (download.aria2.token) {
                }
                allow = true;
            }

            // 检查自定义下载配置
            if (download.custom && download.custom.enabled) {
                allow = true;
            }

            if (!allow) {
                throw "no configuration download";
            }
        }
        return config;
    } catch (error) {
        throw "error in checkConfig: " + error;
    }
}
