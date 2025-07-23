# AI Learning Game Platform

個別最適AIラーニングゲーム・プラットフォーム

## 概要

このプラットフォームは、生成AIを活用してパーソナライズされた学習体験を提供する、各科目のミニゲームを統一的に管理する共通基盤です。

## 技術スタック

- **フロントエンド**: React 18 + JavaScript
- **バックエンド**: Firebase / Supabase
- **AI統合**: OpenAI GPT-4 API / Claude API
- **スタイリング**: Tailwind CSS / Material-UI
- **状態管理**: React Query
- **ルーティング**: React Router

## プロジェクト構造

```
src/
├── components/       # UIコンポーネント
│   ├── common/      # 共通コンポーネント
│   ├── auth/        # 認証関連
│   ├── dashboard/   # ダッシュボード
│   ├── games/       # ゲーム関連
│   ├── analytics/   # 分析・レポート
│   └── admin/       # 管理機能
├── hooks/           # カスタムフック
├── services/        # API通信
├── utils/           # ユーティリティ
├── constants/       # 定数定義
├── game-engine/     # ゲームエンジン
├── screens/         # 画面コンポーネント
├── loaders/         # データローダー
├── core/            # コアシステム
│   ├── fsm/         # 有限状態マシン
│   ├── events/      # イベントバス
│   └── routing/     # ルーティング
├── battle/          # バトルシステム
└── platform/        # プラットフォーム機能
    ├── analytics/   # 分析機能
    └── adaptiveLearning/ # 適応学習
```

## セットアップ

### 1. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成し、必要な環境変数を設定してください。

```bash
cp .env.example .env
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm start
```

### 4. ビルド

```bash
npm run build
```

## 主な機能

### ユーザー役割
- **学習者**: パーソナライズされた学習ゲームへのアクセス
- **教師**: 生徒の進捗監視と分析
- **保護者**: 子供の学習進捗追跡
- **管理者**: プラットフォーム全体の管理

### コア機能
- AI駆動のパーソナライゼーション
- リアルタイム進捗追跡
- オフライン対応
- マルチデバイス同期
- 包括的な分析とレポート

## 開発コマンド

```bash
# 開発サーバー起動
npm start

# テスト実行
npm test

# 本番ビルド
npm run build

# コードリント
npm run lint

# コード自動修正
npm run lint:fix

# コードフォーマット
npm run format
```

## ライセンス

Private - All rights reserved
