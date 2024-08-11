import { parseStringPromise } from "xml2js";
import { PomeloPlugin } from "../../models";
import { isMikanamiRSSItem } from "./mikanani";
import { isNyaaRSSItem } from "./nyaa";
import { isShareAcgnxRSSItem } from "./share-acgnx";
import { isOuoRSSItem } from "./ouo";

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
        async parser(target: string) {
            const obj = await parseStringPromise(target);
            if (isSupportRSS(obj)) {
                return obj;
            } else {
                throw "unsupported RSS feeds, please replace them with supported RSS feeds.";
            }
        },
        async worker(resource: object, handler) {
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
