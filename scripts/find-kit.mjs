// 全機種名簿から機種名を探す: node scripts/find-kit.mjs <正規表現> [種類] [shimano|daiwa]
import { loadRoster } from "../data/catalog/roster.mjs";
const rows = loadRoster();
const [re, grade, maker] = process.argv.slice(2);
const r = new RegExp(re, "i");
for (const k of rows) if (r.test(k.n.normalize("NFKC")) && (!grade || k.s === grade) && (!maker || k.c === maker))
	console.log(`${k.d || "----"}${k.kind === "model" ? "年式" : "発売"}\t${k.s}\t${k.c}\t${k.n}\t${k.count}品番\t${k.ex}`);
