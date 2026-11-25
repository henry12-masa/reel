// ダイワのリールの全品番を、ダイワ公式サイト(daiwa.com)の「パーツ検索システム」から集めて
// data/catalog/daiwa-parts.json に保存する。パーツ検索システムは株式会社SLP(グローブライド=ダイワのグループ会社)が運営し、
// 品番ごとに「発売年」が載っている(月はない)。1ページ1秒あけて読む。
//   node scripts/catalog/daiwa.mjs
// 1行の形: [品名, 発売年, JANコード, 製品コード, カテゴリ(c10など), シリーズ名(パーツ検索の小分類)]
import { writeFileSync } from "node:fs";

const BASE = "https://www.sl-planets.co.jp";
// リールの大分類: スピニング / スピニング(LB) / 投げ・遠投 / ベイト・両軸 / 片軸・フライ / 電動
const CATS = ["c10", "c11", "c12", "c13", "c14", "c15"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path) {
	for (let i = 0; i < 3; i++) {
		const res = await fetch(BASE + path);
		if (res.ok) return new TextDecoder("shift_jis").decode(await res.arrayBuffer());
		await sleep(3000);
	}
	throw new Error(`読めない: ${path}`);
}

const text = (s) => s.replace(/<[^>]+>/g, "").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

function rows(html) {
	const out = [];
	for (const tr of html.split("<tr>").slice(1)) {
		const name = tr.match(/class="goods_name_"[^>]*>([^<]+)</)?.[1];
		if (!name) continue;
		const cell = (cls) => text(tr.match(new RegExp(`<td class="${cls}">([\\s\\S]*?)</td>`))?.[1] ?? "");
		out.push([name.normalize("NFKC").replace(/\s+/g, " ").trim(), cell("date_"), cell("jan_code_"), cell("goods_code_")]);
	}
	return out;
}

const all = [];
const seen = new Set();
for (const c of CATS) {
	const top = await get(`/shop/c/${c}/`);
	await sleep(1000);
	// 小分類(シリーズ)のリンク: /shop/c/c1009/ のような形
	const subs = [...new Map([...top.matchAll(new RegExp(`href="/shop/c/(${c}\\d\\d)/"[^>]*>([^<]+)<`, "g"))].map((m) => [m[1], text(m[2])])).entries()];
	console.log(`${c}: 小分類 ${subs.length}`);
	for (const [sub, label] of subs) {
		let html = await get(`/shop/c/${sub}/`);
		await sleep(1000);
		const list = rows(html);
		// 件数が多い小分類はページが分かれる(navipage_ の中に次のページへのリンクがある)
		const done = new Set([`/shop/c/${sub}/`]);
		for (;;) {
			const pager = html.match(/<div class="navipage_">([\s\S]*?)<\/div>/)?.[1] ?? "";
			const next = [...pager.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")).find((h) => !done.has(h));
			if (!next) break;
			done.add(next);
			html = await get(next);
			await sleep(1000);
			list.push(...rows(html));
		}
		let added = 0;
		for (const r of list) {
			if (seen.has(r[3])) continue;
			seen.add(r[3]);
			all.push([...r, c, label.normalize("NFKC")]);
			added++;
		}
		console.log(`  ${sub} ${label}: ${list.length}件(新規 ${added})`);
	}
}
writeFileSync(new URL("../../data/catalog/daiwa-parts.json", import.meta.url), JSON.stringify(all));
console.log(`合計 ${all.length}品番`);
