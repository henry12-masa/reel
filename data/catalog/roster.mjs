// 全機種名簿を組み立てる。build-catalog / check-years / find-kit が共通で使う。
//   daiwa-parts.json      ダイワ公式サイトの「パーツ検索システム」の全品番。品番ごとに公式の「発売年」がある(scripts/catalog/daiwa.mjs)
//   shimano-products.txt  シマノ公式サイトの製品ページ(現行品)。品名の年式(22ステラなら2022)と品番(手で取得、取り方は README)
//   shimano-history.json  シマノ公式のスプール互換表・取扱説明書一覧に載っている、現行でない品名(年式つき)
//   additions.json        どれにもないものを手で足す分 [{n, s, c, d, kind, ex, src}]
// 1行の形: { n: 機種名, s: 種類slug, c: "shimano"|"daiwa", d: "YYYY" か "", kind: "release"(公式の発売年)|"model"(品名の年式), count: 品番の数, ex: 品番の例, src: 出典 }
// 1行は「機種 × 年」。ダイワは同じシリーズ・同じ発売年の品番を1行にまとめる(サイズ違い・ギア比違いは1行)。
import { readFileSync, existsSync } from "node:fs";

const read = (name, fallback = []) => {
	const url = new URL(name, import.meta.url);
	return existsSync(url) ? JSON.parse(readFileSync(url, "utf8")) : fallback;
};
const readText = (name) => {
	const url = new URL(name, import.meta.url);
	return existsSync(url) ? readFileSync(url, "utf8") : "";
};

const nfkc = (s) => s.normalize("NFKC").replace(/(?<=[ァ-ヶ])-(?=[ァ-ヶ])/g, "ー").replace(/\s+/g, " ").trim();

/** 2桁の年式 → 西暦(90〜99は1990年代) */
export const fullYear = (yy) => {
	const n = Number(yy);
	return n >= 80 ? 1900 + n : 2000 + n;
};

// ---- ダイワ
// パーツ検索の大分類: c10 スピニング / c11 スピニング(LB) / c12 投げ・遠投 / c13 ベイト・両軸 / c14 片軸・フライ / c15 電動
const DAIWA_SW = /ソルティガ|キャタリナ|BG|ブラスト|セルテート ?SW|SW\d|オーシャン|ヴァデル|VADEL|サーフベーシア/;
const DAIWA_CONVENTIONAL = /紅牙|ソルティガ|シーライン|ライトゲーム|キャタリナ|ゲンパオウ|石鯛|ダイナスター|タナセンサー|タナコン|シーホーク|スパルタン|コロネット|ティエラ|プリード|ソルティスト|鏡牙|BJ|ICV|IC|バサラ|シーボーグ|RYOGA BJ|エアド|クルーズ|ミリオネア ?(バサラ|CV)/;

function daiwaGrade(cat, series, name) {
	if (cat === "c11") return "lever";
	if (cat === "c12") return "surf";
	if (cat === "c14") return "other";
	if (cat === "c15") return "electric";
	if (cat === "c13") return DAIWA_CONVENTIONAL.test(series) || DAIWA_CONVENTIONAL.test(name) ? "conventional" : "bait";
	// スピニング: 大型・SW系は sw に分ける(品番の数字が6000以上も大型とみなす)
	const size = Number(name.match(/(\d{4,5})/)?.[1] ?? 0);
	if (/^(ソルティガ|キャタリナ|BG|ブラスト|ヴァデル|VADEL)/.test(series) || DAIWA_SW.test(name) || size >= 6000) return "sw";
	return "spinning";
}

