// 全機種名簿(data/catalog/roster.mjs)を、サイトが読む形に分割して public/catalog-data/ に書き出す。
//   public/catalog-data/index.json         種類ごとの件数と年ごとの件数
//   public/catalog-data/<種類>/<年>.json   その年の機種 [[年, 機種名, "メーカー 品番数", 0, 厳選slug, 年式なら1, 品番の例], ...]
//   年の分からない機種は <種類>/0.json にまとめる(ページでは「年不明」と表示)。
// 年はダイワが公式の発売年、シマノが品名の年式(年式なら6番目の値が1)。
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { loadRoster, rosterRowFor } from "../data/catalog/roster.mjs";
import { games } from "../data/catalog.mjs";
import { GRADES } from "../data/taxonomies.mjs";

const raw = loadRoster();
// 名簿の更新日(日本時間)
const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const OUT = new URL("../public/catalog-data/", import.meta.url);
const MAKER = { shimano: "シマノ", daiwa: "ダイワ" };

const ORDER = Object.keys(GRADES);
const SHORT = Object.fromEntries(Object.entries(GRADES).map(([k, v]) => [k, v.replace(/[(（].*$/, "").trim()]));

// 厳選リールに当たる名簿の行
const picked = new Map();
for (const g of games) {
	const row = rosterRowFor(g, raw);
	if (row) picked.set(row, g.slug);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const index = [];
for (const slug of ORDER) {
	const list = raw.filter((k) => k.s === slug).sort((a, b) => (a.d || "9999").localeCompare(b.d || "9999") || a.c.localeCompare(b.c) || a.n.localeCompare(b.n, "ja"));
	if (!list.length) continue;
	const byYear = new Map();
	for (const k of list) {
		const year = k.d ? k.d.slice(0, 4) : "0";
		const pub = k.count ? `${MAKER[k.c]} ${k.count}品番` : MAKER[k.c];
		const row = [k.d || "", k.n, pub, 0, picked.get(k) ?? "", k.kind === "model" ? 1 : 0, k.ex || ""];
		if (!byYear.has(year)) byYear.set(year, []);
		byYear.get(year).push(row);
	}
	mkdirSync(new URL(`${slug}/`, OUT), { recursive: true });
	const years = [];
	for (const [year, rows] of [...byYear].sort(([a], [b]) => (a === "0" ? 1 : b === "0" ? -1 : a.localeCompare(b)))) {
		writeFileSync(new URL(`${slug}/${year}.json`, OUT), JSON.stringify(rows));
		years.push([Number(year), rows.length]);
	}
	index.push({
		slug, label: GRADES[slug], short: SHORT[slug], count: list.length, dl: 0,
		shimano: list.filter((k) => k.c === "shimano").length, daiwa: list.filter((k) => k.c === "daiwa").length,
		items: list.reduce((n, k) => n + (k.count || 0), 0), years,
	});
}
const total = index.reduce((n, p) => n + p.count, 0);
const items = index.reduce((n, p) => n + p.items, 0);
writeFileSync(new URL("index.json", OUT), JSON.stringify({ updated: TODAY, total, items, grades: index }));
console.log(`全機種名簿: ${total}機種(${items}品番)/ ${index.length}種類(厳選リールへのリンク ${picked.size}件 / 厳選${games.length}件)`);
