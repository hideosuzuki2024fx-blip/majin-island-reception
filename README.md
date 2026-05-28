# 魔人島 移住者受付

`#魔人島` の参加用Webアプリです。公開運用ではサーバー側にデータを保存せず、X投稿を正本として扱います。

## 起動

```powershell
cd /d E:\majin-island-reception
npm install
npm start
```

ブラウザで開く:

```text
http://localhost:5188
```

または `start-majin-island-reception.bat` を実行します。

## できること

- キャラ情報から魔人簿を生成
- 画像生成用プロンプトを生成
- `#魔人島` 付きX投稿文を生成
- X投稿画面を開く
- 投稿URLや作業中メモをブラウザ内 `localStorage` に控える

## 公開時の設計

- 画像保存: X投稿に添付する
- 住民データ: `#魔人島住民票` などのタグ付きX投稿を正本にする
- サイト側保存: なし
- ログイン: なし
- 一覧: X検索リンク、または代表投稿URLの手動キュレーションで代替

`public` 配下だけで静的サイトとして動くため、GitHub Pages、Netlify、Vercelの静的ホスティングに載せられます。

## GitHub Pages

このリポジトリには `.github/workflows/pages.yml` が入っています。
`main` にpushすると、`public` フォルダだけをGitHub Pagesへデプロイします。
