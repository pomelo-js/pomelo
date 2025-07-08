import { parseStringPromise } from "xml2js";
import { PomeloPlugin } from "../../models";
import { isMikanamiRSSItem } from "./mikanani";
import { getReplaceFromNyaaRSSItem, isNyaaRSSItem } from "./nyaa";
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

function getURLFromRSSItem(item: any): {
    link: string;
    magnet: string;
    torrent: string;
} {
    if (isMikanamiRSSItem(item)) {
        const hash = item.enclosure[0].$.url.split("/").pop();
        return {
            link: item.enclosure[0].$.url,
            magnet: `magnet:?xt=urn:btih:${hash}`,
            torrent: item.enclosure[0].$.url,
        };
    } else if (isShareAcgnxRSSItem(item)) {
        const hash = item.enclosure[0].$.url
            .split("magnet:?xt=urn:btih:")
            .pop()
            ?.split("&tr")
            .shift();
        const date = new Date(item.pubDate[0]).getTime() / 1000;
        const torrent = `https://share.acgnx.se/down.php?date=${date}&hash=${hash}`;
        return {
            link: item.enclosure[0].$.url,
            magnet: item.enclosure[0].$.url,
            torrent,
        };
    } else if (isNyaaRSSItem(item)) {
        return {
            link: item.link[0],
            magnet: `magnet:?xt=urn:btih:${item["nyaa:infoHash"]?.[0]}`,
            torrent: item.link[0],
        };
    } else if (isOuoRSSItem(item)) {
        const hash = item.link[0].split("/").pop();
        return {
            link: item.link[0],
            magnet: `magnet:?xt=urn:btih:${hash}`,
            torrent: item.link[0],
        };
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
                        return items.map((item) => converter(item + ""));
                    });
                }
                if (Array.isArray((unit.reject as any)[0])) {
                    unit.reject = (unit.reject as string[][]).map((items) => {
                        return items.map((item) => converter(item + ""));
                    });
                }
            });
        },
        async parser(target: string) {
            const obj = await parseStringPromise(converter(target));
            if (isSupportRSS(obj)) {
                return obj;
            } else {
                throw "unsupported RSS feeds, please replace them with supported RSS feeds.";
            }
        },
        async worker(_, resource, handler) {
            for (const ch of (resource as any).rss.channel) {
                for (const item of ch.item) {
                    const URL = getURLFromRSSItem(item);
                    const title = getContentFromRSSItem(item);
                    await handler({
                        title,
                        ...URL,
                    });
                }
            }
        },
    };
}
