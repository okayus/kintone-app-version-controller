# kintone アプリバージョン管理システム

kintoneアプリの構成情報をバックアップし、バージョン管理するためのカスタマイズです。

## 概要

このプロジェクトは、kintoneアプリの設定情報を取得し、変更があった場合に新しいバージョンとして記録するシステムです。

## 機能

- kintoneアプリ情報の自動取得
- アプリ設定情報（フォーム、レイアウト、ビューなど）のバックアップ
- 設定変更の自動検出
- バージョン履歴の記録
- （将来追加予定）バージョン間の差分表示
- （将来追加予定）過去のバージョンへの復元

## システム要件

- kintone環境
- 必要なkintoneアプリ
  - アプリ一覧（ID: 382）
  - アプリバージョン管理システム（ID: 374）

## インストール方法

1. このリポジトリをクローンまたはダウンロードします
2. `dist` ディレクトリ内のJavaScriptファイルをkintoneのカスタマイズJSとして登録します

## 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/okayus/kintone-app-version-controller.git
cd kintone-app-version-controller

# 依存パッケージのインストール
npm install
```

## プロジェクト構成

```
├── src/                            # ソースコード
│   ├── app-list-backup.ts          # アプリ一覧バックアップメイン処理
│   ├── app-list-backup.test.ts     # テストコード
│   ├── services/                   # サービス層
│   │   ├── app-service.ts          # アプリ情報取得サービス
│   │   ├── app-service.test.ts     # テストコード
│   │   ├── version-service.ts      # バージョン管理サービス
│   │   └── version-service.test.ts # テストコード
│   ├── types/                      # 型定義
│   │   ├── index.ts                # 共通型定義
│   │   ├── fields.d.ts             # kintoneフィールド型定義テンプレート
│   │   ├── field374.d.ts           # アプリバージョン管理システム型定義（自動生成）
│   │   └── field382.d.ts           # アプリ一覧型定義（自動生成）
│   └── utils/                      # ユーティリティ
│       ├── api-client.ts           # API通信クライアント
│       └── api-client.test.ts      # テストコード
├── dist/                           # ビルド成果物
├── docs/                           # ドキュメント
│   └── requirements.md             # 要件定義書
└── README.md                       # プロジェクト説明
```

## 使い方

1. kintoneの「アプリ一覧」アプリでバックアップボタンをクリックします
2. バックアップ処理が自動的に実行され、各アプリの情報が取得されます
3. 変更があったアプリは新しいバージョンとして「アプリバージョン管理システム」に記録されます

## バージョン管理の方法

本システムでは、アプリの設定変更を検出すると自動的に新しいバージョンを作成します。バージョン番号は単純な通し番号（連番）方式を採用しています。

- 初期バージョン: `1`
- 2回目の更新: `2`
- 3回目の更新: `3`

という形で、数値が1ずつ増加していきます。これにより、バージョン間の新旧関係が明確になります。

## 開発者向け情報

### ビルド方法

```bash
# 開発用ビルド
npm run build:dev

# 本番用ビルド
npm run build:prod
```

### テスト実行

```bash
# テスト実行
npm test

# テスト監視モード
npm run test:watch

# UIでテストを実行
npm run test:ui
```

### 型定義生成

kintoneアプリのフィールド情報から型定義を自動生成するには、以下のコマンドを実行します。

環境変数を設定してから実行する方法:
```bash
# 環境変数を設定
export KINTONE_DOMAIN=your-domain.cybozu.com
export KINTONE_USERNAME=your-username
export KINTONE_PASSWORD=your-password
export KINTONE_APP_ID=123

# 型定義を生成
npm run generate-types
```

または直接コマンドを実行する方法:
```bash
npx kintone-dts-gen --base-url https://your-domain.cybozu.com \
                     -u your-username \
                     -p your-password \
                     --app-id 123 \
                     -o src/types/field123.d.ts
```

プロジェクトでは、2つのkintoneアプリの型定義ファイルを生成しています：

- `field374.d.ts`: アプリバージョン管理システム(ID: 374)の型定義
- `field382.d.ts`: アプリ一覧(ID: 382)の型定義

これらのファイルは以下のコマンドで個別に生成またはアップデートできます：

```bash
# アプリバージョン管理システムの型定義を生成
npx kintone-dts-gen --base-url https://your-domain.cybozu.com \
                     -u your-username \
                     -p your-password \
                     --app-id 374 \
                     -o src/types/field374.d.ts

# アプリ一覧の型定義を生成
npx kintone-dts-gen --base-url https://your-domain.cybozu.com \
                     -u your-username \
                     -p your-password \
                     --app-id 382 \
                     -o src/types/field382.d.ts
```

生成された型定義をアプリケーションで使用するには、次のように`kintone.types`名前空間を参照します：

```typescript
// アプリバージョン管理システムのレコードデータ型を使用
const record: kintone.types.SavedFields = event.record;
```

## ライセンス

MIT License

## 関連資料

- [要件定義書](./docs/requirements.md)
