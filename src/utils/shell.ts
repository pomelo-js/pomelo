import { execa } from "execa";

/**
 * 执行shell命令
 * @param command 整句命令
 */
export async function carryCommand(command: string | string[]) {
    if (Array.isArray(command)) {
        const { stdout } = await execa(command.shift() || "", command);
        console.log(stdout);
    } else {
        const trunks = command.split(" ");
        const base = trunks.shift() || "";
        const { stdout } = await execa(base, trunks);
        console.log(stdout);
    }
}
