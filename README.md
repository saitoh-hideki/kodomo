# こどもけんさく (Kodomo Kensaku)

子供向けの学習アプリケーションです。AIとの対話を通じて、子供たちが様々な知識を楽しく学べるプラットフォームです。

## 機能

- 🤖 **AIチャット**: 子供向けの優しいAIが質問に答えます
- 🎲 **まなびすごろく**: クイズに正解すると進む、楽しい学習ゲーム
- 🏪 **商店主紹介**: 実際のお店の先生との繋がり
- 📝 **Myノート**: 学んだことを記録
- 👨‍🏫 **先生登録**: 商店主が登録できる機能

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **バックエンド**: Supabase (Database, Auth, Edge Functions)
- **AI**: OpenAI GPT-4o
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React

## セットアップ

### 前提条件

- Node.js 18以上
- Supabase CLI
- OpenAI API キー

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/saitoh-hideki/kodomo.git
cd kodomo
```

2. 依存関係をインストール
```bash
cd kodomo-kensaku
npm install
```

3. Supabaseプロジェクトを設定
```bash
supabase init
supabase link --project-ref YOUR_PROJECT_REF
```

4. 環境変数を設定
```bash
# .env.local ファイルを作成
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

5. データベースマイグレーションを実行
```bash
supabase db push
```

6. Edge Functionsをデプロイ
```bash
supabase functions deploy generate-ai-response
supabase functions deploy generate-quiz
supabase functions deploy verify-quiz-answer
supabase functions deploy get-sugoroku-status
```

7. 開発サーバーを起動
```bash
npm run dev
```

## プロジェクト構造

```
kodomo/
├── kodomo-kensaku/          # Next.jsフロントエンド
│   ├── app/                 # App Router
│   ├── components/          # Reactコンポーネント
│   └── lib/                 # ユーティリティ
├── supabase/                # Supabase設定
│   ├── functions/           # Edge Functions
│   ├── migrations/          # データベースマイグレーション
│   └── schema.sql           # データベーススキーマ
└── types/                   # TypeScript型定義
```

## 主要な機能

### AIチャット
- ストリーミング対応のリアルタイムチャット
- 子供向けの優しい回答
- 質問に応じたクイズ生成

### まなびすごろく
- 10マスのすごろくゲーム
- クイズ正解で進む、不正解で戻る
- ゴール時に商店主紹介

### クイズシステム
- 独立したクイズ生成
- 3択形式
- 正解判定とすごろく連動

## 開発

### コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# リント
npm run lint
```

### Edge Functions

- `generate-ai-response`: AIチャット応答生成
- `generate-quiz`: クイズ生成
- `verify-quiz-answer`: クイズ回答検証
- `get-sugoroku-status`: すごろく状態取得

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します！

## 作者

saitoh-hideki 