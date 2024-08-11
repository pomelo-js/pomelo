export interface Enclosure {
    $: {
        url: string;
        length: string;
        type: string;
    };
}

export interface OuoRSSItem {
    title: string[];
    link: string[];
    description: string[];
    enclosure: Enclosure[];
    guid: string[];
    pubDate: string[];
}

export interface OuoRSSChannel {
    title: string[];
    link: string[];
    description: string[];
    pubDate: string[];
    item: OuoRSSItem[];
}

export interface OuoRSS {
    rss: {
        $: {
            version: string;
            encoding: string;
        };
        channel: OuoRSSChannel[];
    };
}

export function isOuoRSS(target: any): target is OuoRSS {
    try {
        return target.rss.channel[0].link[0].includes("ouo.si");
    } catch {
        return false;
    }
}

export function isOuoRSSItem(item: any): item is OuoRSSItem {
    try {
        return item.link[0].includes("ouo.si");
    } catch {
        return false;
    }
}
