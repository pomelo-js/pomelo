import { $ } from "bun";

/**
 * 利用 bun shell 执行命令
 * @param text 整句命令
 */
export async function carryCommand(text: string) {
    const trunks = text.split(" ");
    const command = trunks[0];
    const args = trunks[1];
    await $`${command} ${args}`;
}
