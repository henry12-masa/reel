# 巻き継ぐ

ステラからイグジストまで。シマノ・ダイワの釣りリールを、種類・シリーズ・年式で横断するキュレーションサイト。旧モデルまで含めた全機種名簿つき。

公開URL: https://reel.napoblog.com

[EmDash](https://github.com/emdash-cms/emdash)(Astro製CMS)で作り、Cloudflare Workers + D1 + R2 で動かします。姉妹サイト「遊び継ぐ」「組み継ぐ」「走り継ぐ」「操り継ぐ」「連ね継ぐ」と同じ作りです。コード上のコレクション名・タクソノミー名は共通で、`kits` がリール、`grade` が種類(スピニング・ベイト・両軸・電動など)、`series` がシリーズ、`era` が年代です。

## ページ

| ページ | パス |
|---|---|
| トップ | `/` |
| 厳選リール一覧(年代・種類・シリーズ・推し度で絞り込み) | `/kits` |
| リールのページ | `/kits/:slug` |
| 年表 | `/timeline` |
| 種類ガイド | `/guide` |
| 全機種名簿(種類別・年別) | `/catalog`, `/catalog/:種類`, `/catalog/:種類/:年`(年不明は `/0`) |
| 特集 | `/posts`, `/posts/:slug` |
| 検索 | `/search` |
| このサイトについて | `/pages/about` |
| プライバシーポリシー | `/privacy` |

## 年の扱い(大事)

- リール名の頭の2桁(22ステラの22)は「年式」で、発売年とずれることがある(ダイワは秋の新製品に翌年の年式を付けることがある。例: 26紅牙 IC 150 は2025年発売、25タトゥーラ SV TW は2024年発売)
- **ダイワ**: 公式の「パーツ検索システム」(daiwa.com からリンク、sl-planets.co.jp)に品番ごとに載っている「発売年」を使う
- **シマノ**: 公式サイトに発売年・発売月が載っていないので、品名の年式(22なら2022)を使い、表示は「22年式」
- 発売月は、どちらも公式で確かめられないので載せない(ダイワの新製品一覧で月が分かるものだけ本文で触れる)

## データ

- 厳選リールは `data/kits-shimano.mjs`・`data/kits-daiwa.mjs`(定期更新の追加分は `data/kits-updates.mjs`)に `data/entry.mjs` の `k()` で書く。本文は「どんなリール/特徴/シリーズの歩み/こんな人におすすめ」の4見出し
- 解説は公式の製品ページの説明と名簿で裏付けが取れることだけ。価格・売れ行き・裏付けのない断定は書かない
- 年は `node scripts/check-years.mjs data/kits-*.mjs` で全機種名簿と照合する
- 名簿から探す: `node scripts/find-kit.mjs <正規表現> [種類] [shimano|daiwa]`
- `node scripts/build-seed.mjs` で `seed/seed.json` を生成(seed は空のデータベースにだけ適用される)
- 公開中のサイトへの反映は `node scripts/sync-remote.mjs --url https://reel.napoblog.com`(先に `npx emdash login --url https://reel.napoblog.com`)

## 全機種名簿

`data/catalog/roster.mjs` が次の資料を組み合わせ、`node scripts/build-catalog.mjs` で `public/catalog-data/` に書き出す。1行は「機種 × 年」(サイズ・ギア比違いの品番はまとめる)。

1. `data/catalog/daiwa-parts.json`: ダイワのパーツ検索システムのリール全品番(品名・発売年・JAN・製品コード)。`node scripts/catalog/daiwa.mjs` で取り直せる(1ページ1秒)
2. `data/catalog/shimano-products.txt`: シマノ公式サイトの現行リールの製品ページ(種類|ID|品名|年式つきの名前|品番)。fish.shimano.com は curl を拒否するので、ブラウザで開いて取得した
3. `data/catalog/shimano-history.json`: シマノ公式の「スプール互換表」(PDF)と「一部リール取扱説明書一覧」に載っている、現行でない年式つきの品名
4. `data/catalog/additions.json`: どれにもないものを手で足す分

## 開発とデプロイ

```bash
npm run dev      # http://localhost:4321
npm run deploy   # astro build && wrangler deploy
```

GitHub henry12-masa/reel の main への push で、Cloudflare Workers Builds が自動でビルド・デプロイする(ビルド `npm run build`、デプロイ `npx wrangler deploy`、プレビューのビルドは無効。2026-11-25に設定)。

**注意**: `wrangler deploy` は dist に生成された設定(dist/server/wrangler.json)を使う。wrangler.jsonc を変えたら必ず build し直す(複製直後に古い dist のまま deploy して、連ね継ぐの Worker を上書きした事故あり)。

公開: Workers「reel-curation」+ D1「reel-curation」+ R2「reel-curation-media」+ KV「reel-curation-session」。暗号鍵は wrangler secret(控えは .dev.vars、git に入れない)。

`node_modules` は容量節約のため `game-curation\node_modules` へのジャンクション。

当サイトはファンによる非公式のサイトで、株式会社シマノ・グローブライド株式会社(ダイワ)とは関係ありません。
