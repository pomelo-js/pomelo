export interface PomeloRecordMap {
    accepted: {
        title: Record<string, RecordUnit | undefined>;
        link: Record<string, RecordUnit | undefined>;
    };
    rejected: {
        title: Record<string, RecordUnit | undefined>;
        link: Record<string, RecordUnit | undefined>;
    };
}

export interface PomeloRecordPartMap {
    title: Record<string, RecordUnit | undefined>;
    link: Record<string, RecordUnit | undefined>;
}

export interface RecordUnit {
    expired: number;
}
