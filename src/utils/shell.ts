import { execa } from "execa";

/**
 * 执行shell命令
 * @param command 整句命令
 */
export async function carryCommand(command: string) {
    const trunks = command.split(" ");
    const base = trunks.shift() || "";
    const { stdout } = await execa(base, trunks);
    console.log(stdout);
}
