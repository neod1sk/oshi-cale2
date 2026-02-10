# 推しカレ（開発セットアップ）

## 環境変数

プロジェクト直下に `.env.local` を作成して、Google Sheets の **CSV公開URL** を設定してください。

手早く進める場合は、テンプレ `env.example` をコピーして作るのが確実です。

```bash
# macOS / Linux
cp env.example .env.local

# Windows (PowerShell)
Copy-Item env.example .env.local
```

```
SHEET_CSV_URL=（ここにCSV URL）
```

> `SHEET_CSV_URL` はサーバー側でのみ参照します（`NEXT_PUBLIC_` は不要です）。

### Google Sheets 側の「CSV公開URL」の作り方

1) 対象のスプレッドシートを開く  
2) **[ファイル] → [共有] → [ウェブに公開]**  
3) 公開するシートを選び、形式で **CSV** を選択して公開  
4) 表示された URL を `.env.local` の `SHEET_CSV_URL` に貼り付ける

> `output=csv` が付くURLになっていればOKです。

## 起動

```bash
npm run dev
```

> すでに `npm run dev` を起動中の場合、`.env.local` を作った/変更した後は **一度停止して再起動**してください（起動中に環境変数は反映されません）。

ブラウザで `http://localhost:3000` にアクセスしてください（`/` は `/ja` にリダイレクトします）。

