// 年代・種類・シリーズ・推し度の定義。seed/seed.json は scripts/build-seed.mjs がここから生成する。
// 内部のタクソノミー名は grade = リールの種類、series = シリーズ(姉妹サイトと共通のコードを使うため)。

// 年代は、そのモデルの年で判定する(from〜to を含む)。
// ダイワは公式のパーツ検索システムの「発売年」、シマノは公式サイトの品名の年式(22ステラなら2022)
export const ERAS = [
	{ slug: "until2022", label: "2022年までのモデル", short: "〜2022", from: 1900, to: 2022,
		lead: "22ステラ・22イグジスト・21カルカッタコンクエストなど。いまも公式サイトに現行品として載る、ひとつ前からの世代。" },
	{ slug: "y2023", label: "2023〜2024年のモデル", short: "2023〜24", from: 2023, to: 2024,
		lead: "24ツインパワー・24セルテート・23ヴァンキッシュ・23エアリティなど。" },
	{ slug: "y2025", label: "2025年以降のモデル", short: "最新", from: 2025, to: 2100,
		lead: "25ステラSW・25アンタレス・26ナスキー・26フリームスなど、いちばん新しい世代。" },
];

// リールの種類
export const GRADES = {
	spinning: "スピニング(汎用)",
	sw: "スピニング(大型・SW)",
	lever: "スピニング(レバーブレーキ)",
	surf: "スピニング(投げ)",
	bait: "ベイトキャスティング",
	conventional: "両軸(船・オフショア)",
	electric: "電動",
	other: "その他(黒鯛・ワカサギ・フライなど)",
};

// シリーズ(厳選に出てくるもの)
export const SERIES = {
	stella: "ステラ",
	twinpower: "ツインパワー",
	vanquish: "ヴァンキッシュ",
	stradic: "ストラディック",
	"shimano-value": "アルテグラ・ナスキー",
	exsence: "エクスセンス",
	"shimano-light": "ソアレ・セフィア",
	"bb-x": "BB-X",
	calcutta: "カルカッタコンクエスト",
	antares: "アンタレス",
	metanium: "メタニウム",
	ocea: "オシア",
	"shimano-electric": "ビーストマスター",
	exist: "イグジスト",
	certate: "セルテート",
	airity: "エアリティ",
	luvias: "ルビアス",
	"daiwa-value": "カルディア・フリームス・レグザ・レブロス・BG",
	saltiga: "ソルティガ",
	kohga: "紅牙",
	steez: "スティーズ",
	zillion: "タトゥーラ",
	seaborg: "シーボーグ",
};

export const TIERS = {
	essential: "定番",
	recommended: "推し",
	deep: "通好み",
};

/** メーカー */
export const MAKERS = { shimano: "シマノ", daiwa: "ダイワ" };

export function eraForYear(year) {
	return ERAS.find((e) => year >= e.from && year <= e.to);
}
