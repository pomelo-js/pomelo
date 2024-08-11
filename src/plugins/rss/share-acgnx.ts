export interface ShareAcgnxRSS {
    rss: {
        $: {
            version: string;
        };
        channel: ShareAcgnxRSSChannel[];
    };
}

export interface ShareAcgnxRSSChannel {
    title: string[];
    link: string[];
    description: string[];
    lastBuildDate: string[];
    language: string[];
    generator: string[];
    copyright: string[];
    item: ShareAcgnxRSSItem[];
}

export interface ShareAcgnxRSSItem {
    title: string[];
    link: string[];
    description: string[];
    guid: GUIDElement[];
    author: Author[];
    enclosure: EnclosureElement[];
    pubDate: string[];
    category: CategoryElement[];
}

enum Author {
    Nekomoekissaten = "nekomoekissaten",
    Sakuratosub = "sakuratosub",
    TrySail = "TrySail",
    XSxSxSxSx = "xSxSxSxSx",
    動漫花園鏡像 = "動漫花園鏡像",
    萌番組鏡像 = "萌番組鏡像",
    萌萌的搬運者 = "萌萌的搬運者",
}

interface CategoryElement {
    _: Empty;
    $: Category;
}

interface Category {
    domain: string;
}

enum Empty {
    動漫音樂 = "動漫音樂",
    動畫 = "動畫",
    日劇日影 = "日劇/日影",
    日文原版 = "日文原版",
    遊戲 = "遊戲",
    音樂 = "音樂",
}

interface EnclosureElement {
    $: Enclosure;
}

interface Enclosure {
    url: string;
    length: string;
    type: Type;
}

enum Type {
    ApplicationXBittorrent = "application/x-bittorrent",
}

interface GUIDElement {
    _: string;
    $: GUID;
}

interface GUID {
    isPermaLink: string;
}

export function isShareAcgnxRSS(target: any): target is ShareAcgnxRSS {
    try {
        return target.rss.channel[0].link[0].includes("share.acgnx");
    } catch (error) {
        return false;
    }
}

export function isShareAcgnxRSSItem(item: any): item is ShareAcgnxRSSItem {
    try {
        return item.link[0].includes("share.acgnx");
    } catch {
        return false;
    }
}
