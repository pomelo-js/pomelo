export interface MikanamiRSS {
    rss: {
        $: {
            version: string;
        };
        channel: MikanamiRSSChannel[];
    };
}
export interface MikanamiRSSChannel {
    title: string[];
    link: string[];
    description: string[];
    item: MikanamiRSSItem[];
}

export interface MikanamiRSSItem {
    guid: GUIDElement[];
    link: string[];
    title: string[];
    description: string[];
    torrent: TorrentElement[];
    enclosure: EnclosureElement[];
}

interface EnclosureElement {
    $: Enclosure;
}

interface Enclosure {
    type: Type;
    length: string;
    url: string;
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

interface TorrentElement {
    $: Torrent;
    link: string[];
    contentLength: string[];
    pubDate: string[];
}

interface Torrent {
    xmlns: string;
}

export function isMikanamiRSS(target: any): target is MikanamiRSS {
    try {
        return target.rss.channel[0].link[0].includes("mikanani");
    } catch {
        return false;
    }
}

export function isMikanamiRSSItem(item: any): item is MikanamiRSSItem {
    try {
        return item.link[0].includes("mikanani");
    } catch {
        return false;
    }
}