/** 品名から年式とサイズを外した「機種の名前」(例: "22EXIST LT2000S-P" → "EXIST") */
function daiwaStem(name) {
	return name
		.replace(/^\d{2}\s?(?=\D)/, "")
		.replace(/\s*((PC|FC)\s?)?(LT|SF)?\s?\d{3,5}.*$/, "")
		.replace(/\s*[-(（].*$/, "")
		.trim();
}

function fromDaiwa() {
	const groups = new Map();
	for (const [raw, year, , code, cat, seriesRaw] of read("daiwa-parts.json")) {
		const series = nfkc(seriesRaw);
		const name = nfkc(raw);
		// 品名の頭の2桁が年式(22EXIST、18イグジスト)。ダイワは秋に出る製品に翌年の年式を付けることがあるので、発売年とは別に持つ
		const yy = name.match(/^(\d{2})(?=\s?\D)/)?.[1] ?? "";
		const grade = daiwaGrade(cat, series, name);
		const key = `${grade}|${series}|${year}|${yy}`;
		if (!groups.has(key)) groups.set(key, { cat, grade, series, year, yy, names: [], codes: [] });
		const g = groups.get(key);
		g.names.push(name);
		g.codes.push(code);
	}
	const out = [];
	const sk = nameKey;
	for (const g of groups.values()) {
		// 機種の名前の違い(短いものが長いものの頭と同じなら、品名が切れているだけなのでまとめる)
		const stems = [...new Set(g.names.map(daiwaStem).filter(Boolean))].sort((a, b) => b.length - a.length);
		const distinct = stems.filter((s, i) => !stems.slice(0, i).some((t) => sk(t).startsWith(sk(s))));
		// シリーズ名と同じ・英字だけ(EXISTなど)の名前は括弧に出さない
		const extra = distinct.filter((s) => sk(s) !== sk(g.series) && !/^[A-Za-z ]+$/.test(s));
		const base = `${g.yy}${g.series}`;
		const label = extra.length && (distinct.length > 1 || !sk(extra[0]).startsWith(sk(g.series)) || sk(extra[0]) !== sk(g.series))
			? `${base}(${extra.slice(0, 3).join("・")}${extra.length > 3 ? "ほか" : ""})`
			: base;
		out.push({
			n: label, series: g.series, yy: g.yy, s: g.grade, c: "daiwa", d: g.year, kind: "release",
			count: g.names.length, ex: g.names[0], src: `daiwa:${g.codes[0]}`,
		});
	}
	return out;
}

// ---- シマノ
const SHIMANO_CAT = { hanyou: "spinning", larges: "sw", leverb: "lever", nageen: "surf", baitlu: "bait", ryojik: "conventional", electr: "electric", chinuw: "other" };

/** "22ステラ" "18-19ステラ" "19シエナ 糸付き" → [年, 名前] */
function splitShimano(label) {
	const s = nfkc(label).replace(/二/g, "ニ").replace(/\s*糸付き$/, "");
	const m = s.match(/^(\d{2})(?:-\d{2})?\s?(.+)$/);
	return m ? [String(fullYear(m[1])), m[2].trim()] : ["", s];
}

function fromShimano() {
	const out = [];
	for (const line of readText("shimano-products.txt").split(/\r?\n/)) {
		if (!line.trim()) continue;
		const [cat, id, h1, alt, items] = line.split("|");
		const [year, name] = splitShimano(alt || h1);
		const list = items ? items.split(",") : [];
		const s = /レイクマスター/.test(name) ? "other" : SHIMANO_CAT[cat];
		out.push({
			n: year ? `${year.slice(2)}${name}` : name, series: name, s, c: "shimano", d: year, kind: "model", count: list.length, ex: list.slice(0, 3).join(" / "),
			src: `shimano:${id}`,
		});
	}
	const hist = read("shimano-history.json", {});
	for (const [grade, names] of Object.entries(hist)) {
		if (grade.startsWith("_")) continue;
		for (const label of names) {
			const [year, name] = splitShimano(label);
			out.push({
				n: year ? `${year.slice(2)}${name}` : name, series: name, s: /レイクマスター/.test(name) ? "other" : grade, c: "shimano", d: year, kind: "model",
				count: 0, ex: nfkc(label), src: "shimano:support",
			});
		}
	}
	return out;
}

/** 比較用のキー(全角半角・空白・記号の違いを無視) */
export const nameKey = (s) => nfkc(s).toLowerCase().replace(/[\s・\-()（）]/g, "");

let cache;
export function loadRoster() {
	if (cache) return cache;
	const out = [];
	const seen = new Set();
	for (const r of [...fromShimano(), ...fromDaiwa(), ...read("additions.json")]) {
		const key = `${r.c}:${nameKey(r.n)}:${r.d}`;
		if (seen.has(key)) continue;
		// 年の分からない行は、同じ名前で年の分かる行があれば載せない
		seen.add(key);
		out.push(r);
	}
	const bare = (n) => nameKey(n).replace(/^\d{2}/, "");
	cache = out.filter((r) => r.d || !out.some((o) => o !== r && o.c === r.c && o.d && bare(o.n) === bare(r.n)));
	return cache;
}

/** 厳選リール(data/entry.mjs の k())に当たる名簿の行。メーカー・機種名の頭・年・種類で探す */
export function rosterRowFor(kit, rows = loadRoster()) {
	const key = nameKey(kit.roster);
	const hits = rows.filter((r) => r.c === kit.makerKey && r.d === kit.released && (nameKey(r.n) === key || nameKey(r.n).startsWith(key)));
	return hits.find((r) => kit.grades.includes(r.s)) ?? hits[0] ?? null;
}
