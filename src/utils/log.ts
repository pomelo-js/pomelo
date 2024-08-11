import { getFormattedTime } from "./time";

type Color = "RESET" | "RED" | "GREEN" | "YELLOW" | "BLUE";

const COLOR: Record<Color, string> = {
    RESET: "\x1b[0m",
    RED: "\x1b[31m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m",
};
function getColoredText(content: string, color: Color) {
    return COLOR[color] + content + COLOR.RESET;
}

export function successLog(content: string) {
    console.log(
        getColoredText(`[pomelo|${getFormattedTime()}]: ${content}`, "GREEN")
    );
}

export function warnLog(content: string) {
    console.log(
        getColoredText(`[pomelo|${getFormattedTime()}]: ${content}`, "YELLOW")
    );
}

export function errorLog(content: string) {
    console.log(
        getColoredText(`[pomelo|${getFormattedTime()}]: ${content}`, "RED")
    );
}
