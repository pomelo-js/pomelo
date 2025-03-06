import { parseStringPromise } from "xml2js";
import { PomeloPlugin } from "../../models";
import { isMikanamiRSSItem } from "./mikanani";
import { isNyaaRSSItem } from "./nyaa";
import { isShareAcgnxRSSItem } from "./share-acgnx";
import { isOuoRSSItem } from "./ouo";
import { Converter } from "opencc-js";

const converter = Converter({ from: "tw", to: "cn" });

function isSupportRSS(target: any): boolean {
    try {
        return /(mikanani|share.acgnx|nyaa|ouo)/.test(
            target.rss.channel[0].link[0]
        );
    } catch (error) {
        return false;
    }
}

function getURLFromRSSItem(item: any): string {
    if (isMikanamiRSSItem(item) || isShareAcgnxRSSItem(item)) {
        return item.enclosure[0].$.url;
    } else if (isNyaaRSSItem(item) || isOuoRSSItem(item)) {
        return item.link[0];
    } else {
        throw "Wrong RSSItem";
    }
}

function getContentFromRSSItem(item: any): string {
    if (
        isMikanamiRSSItem(item) ||
        isNyaaRSSItem(item) ||
        isShareAcgnxRSSItem(item) ||
        isOuoRSSItem(item)
    ) {
        return item.title[0];
    } else {
        throw "Wrong RSSItem";
    }
}

export function RSS(): PomeloPlugin {
    return {
        name: "pomelo-rss",
        onBeforeParse(context) {
            Object.entries(context.config.rules).forEach(([_, unit]) => {
                if (Array.isArray((unit.accept as any)[0])) {
                    unit.accept = (unit.accept as string[][]).map((items) => {
                        return items.map((item) => converter(item));
                    });
                }
                if (Array.isArray((unit.reject as any)[0])) {
                    unit.reject = (unit.reject as string[][]).map((items) => {
                        return items.map((item) => converter(item));
                    });
                }
            });
        },
        onBeforeAccept(_, item) {
            // 规范化磁力链接
            if (item.link.startsWith("magnet:?xt=urn")) {
                const url = new URL(item.link);
                if (!url.searchParams.get("dn")) {
                    url.searchParams.set("dn", item.title);
                }
                item.link = url.toString();
            }
        },
        async parser(target: string) {
            const obj = await parseStringPromise(converter(target));
            if (isSupportRSS(obj)) {
                return obj;
            } else {
                throw "unsupported RSS feeds, please replace them with supported RSS feeds.";
            }
        },
        async worker(resource, handler) {
            for (const ch of (resource as any).rss.channel) {
                for (const item of ch.item) {
                    await handler(
                        getContentFromRSSItem(item),
                        getURLFromRSSItem(item)
                    );
                }
            }
        },
    };
}
