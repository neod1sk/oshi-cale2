# 推しカレ（開発セットアップ）

## 環境変数

プロジェクト直下に `.env.local` を作成して、Google Sheets の **CSV公開URL** を設定してください。

```
SHEET_CSV_URL=（ここにCSV URL）
```

> `SHEET_CSV_URL` はサーバー側でのみ参照します（`NEXT_PUBLIC_` は不要です）。

## 起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください（`/` は `/ja` にリダイレクトします）。

