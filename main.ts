import { PomeloEngine, RSS } from "./src";
import { resolve } from "path";
import minimist from "minimist";

//#region 解析命令行参数
const args = minimist(process.argv.slice(2));
const onlyRecord = args.r === true || args.record === true;
const configPath = resolve(args.d === true ? "./" : args.d || "./");
//#endregion

const engine = new PomeloEngine();
await engine.initFromFile(configPath);
engine.use(RSS());
engine.run({
    onlyRecord,
});
