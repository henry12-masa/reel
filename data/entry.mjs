// 厳選リールのデータの書き方。解説本文は4つの見出しで組み立てる。
export const SECTIONS = ["どんなリール", "特徴", "シリーズの歩み", "こんな人におすすめ"];

const MAKER = { shimano: "シマノ", daiwa: "ダイワ" };

/**
 * k(slug, 品名, メーカー("shimano"|"daiwa"), 年式の名前, 年, 種類(空白区切り), シリーズ(空白区切り), 推し度, ひとこと紹介, 一言, [本文4段落], { amazon, url, roster })
 *   年式の名前: 品名に付く年式つきの名前(22ステラ、24セルテート)
 *   年: ダイワは公式のパーツ検索システムの「発売年」、シマノは品名の年式(22なら2022)。月は公式で確かめられないので持たない
 *   url: メーカーの製品ページ
 *   roster: 全機種名簿の機種名(ダイワは「22イグジスト」、シマノは「ステラ」の形)。省略すると年式の名前
 * 年は scripts/check-years.mjs で全機種名簿と照合する。
 */
export const k = (slug, title, maker, model, year, grade, series, tier, summary, note, parts, opts = {}) => ({
	slug,
	title,
	model,
	maker: MAKER[maker],
	makerKey: maker,
	// ダイワは発売年、シマノは年式(どちらも公式の情報)
	released: String(year),
	yearKind: maker === "daiwa" ? "release" : "model",
	year,
	scale: maker === "daiwa" ? `ダイワ · ${year}年発売` : `シマノ · ${String(year).slice(2)}年式`,
	grades: grade.split(" "),
	series: series.split(" "),
	tier,
	summary,
	note,
	body: parts.map((text, i) => `## ${SECTIONS[i]}\n${text}`).join("\n\n"),
	amazonQuery: opts.amazon ?? `${MAKER[maker]} ${model}`,
	officialUrl: opts.url ?? "",
	roster: opts.roster ?? model,
});
