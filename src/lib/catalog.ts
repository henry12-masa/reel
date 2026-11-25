import { env } from "cloudflare:workers";

/** 全機種名簿の1行: [年, 機種名, "メーカー 品番数", 0, 厳選リールのslug, 年が品名の年式なら1(シマノ), 品番の例] */
export type CatalogRow = [string, string, string, number, string?, number?, string?];

export interface CatalogPlatform {
	slug: string;
	label: string;
	short: string;
	count: number;
	/** 限定品の件数 */
	dl: number;
	shimano?: number;
	daiwa?: number;
	/** 品番の数 */
	items?: number;
	years: Array<[number, number]>;
}

export interface CatalogIndex {
	updated: string;
	total: number;
	items?: number;
	grades: CatalogPlatform[];
}

/** public/catalog-data/ のJSONを、Workerのバンドルに含めずに静的アセットから読む */
async function readAsset<T>(path: string, origin: string): Promise<T | null> {
	const assets = (env as unknown as { ASSETS?: { fetch: (r: Request) => Promise<Response> } }).ASSETS;
	const url = new URL(`/catalog-data/${path}`, origin);
	const res = assets ? await assets.fetch(new Request(url)) : await fetch(url);
	if (!res.ok) return null;
	return (await res.json()) as T;
}

export function loadCatalogIndex(origin: string) {
	return readAsset<CatalogIndex>("index.json", origin);
}

export function loadCatalogYear(platform: string, year: number, origin: string) {
	return readAsset<CatalogRow[]>(`${platform}/${year}.json`, origin);
}

/** 名簿の年: シマノは「22年式」、ダイワは「2022年」(公式の発売年) */
export function formatCatalogDate(d: string, model = 0) {
	if (!d) return "—";
	const y = d.slice(0, 4);
	return model ? `${y.slice(2)}年式` : `${y}年`;
}

/** 検索用: 全角半角・大文字小文字・空白の違いを無視して比べる */
export function normalizeForSearch(s: string) {
	return s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}
