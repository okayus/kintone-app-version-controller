# インストール手順

このドキュメントでは、kintoneアプリバージョン管理システムの開発環境セットアップ手順を説明します。

## 必要条件

- Node.js (v16以上)
- npm (v8以上)
- kintone環境

## インストール手順

1. リポジトリをクローンします。

```bash
git clone https://github.com/okayus/kintone-app-version-controller.git
cd kintone-app-version-controller
```

2. 依存パッケージをインストールします。

```bash
npm install
```

## ビルド方法

```bash
# 開発用ビルド
npm run build:dev

# 本番用ビルド
npm run build:prod
```

ビルドされたファイルは `dist` ディレクトリに出力されます。

## テスト実行方法

```bash
# 全テストを実行
npm test

# ウォッチモードでテスト実行（ファイル変更時に自動実行）
npm run test:watch

# テストUIで実行
npm run test:ui
```

## リント・フォーマット

```bash
# リント実行
npm run lint

# リント実行＆自動修正
npm run lint:fix

# コードフォーマット
npm run format
```

## 主要な依存パッケージ

- **TypeScript関連**
  - typescript: TypeScriptコンパイラ
  - ts-node: TypeScriptを直接実行するためのツール

- **ビルド関連**
  - vite: モダンなフロントエンドビルドツール
  - @kintone/plugin-packer: kintoneプラグインをパッケージングするツール

- **テスト関連**
  - vitest: Viteに最適化されたテストランナー
  - @vitest/ui: Vitestのグラフィカルインターフェース
  - jsdom: ブラウザ環境のエミュレーション
  - @testing-library/dom: DOMテスト用ユーティリティ

- **コード品質関連**
  - eslint: JavaScriptリンター
  - prettier: コードフォーマッター

- **kintone関連**
  - @kintone/rest-api-client: kintone REST APIクライアント
  - @kintone/dts-gen: kintone型定義生成ツール

- **ユーティリティ**
  - lodash: JavaScript汎用ユーティリティライブラリ
  - diff: 差分検出ライブラリ
  - deep-equal: オブジェクト比較ライブラリ
