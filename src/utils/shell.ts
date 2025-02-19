import { $ } from "execa";

/**
 * 执行shell命令
 * @param command 整句命令
 */
export async function carryCommand(command: string) {
    const { stdout } = await $`${command}`;
    console.log(stdout);
}
