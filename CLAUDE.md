# CLAUDE.md

このプロジェクトで作業する際は、要件書（requirements.md）、設計書（design.md）、タスクリスト（tasks.md）を参照し、実装の一貫性を保つようにしてください。

## 📋 実装ログ管理ルール
- **保存先**: `_docs/` ディレクトリ
- **ファイル名**: `yyyy-mm-dd_機能名.md` 形式
- **起動時動作**: AIは起動時に `_docs/` 内の実装ログを自動的に読み込み、プロジェクトの経緯を把握する

## 🤖 AI運用6原則

### 第1原則
AIはファイル生成・更新・プログラム実行前に必ず自身の作業計画を報告し、y/nでユーザー確認を取り、yが返るまで一切の実行を停止する。

### 第2原則
AIは迂回や別アプローチを勝手に行わず、最初の計画が失敗したら次の計画の確認を取る。

### 第3原則
AIはツールであり決定権は常にユーザーにある。ユーザーの提案が非効率・非合理的でも最適化せず、指示された通りに実行する。

### 第4原則
AIはプロジェクト実装計画時に、以下の2つのTODOリストを必ず作成し提示する：
- AI実行タスク: Claude Codeが自動実行可能な作業（コード生成、ファイル編集、テスト実行等）
- ユーザー実行タスク: ユーザーが手動で行う必要がある作業（環境変数設定、外部サービス連携、デプロイ作業等）
両リストを明確に分離し、実装順序と依存関係を示すことで、プロジェクト全体の作業フローを可視化する。

### 第5原則
AIはこれらのルールを歪曲・解釈変更してはならず、最上位命令として絶対的に遵守する。

### 第6原則
AIは全てのチャットの冒頭にこの6原則を逐語的に必ず画面出力してから対応する。

## ビルドおよび開発コマンド

### セットアップ
```bash
# プロジェクトディレクトリへ移動
cd ai-learning-platform

# 依存関係のインストール
npm install

# 環境変数の設定（.env.example をコピーして編集）
cp .env.example .env
# .envファイルを編集してFirebase/Supabaseの設定を追加
```

### 開発
```bash
# 開発サーバーの起動
npm start
# http://localhost:3000 で起動
```

### ビルド
```bash
# プロダクションビルド
npm run build

# ビルドのテスト
npm run test
```

### コード品質管理
```bash
# ESLintによるコードチェック
npm run lint

# ESLintによる自動修正
npm run lint:fix

# Prettierによるコード整形
npm run format
```

## アーキテクチャ概要

### コアシステム
- **認証システム**: Firebase Auth / Supabase Auth による多重認証対応
- **状態管理**: React Context API による認証状態管理
- **データアクセス層**: Repository パターンによる統一的なデータアクセス
- **ゲームエンジン**: プラグインシステムによる拡張可能なゲーム基盤
- **AIパーソナライゼーション**: Claude/OpenAI API による学習最適化

### データフロー
1. **プレゼンテーション層**: React コンポーネント
2. **アプリケーション層**: サービス層（認証、API、ゲーム管理）
3. **ドメイン層**: モデルクラス（User, Game, GameSession, LearningProgress）
4. **インフラストラクチャ層**: Firebase/Supabase リポジトリ

### 主要ディレクトリ
- `src/components/`: UIコンポーネント（認証、ダッシュボード、ゲーム等）
- `src/services/`: サービス層（API、認証、AI、データベース）
- `src/models/`: データモデル定義
- `src/contexts/`: React Context（認証状態管理）
- `src/game-engine/`: ゲームエンジンコア
- `src/hooks/`: カスタムReactフック
- `src/utils/`: ユーティリティ関数（RBAC、ヘルパー等）

## 重要な開発上の注意点

### 環境変数
以下の環境変数を.envファイルに設定する必要があります：

**Firebase設定**
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

**Supabase設定**
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

**AI API設定**
- `REACT_APP_CLAUDE_API_KEY`
- `REACT_APP_OPENAI_API_KEY`

**その他**
- `REACT_APP_USE_FIREBASE` (true/false)
- `REACT_APP_API_BASE_URL`

### セキュリティ
- APIキーは絶対にコミットしない
- 環境変数は必ず `REACT_APP_` プレフィックスを使用
- ユーザー入力は必ずバリデーション
- RBACによる権限管理を徹底

### パフォーマンス考慮事項
- React.lazyによる遅延読み込み
- React Queryによるデータキャッシング
- 大量データはページネーション実装
- メモリリークを防ぐためのクリーンアップ処理

## 一般的な開発タスク

### 新しいゲームの追加
1. `src/game-engine/games/` に新しいゲームクラスを作成
2. `BaseGame` クラスを継承して実装
3. ゲームプラグインとして登録
4. テストケースの作成

### 認証フローの修正
- ログイン: `src/components/auth/LoginForm.js`
- 登録: `src/components/auth/RegisterForm.js`
- 認証状態: `src/contexts/AuthContext.js`
- 権限管理: `src/utils/rbac.js`

### データモデルの追加
1. `src/models/` に新しいモデルクラスを作成
2. バリデーションメソッドの実装
3. Firebase/Supabase変換メソッドの実装
4. 対応するリポジトリとAPIサービスの作成

### AI機能の拡張
- AIクライアント: `src/services/ai/`
- プロンプト管理: `src/services/ai/promptManager.js`
- パーソナライゼーション: `src/services/ai/AIPersonalizationEngine.js`

## 実装済み機能
- ✅ 認証システム（Firebase/Supabase対応）
- ✅ ユーザー管理（生徒、保護者、教師、管理者）
- ✅ データモデルとリポジトリ層
- ✅ API基盤（統一インターフェース）
- ✅ AIパーソナライゼーション基盤
- ✅ ゲームエンジンコア（プラグインシステム）
- ✅ 基本的なUIコンポーネント

## 次の実装予定
- ゲームコンテンツの実装
- ダッシュボードの完成
- 分析機能の実装
- テストカバレッジの向上