//解析字符串/数字至秒,字符串支持后缀s,m,h,d
export function parseToMillisecond(format: string | number): number {
    if (typeof format === "number") {
        return format * 1000;
    }

    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const value = parseInt(format.slice(0, format.length - 1));
    const unit = format[format.length - 1] as "s" | "m" | "h" | "d";
    switch (unit) {
        case "s":
            return second * value;
        case "m":
            return minute * value;
        case "h":
            return hour * value;
        case "d":
            return day * value;
        default:
            return 0;
    }
}

export function getFormattedTime(showYear: boolean = false) {
    const tmp = new Date();
    const year = tmp.getFullYear();
    const month = tmp.getMonth() + 1;
    const date = tmp.getDate();
    const formattedDate = `${year}/${month}/${date}`;
    const hours = tmp.getHours();
    const minutes =
        tmp.getMinutes() < 10 ? `0${tmp.getMinutes()}` : tmp.getMinutes();
    const seconds =
        tmp.getSeconds() < 10 ? `0${tmp.getSeconds()}` : tmp.getSeconds();
    const formattedMoment = `${hours}:${minutes}:${seconds}`;
    return showYear
        ? `${formattedDate} ${formattedMoment}`
        : `${formattedMoment}`;
}

export function createIntervalTimeCount(text: string) {
    console.time(text);
    return () => console.timeEnd(text);
}
