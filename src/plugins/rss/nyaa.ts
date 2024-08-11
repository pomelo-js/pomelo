export interface NyaaRSS {
    rss: {
        $: {
            "xmlns:atom": string;
            "xmlns:nyaa": string;
            version: string;
        };
        channel: NyaaRSSChannel[];
    };
}

export interface NyaaRSSChannel {
    title: string[];
    description: string[];
    link: string[];
    "atom:link": AtomLinkElement[];
    item: NyaaRSSItem[];
}

export interface NyaaRSSItem {
    title: string[];
    link: string[];
    guid: GUIDElement[];
    pubDate: string[];
    "nyaa:seeders": string[];
    "nyaa:leechers": string[];
    "nyaa:downloads": string[];
    "nyaa:infoHash": string[];
    "nyaa:categoryId": NyaaCategoryID[];
    "nyaa:category": NyaaCategory[];
    "nyaa:size": string[];
    "nyaa:comments": string[];
    "nyaa:trusted": Nyaa[];
    "nyaa:remake": Nyaa[];
    description: string[];
}

interface AtomLinkElement {
    $: AtomLink;
}

interface AtomLink {
    href: string;
    rel: string;
    type: string;
}

interface GUIDElement {
    _: string;
    $: GUID;
}

interface GUID {
    isPermaLink: string;
}

enum NyaaCategory {
    AnimeEnglishTranslated = "Anime - English-translated",
    AnimeNonEnglishTranslated = "Anime - Non-English-translated",
    AnimeRaw = "Anime - Raw",
    AudioLossless = "Audio - Lossless",
    AudioLossy = "Audio - Lossy",
    LiteratureEnglishTranslated = "Literature - English-translated",
    LiteratureRaw = "Literature - Raw",
    LiveActionRaw = "Live Action - Raw",
}

enum NyaaCategoryID {
    The1_2 = "1_2",
    The1_3 = "1_3",
    The1_4 = "1_4",
    The2_1 = "2_1",
    The2_2 = "2_2",
    The3_1 = "3_1",
    The3_3 = "3_3",
    The4_4 = "4_4",
}

enum Nyaa {
    No = "No",
    Yes = "Yes",
}

export function isNyaaRSS(target: any): target is NyaaRSS {
    try {
        return target.rss.channel[0].link[0].includes("nyaa");
    } catch {
        return false;
    }
}

export function isNyaaRSSItem(item: any): item is NyaaRSSItem {
    try {
        return item.link[0].includes("nyaa");
    } catch {
        return false;
    }
}
