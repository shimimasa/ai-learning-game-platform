# ユーザー実行タスク一覧

このドキュメントは、AI学習ゲームプラットフォームの開発において、Claude Codeでは自動化できず、ユーザーが手動で実行する必要がある作業をまとめたものです。

## 📋 タスク概要

ユーザーが手動で行う必要がある作業は、主に以下の8つのカテゴリに分類されます：

1. 開発環境構築・初期設定
2. 外部サービス設定（Firebase/Supabase）
3. AI API設定（OpenAI/Claude）
4. 認証プロバイダー設定
5. コンテンツ・アセット準備
6. テスト・検証作業
7. デプロイメント・本番環境
8. 運用・監視設定

---

## 1. 開発環境構築・初期設定

### 1.1 Node.jsとnpmのインストール
- **作業内容**: Node.js（v16以上推奨）とnpmのインストール
- **確認コマンド**:
  ```bash
  node --version
  npm --version
  ```
- **理由**: React/JavaScriptプロジェクトの実行に必要
- **参考URL**: https://nodejs.org/

### 1.2 プロジェクトの初期化
- **作業内容**: Reactプロジェクトの作成と依存関係のインストール
- **実行コマンド**:
  ```bash
  npx create-react-app ai-learning-platform
  cd ai-learning-platform
  npm install
  ```
- **追加パッケージ**:
  ```bash
  # 必要な依存関係
  npm install firebase react-router-dom @supabase/supabase-js
  npm install @tanstack/react-query axios
  npm install tailwindcss @headlessui/react
  ```

### 1.3 環境変数ファイルの作成
- **作業内容**: `.env.example`をコピーして`.env`を作成
- **実行コマンド**:
  ```bash
  cp .env.example .env
  ```
- **注意**: `.env`ファイルは`.gitignore`に追加してコミットしない

### 1.4 開発サーバーの起動
- **作業内容**: ローカル開発サーバーの起動
- **実行コマンド**:
  ```bash
  npm start
  ```
- **アクセスURL**: `http://localhost:3000`

---

## 2. 外部サービス設定（Firebase/Supabase）

