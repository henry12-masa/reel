// data/ 以下の製品データと特集記事から seed/seed.json を生成する。
// 使い方: node scripts/build-seed.mjs
// seed は「空のデータベース」にだけ適用される。作り直すときは data.db を消してから dev を起動する。
import { writeFileSync } from "node:fs";
import { ERAS, GRADES, SERIES, TIERS, eraForYear } from "../data/taxonomies.mjs";
import { games, bodyToPortableText } from "../data/catalog.mjs";
import { features, aboutPage } from "../data/features.mjs";


// ---- 検証: slug重複・未定義の種類/シリーズ・年代の判定漏れ
const seen = new Set();
for (const game of games) {
	if (seen.has(game.slug)) throw new Error(`slug重複: ${game.slug}`);
	seen.add(game.slug);
	for (const g of game.grades) if (!GRADES[g]) throw new Error(`${game.slug}: 未定義の種類 ${g}`);
	for (const p of game.series) if (!SERIES[p]) throw new Error(`${game.slug}: 未定義のシリーズ ${p}`);
	if (!/^\d{4}$/.test(game.released)) throw new Error(`${game.slug}: 年の形式 ${game.released}`);
	if (!TIERS[game.tier]) throw new Error(`${game.slug}: 未定義の推し度 ${game.tier}`);
	if (!eraForYear(game.year)) throw new Error(`${game.slug}: 年代が判定できない ${game.year}`);
	if (!["シマノ", "ダイワ"].includes(game.maker)) throw new Error(`${game.slug}: メーカー ${game.maker}`);
	if (!game.body) throw new Error(`${game.slug}: 解説本文がない`);
}
for (const f of features) {
	for (const slug of f.mentions ?? []) if (!seen.has(slug)) throw new Error(`特集 ${f.slug}: 存在しない製品 ${slug}`);
}

const terms = (obj) => Object.entries(obj).map(([slug, label]) => ({ slug, label }));

