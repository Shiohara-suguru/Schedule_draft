# ルーティンジョブ工数管理システム

各担当者のルーティンジョブ（定期的な業務）の工数を入力・管理するWebアプリケーションです。

## 機能

### 🕒 工数入力
- 担当者とルーティンジョブを選択して工数を記録
- 日付と備考を含む詳細な工数管理
- 直感的なフォームインターフェース

### 📊 記録一覧・検索
- 全工数記録の一覧表示
- 日付、担当者、ジョブ別のフィルタリング機能
- 記録の編集・削除機能

### 📈 統計・分析
- 期間指定による統計データの表示
- 担当者別工数統計
- ジョブ別工数統計
- 全体的な工数サマリー

### ⚙️ データ管理
- 新しい担当者の追加
- 新しいルーティンジョブの追加
- カテゴリ別のジョブ管理

## 技術スタック

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **データ保存**: JSON ファイルベース
- **プロセス管理**: PM2
- **スタイリング**: カスタムCSS（レスポンシブデザイン）

## インストールと起動

### 必要な環境
- Node.js (v14以上)
- npm

### セットアップ
```bash
# リポジトリのクローン
git clone [repository-url]
cd webapp

# 依存関係のインストール
npm install

# サーバーの起動（開発モード）
npm start

# または PM2 での起動
npm install pm2
npx pm2 start ecosystem.config.js
```

### アクセス
ブラウザで `http://localhost:3000` にアクセスしてください。

## API エンドポイント

### データ取得
- `GET /api/data` - 全データ取得
- `GET /api/members` - 担当者一覧
- `GET /api/routine-jobs` - ルーティンジョブ一覧
- `GET /api/work-entries` - 工数記録一覧
- `GET /api/stats` - 統計データ

### データ操作
- `POST /api/work-entries` - 工数記録の追加
- `PUT /api/work-entries/:id` - 工数記録の更新
- `DELETE /api/work-entries/:id` - 工数記録の削除
- `POST /api/members` - 担当者の追加
- `POST /api/routine-jobs` - ルーティンジョブの追加

## データ構造

### 担当者 (Members)
```json
{
  "id": 1,
  "name": "田中太郎",
  "department": "IT部門"
}
```

### ルーティンジョブ (Routine Jobs)
```json
{
  "id": 1,
  "name": "システム監視",
  "description": "日次システム監視業務",
  "category": "IT運用"
}
```

### 工数記録 (Work Entries)
```json
{
  "id": 1,
  "memberId": 1,
  "jobId": 1,
  "hours": 2.5,
  "date": "2025-08-21",
  "notes": "特記事項なし",
  "createdAt": "2025-08-21T06:33:57.000Z"
}
```

## 特徴

### 🎨 ユーザーインターフェース
- モダンで直感的なデザイン
- レスポンシブ対応（PC/タブレット/スマートフォン）
- ダークモード風のグラデーション背景
- Font Awesome アイコンの活用

### 🔧 技術的特徴
- RESTful API設計
- フロントエンドとバックエンドの分離
- エラーハンドリングと入力検証
- PM2によるプロセス管理
- ファイルベースのデータ永続化

### 📱 レスポンシブデザイン
- タブレット・スマートフォンでの最適な表示
- タッチフレンドリーなインターフェース
- 画面サイズに応じた要素の自動調整

## 使用方法

1. **工数入力**: 「工数入力」タブで担当者とジョブを選択し、工数を入力
2. **記録確認**: 「記録一覧」タブで過去の記録を確認・編集
3. **統計表示**: 「統計」タブで期間を指定して工数分析
4. **データ管理**: 「管理」タブで新しい担当者やジョブを追加

## 開発者向け

### ディレクトリ構造
```
/
├── public/          # 静的ファイル
│   ├── index.html   # メインHTML
│   ├── styles.css   # スタイルシート  
│   └── app.js       # フロントエンドJS
├── data/            # データファイル（自動生成）
├── logs/            # ログファイル
├── server.js        # メインサーバー
├── ecosystem.config.js  # PM2設定
└── package.json     # プロジェクト設定
```

### カスタマイズ
- `server.js`: バックエンドロジックの変更
- `public/app.js`: フロントエンドの機能追加
- `public/styles.css`: デザインの調整
- `ecosystem.config.js`: サーバー設定の変更

## ライセンス

MIT License

## 貢献

バグレポートや機能改善の提案は Issue または Pull Request でお願いします。