### 2.1 Firebaseプロジェクトの作成
- **作業内容**: Firebase Consoleでプロジェクト作成
- **手順**:
  1. [Firebase Console](https://console.firebase.google.com/)にアクセス
  2. 「プロジェクトを作成」をクリック
  3. プロジェクト名を入力（例：ai-learning-platform）
  4. Google Analyticsの設定（オプション）
  5. プロジェクトの作成完了を待つ

### 2.2 Firebase設定の取得
- **作業内容**: Firebase設定情報の取得と環境変数への設定
- **手順**:
  1. プロジェクト設定 > 全般
  2. 「アプリを追加」> Webアプリ
  3. アプリのニックネームを入力
  4. Firebase SDKの設定をコピー
- **環境変数に設定**:
  ```env
  REACT_APP_FIREBASE_API_KEY=your-api-key
  REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
  REACT_APP_FIREBASE_PROJECT_ID=your-project-id
  REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
  REACT_APP_FIREBASE_APP_ID=your-app-id
  ```

### 2.3 Firebaseサービスの有効化
- **有効化するサービス**:
  - Authentication（認証）
  - Firestore Database（データベース）
  - Storage（ファイルストレージ）
  - Functions（サーバーレス関数）
- **セキュリティルール**: 初期は開発用、本番では適切に設定

### 2.4 Supabaseプロジェクトの作成（代替案）
- **作業内容**: Supabaseプロジェクトの作成
- **手順**:
  1. [Supabase](https://supabase.com/)にアクセス
  2. 「New project」をクリック
  3. プロジェクト詳細を入力
  4. データベースパスワードを設定
- **環境変数に設定**:
  ```env
  REACT_APP_SUPABASE_URL=your-supabase-url
  REACT_APP_SUPABASE_ANON_KEY=your-anon-key
  ```

### 2.5 データベース初期設定
- **Firebaseの場合**: Firestoreのコレクション作成
- **Supabaseの場合**: PostgreSQLテーブルの作成
- **必要なテーブル/コレクション**:
  - users（ユーザー情報）
  - games（ゲーム情報）
  - game_sessions（ゲームセッション）
  - learning_progress（学習進捗）
  - analytics（分析データ）

---

## 3. AI API設定（OpenAI/Claude）

### 3.1 OpenAI APIキーの取得
- **作業内容**: OpenAI APIキーの作成と設定
- **手順**:
  1. [OpenAI Platform](https://platform.openai.com/)にアクセス
  2. APIキーセクションで新規キーを作成
  3. 使用制限とレート制限を設定
- **環境変数に設定**:
  ```env
  REACT_APP_OPENAI_API_KEY=sk-...
  ```
- **料金**: 従量課金制（使用量に応じて）

### 3.2 Claude API（Anthropic）の設定
- **作業内容**: Claude APIキーの取得
- **手順**:
  1. [Anthropic Console](https://console.anthropic.com/)にアクセス
  2. APIキーを作成
  3. 使用制限を設定
- **環境変数に設定**:
  ```env
  REACT_APP_CLAUDE_API_KEY=sk-ant-...
  ```

### 3.3 API使用量の監視設定
- **重要**: APIコストの管理
- **設定項目**:
  - 月次使用量上限
  - アラート設定
  - レート制限
  - キャッシュ戦略

---

## 4. 認証プロバイダー設定

### 4.1 Firebase Authentication設定
- **有効化する認証方法**:
  - メール/パスワード認証
  - Google認証
  - Apple認証（iOS対応の場合）
- **設定手順**:
  1. Firebase Console > Authentication
  2. Sign-in methodタブ
  3. 各プロバイダーを有効化

### 4.2 OAuth設定（Google）
- **作業内容**: Google OAuth 2.0の設定
- **手順**:
  1. [Google Cloud Console](https://console.cloud.google.com/)
  2. OAuth同意画面の設定
  3. 認証情報の作成
  4. 承認済みリダイレクトURIの設定

### 4.3 ドメイン承認
- **作業内容**: 認証用ドメインの承認
- **Firebase設定**:
  - localhost（開発用）
  - 本番ドメイン

---

## 5. コンテンツ・アセット準備

### 5.1 教育コンテンツの準備
- **必要なコンテンツ**:
  - 各科目の学習目標とカリキュラム
  - 難易度別の問題セット
  - 学習ガイドライン
- **形式**: JSON、Markdown、または構造化データ

### 5.2 ゲームアセット
- **必要なアセット**:
  - ゲームアイコン（各科目別）
  - UIアイコンセット
  - 背景画像
  - 効果音・BGM（オプション）
- **推奨形式**:
  - 画像: SVG、PNG（WebP対応）
  - 音声: MP3、OGG

### 5.3 多言語対応（オプション）
- **翻訳が必要な項目**:
  - UIテキスト
  - エラーメッセージ
  - 学習コンテンツ
- **管理方法**: i18nライブラリの使用

---

## 6. テスト・検証作業

### 6.1 マルチユーザーロールテスト
- **テスト対象**:
  - 学習者アカウント
  - 教師アカウント
  - 保護者アカウント
  - 管理者アカウント
- **確認項目**:
  - 各ロールの権限が正しく動作するか
  - アクセス制御が適切か

### 6.2 AI機能のテスト
- **テスト項目**:
  - パーソナライゼーションの精度
  - 推奨システムの妥当性
  - 難易度調整の適切さ
- **必要なデータ**: テスト用の学習履歴データ

### 6.3 負荷テスト
- **テスト内容**:
  - 同時接続ユーザー数（目標: 1000人以上）
  - データベースクエリのパフォーマンス
  - AI API呼び出しの応答時間
- **ツール**: Apache JMeter、k6など

### 6.4 セキュリティテスト
- **確認項目**:
  - SQLインジェクション対策
  - XSS対策
  - 認証・認可の脆弱性
  - APIキーの露出チェック

### 6.5 教育効果の検証
- **実施内容**:
  - 実際の学習者によるテスト利用
  - 学習効果の測定
  - フィードバックの収集
- **期間**: 2-4週間の試験運用

---

## 7. デプロイメント・本番環境

### 7.1 ホスティング環境の選定
- **選択肢**:
  - Firebase Hosting（Firebaseを使用する場合）
  - Vercel
  - Netlify
  - AWS Amplify
- **考慮事項**: コスト、パフォーマンス、スケーラビリティ

### 7.2 本番環境の設定
- **作業内容**:
  - 本番用環境変数の設定
  - ビルド最適化の設定
  - CDN設定
- **ビルドコマンド**:
  ```bash
  npm run build
  npm run test
  ```

### 7.3 CI/CDパイプラインの構築
- **設定項目**:
  - 自動テスト実行
  - ビルドプロセス
  - デプロイ自動化
- **ツール**: GitHub Actions、GitLab CI、CircleCI

### 7.4 ドメインとSSL設定
- **作業内容**:
  - カスタムドメインの設定
  - SSL証明書の設定
  - DNSレコードの設定

### 7.5 バックアップとディザスタリカバリ
- **設定項目**:
  - データベースの自動バックアップ
  - バックアップの保存期間
  - リストア手順の文書化

---

## 8. 運用・監視設定

### 8.1 パフォーマンス監視
- **監視ツール**:
  - Firebase Performance Monitoring
  - Google Analytics
  - Sentry（エラー監視）
- **監視項目**:
  - ページ読み込み時間
  - API応答時間
  - エラー率

### 8.2 コスト管理
- **監視対象**:
  - Firebase/Supabase使用量
  - AI API使用量
  - ストレージ使用量
- **アラート設定**: 予算超過警告

### 8.3 ユーザーサポート体制
- **準備項目**:
  - FAQドキュメント
  - サポートメールアドレス
  - フィードバックフォーム
  - バグ報告システム

### 8.4 データプライバシーとコンプライアンス
- **対応事項**:
  - プライバシーポリシーの作成
  - 利用規約の作成
  - GDPR/CCPA対応（必要に応じて）
  - 子供のプライバシー保護（COPPA）

### 8.5 定期メンテナンス計画
- **メンテナンス項目**:
  - セキュリティアップデート
  - 依存関係の更新
  - データベース最適化
  - ログのローテーション

---

## 📝 実行順序の推奨

### Phase 1: 基盤構築（1週間）
1. 開発環境構築（セクション1）
2. Firebase/Supabase設定（セクション2）
3. 認証プロバイダー設定（セクション4）

### Phase 2: AI統合（3-5日）
1. AI API設定（セクション3）
2. 基本的なAI機能のテスト

### Phase 3: 開発・テスト（3-4週間）
1. コンテンツ準備（セクション5）
2. 開発作業（Claude Codeと並行）
3. 各種テスト実施（セクション6）

### Phase 4: リリース準備（1週間）
1. 本番環境設定（セクション7）
2. 運用体制整備（セクション8）
3. 最終確認とリリース

---

## 🔄 継続的な作業

- AI APIコストの監視と最適化
- ユーザーフィードバックに基づく改善
- 新しい教育コンテンツの追加
- パフォーマンスモニタリング
- セキュリティアップデート

---

## 📌 重要な注意事項

1. **APIキー管理**: 絶対にコードにハードコードしない
2. **コスト管理**: AI APIは従量課金のため、使用量に注意
3. **子供の安全**: 教育プラットフォームとして適切なコンテンツ管理
4. **スケーラビリティ**: 将来的な成長を見据えた設計
5. **データセキュリティ**: 学習データの適切な保護

---

このドキュメントは、プロジェクトの進行に応じて更新される可能性があります。
最終更新日: 2025-07-25