const seed = {
	$schema: "https://emdashcms.com/seed.schema.json",
	version: "1",
	meta: {
		name: "巻き継ぐ",
		description: "シマノ・ダイワの釣りリールを、種類・シリーズ・年代で横断するキュレーションサイト",
		author: "巻き継ぐ編集部",
	},
	settings: {
		title: "巻き継ぐ",
		tagline: "ステラからイグジストまで。シマノ・ダイワの釣りリールを、種類・シリーズ・年式で横断するキュレーションサイト。旧モデルまで含めた全機種名簿つき。",
	},
	collections: [
		{
			slug: "kits",
			label: "リール",
			labelSingular: "リール",
			urlPattern: "/kits/{slug}",
			supports: ["drafts", "revisions", "search", "seo"],
			fields: [
				{ slug: "title", label: "品名", type: "string", required: true, searchable: true },
				{ slug: "model_number", label: "年式つきの名前(22ステラ)", type: "string", searchable: true },
				{ slug: "release_year", label: "年(ダイワは発売年、シマノは年式)", type: "integer", required: true },
				{ slug: "released", label: "年(YYYY)", type: "string" },
				{ slug: "scale", label: "メーカーと年の種類(シマノ · 22年式)", type: "string" },
				{
					slug: "tier", label: "推し度", type: "select", required: true,
					validation: { options: Object.keys(TIERS) },
				},
				{ slug: "summary", label: "ひとこと紹介", type: "text", searchable: true },
				{ slug: "curator_note", label: "キュレーターの一言", type: "text", searchable: true },
				{ slug: "cover", label: "カバー画像", type: "image" },
				{ slug: "content", label: "解説本文", type: "portableText", searchable: true },
				{ slug: "official_url", label: "メーカーの製品ページ", type: "url" },
				{ slug: "amazon_query", label: "Amazon検索語(空なら自動、none でリンクなし)", type: "string" },
			],
		},
		{
			slug: "posts",
			label: "特集",
			labelSingular: "特集",
			urlPattern: "/posts/{slug}",
			supports: ["drafts", "revisions", "preview", "scheduling", "search", "seo"],
			fields: [
				{ slug: "title", label: "タイトル", type: "string", required: true, searchable: true },
				{ slug: "featured_image", label: "アイキャッチ", type: "image" },
				{ slug: "content", label: "本文", type: "portableText", searchable: true },
				{ slug: "excerpt", label: "抜粋", type: "text" },
			],
		},
		{
			slug: "pages",
			label: "固定ページ",
			labelSingular: "固定ページ",
			urlPattern: "/pages/{slug}",
			supports: ["drafts", "revisions", "preview", "search", "seo"],
			fields: [
				{ slug: "title", label: "タイトル", type: "string", required: true, searchable: true },
				{ slug: "content", label: "本文", type: "portableText", searchable: true },
			],
		},
	],
	taxonomies: [
		{
			name: "era", label: "年代", labelSingular: "年代", hierarchical: false, collections: ["kits"],
			terms: ERAS.map((e) => ({ slug: e.slug, label: e.label })),
		},
		{
			name: "grade", label: "種類", labelSingular: "種類", hierarchical: false, collections: ["kits"],
			terms: terms(GRADES),
		},
		{
			name: "series", label: "シリーズ", labelSingular: "シリーズ", hierarchical: false, collections: ["kits"],
			terms: terms(SERIES),
		},
		{
			name: "category", label: "特集カテゴリ", labelSingular: "特集カテゴリ", hierarchical: true, collections: ["posts"],
			terms: [
				{ slug: "guide", label: "入門ガイド" },
				{ slug: "history", label: "リールの歴史と比較" },
							],
		},
		{
			name: "tag", label: "タグ", labelSingular: "タグ", hierarchical: false, collections: ["posts"],
			terms: [
				{ slug: "beginner", label: "はじめての人へ" },
				{ slug: "history", label: "年式と歴史" },
				{ slug: "technology", label: "技術" },
				{ slug: "flagship", label: "最上位モデル" },
			],
		},
	],
	bylines: [{ id: "byline-editorial", slug: "editorial", displayName: "巻き継ぐ編集部" }],
	menus: [
		{
			name: "primary",
			label: "メインメニュー",
			items: [
				{ type: "custom", label: "厳選リール", url: "/kits" },
				{ type: "custom", label: "年表", url: "/timeline" },
				{ type: "custom", label: "種類ガイド", url: "/guide" },
				{ type: "custom", label: "全機種名簿", url: "/catalog" },
				{ type: "custom", label: "特集", url: "/posts" },
				{ type: "custom", label: "このサイトについて", url: "/pages/about" },
			],
		},
	],
	widgetAreas: [
		{
			name: "sidebar",
			label: "サイドバー",
			description: "特集記事ページに表示",
			widgets: [
				{ type: "component", componentId: "core:search", title: "検索" },
				{ type: "component", componentId: "core:categories", title: "特集カテゴリ" },
				{ type: "component", componentId: "core:recent-posts", title: "新しい特集", props: { count: 5, showDate: false } },
			],
		},
		{
			name: "footer",
			label: "フッター",
			description: "フッターに表示",
			widgets: [
				{
					type: "content",
					title: "編集方針",
					content: [
						{
							_type: "block", _key: "f0", style: "normal",
							children: [{
								_type: "span", _key: "f1",
								text: "点数や価格の比較はしません。どんなリールかをひとことで添えて、種類・シリーズ・年代のどこからでも次の1台に出会えるようにしています。当サイトはファンによる非公式のキュレーションサイトで、株式会社シマノ・グローブライド株式会社(ダイワ)とは関係ありません。",
							}],
						},
					],
				},
			],
		},
	],
	content: {
		kits: games.map((game) => ({
			id: `kit-${game.slug}`,
			slug: game.slug,
			status: "published",
			data: {
				title: game.title,
				model_number: game.model,
				release_year: game.year,
				released: game.released,
				scale: game.scale,
				tier: game.tier,
				summary: game.summary,
				curator_note: game.note,
				content: bodyToPortableText(game.slug, game.body),
				amazon_query: game.amazonQuery,
				official_url: game.officialUrl,
			},
			taxonomies: {
				era: [eraForYear(game.year).slug],
				grade: game.grades,
				series: game.series,
			},
		})),
		posts: features.map((f) => ({
			id: `post-${f.slug}`,
			slug: f.slug,
			status: "published",
			data: { title: f.title, excerpt: f.excerpt, content: f.content },
			bylines: [{ byline: "byline-editorial" }],
			taxonomies: { category: [f.category], tag: f.tags },
		})),
		pages: [aboutPage],
	},
};

writeFileSync(new URL("../seed/seed.json", import.meta.url), JSON.stringify(seed, null, "\t") + "\n");

const byEra = ERAS.map((e) => `${e.short}:${games.filter((g) => eraForYear(g.year) === e).length}`);
console.log(`seed/seed.json を生成: リール${games.length}件 / 特集${features.length}本`);
console.log(byEra.join("  "));
