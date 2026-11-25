// 厳選リールの年を、全機種名簿(data/catalog/roster.mjs)と照合する。
// 使い方: node scripts/check-years.mjs data/kits-*.mjs
// 名簿の年は、ダイワが公式のパーツ検索システムの「発売年」、シマノが公式サイトの品名の年式。
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { loadRoster, nameKey, rosterRowFor } from "../data/catalog/roster.mjs";

const raw = loadRoster();
let miss = 0, ok = 0;
for (const file of process.argv.slice(2)) {
	const list = (await import(pathToFileURL(resolve(file)).href)).default;
	for (const kit of list) {
		const r = rosterRowFor(kit, raw);
		if (r) { ok++; continue; }
		miss++;
		const near = raw.filter((x) => x.c === kit.makerKey && nameKey(x.n).startsWith(nameKey(kit.roster).replace(/^\d{2}/, "").slice(0, 4)) || (x.c === kit.makerKey && nameKey(x.n).includes(nameKey(kit.roster).replace(/^\d{2}/, ""))));
		console.log(`NG ${kit.slug} 掲載 ${kit.released}「${kit.roster}」が名簿にない。近い行: ${near.slice(0, 6).map((x) => `${x.d || "年不明"} ${x.n}`).join(" / ")}`);
	}
}
console.log(`一致 ${ok} / 名簿で見つからない ${miss}`);
