# RiskManager 開発ログ

## プロジェクト概要

保育園内で発生したヒヤリハット（園児のけがや事故）を記録・管理・分析するデスクトップアプリ。
先生たちが事故の傾向を把握し、日常業務の安全改善につなげることが目的。

---

## 技術スタック

| 分類 | 採用技術 | 採用理由 |
|------|----------|----------|
| フレームワーク | Electron 34 | デスクトップアプリ。Web技術ベースで保守しやすい |
| UI | React 18 + TypeScript | 型安全なコンポーネント開発 |
| ビルドツール | electron-vite 2.3 | Electronの3層構造を一括管理 |
| スタイル | TailwindCSS 3 | 管理画面に適した素早いUI構築 |
| DB | sql.js 1.12（WASMベースSQLite） | Pythonなしでインストール可能（後述） |
| パッケージング | electron-builder 25 | Windows向け配布ファイル生成 |

---

## 開発進捗

| # | Issue | 内容 | 状態 |
|---|-------|------|------|
| 1 | [#1](https://github.com/kobochan01/RiskManager/issues/1) | プロジェクト雛形のセットアップ | ✅ 完了 |
| 2 | [#5](https://github.com/kobochan01/RiskManager/issues/5) | DBセットアップ（SQLiteスキーマ） | ✅ 完了 |
| 3 | [#7](https://github.com/kobochan01/RiskManager/issues/7) | 起動パスワード認証 + 変更機能 | ✅ 完了 |
| 4 | [#9](https://github.com/kobochan01/RiskManager/issues/9) | ヒヤリハット報告入力 + マスタ管理（クラス・けがの種類・場所） | ✅ 完了 |
| 5 | [#11](https://github.com/kobochan01/RiskManager/issues/11) | 報告一覧・絞り込み検索 | ✅ 完了 |
| 6 | [#13](https://github.com/kobochan01/RiskManager/issues/13) | 集計ダッシュボード（時間帯別・けが種類別・場所別） | ✅ 完了 |
| 7 | [#15](https://github.com/kobochan01/RiskManager/issues/15) | PDFレポート出力 | ✅ 完了 |
| 8 | [#17](https://github.com/kobochan01/RiskManager/issues/17) | パスワード認証機能の撤廃 | ✅ 完了 |
| 9 | [#19](https://github.com/kobochan01/RiskManager/issues/19) | 報告入力フォームの状態保持 + 一括クリアボタン | ✅ 完了 |
| 10 | [#21](https://github.com/kobochan01/RiskManager/issues/21) | 報告入力のクラス・園児名・けがの種類にフリーワード入力を追加 | ✅ 完了 |
| 11 | [#23](https://github.com/kobochan01/RiskManager/issues/23) | ダッシュボード集計期間を月別・四半期別・年別の選択式に変更 | ✅ 完了 |
| 12 | [#25](https://github.com/kobochan01/RiskManager/issues/25) | 時間帯別集計の行ラベルを期間表示（HH:MM-HH:MM形式）に変更 | ✅ 完了 |
| 13 | [#27](https://github.com/kobochan01/RiskManager/issues/27) | PDF集計表を午前/午後2ページ分割・グラフ全スロット表示に変更 | ✅ 完了 |
| 14 | [#29](https://github.com/kobochan01/RiskManager/issues/29) | 報告一覧・マスタ管理に編集機能を追加 | ✅ 完了 |
| 15 | [#31](https://github.com/kobochan01/RiskManager/issues/31) | 集計表セル結合・グラフ1時間表示・日時日本語形式に対応 | ✅ 完了 |
| 16 | [#33](https://github.com/kobochan01/RiskManager/issues/33) | pdfExport.ts に型定義とPDF生成関数を追加 | ✅ 完了 |
| 17 | [#35](https://github.com/kobochan01/RiskManager/issues/35) | 時刻の時間部ゼロパディングとPDF集計表PMラベルのバグを修正 | ✅ 完了 |
| 18 | [#37](https://github.com/kobochan01/RiskManager/issues/37) | recharts v3の自動ラベル間引きを防ぎ時間帯別グラフ横軸に全12ラベルを表示 | ✅ 完了 |
| 19 | [#39](https://github.com/kobochan01/RiskManager/issues/39) | Stopフックでコードコミット時のmdファイル更新チェックを自動化 | ✅ 完了 |
| 20 | [#41](https://github.com/kobochan01/RiskManager/issues/41) | 報告入力の時間選択肢を07時〜18時59分に制限する | ✅ 完了 |
| 21 | [#49](https://github.com/kobochan01/RiskManager/issues/49) | SQLite の外部キー制約を有効化する（PRAGMA foreign_keys = ON） | ✅ 完了 |
| 22 | [#51](https://github.com/kobochan01/RiskManager/issues/51) | P1/P2 セキュリティ・バグ修正（IPC allowlist, ゾンビDOM, 削除確認） | ✅ 完了 |
| 23 | [#53](https://github.com/kobochan01/RiskManager/issues/53) | PDF出力の画質向上（scale:2 + PNG形式） | ✅ 完了 |

---

## 機能スコープ（フェーズ）

### Phase 1 - MVP
- ヒヤリハット報告入力（日時 / 場所フリーワード / クラス選択 / 名前 / けが種類選択 / 事故内容）
- マスタ管理（クラス：事前設定 / けがの種類：登録制）
- 報告一覧・絞り込み検索

### Phase 2
- 集計ダッシュボード（時間帯別15分刻み / けが種類別 / 場所別）
- PDFレポート出力

---

## DBスキーマ

```sql
CREATE TABLE incidents (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at     DATETIME NOT NULL,
  location        TEXT NOT NULL,
  class_id        INTEGER NOT NULL,
  child_name      TEXT NOT NULL,
  injury_type_id  INTEGER NOT NULL,
  description     TEXT NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (injury_type_id) REFERENCES injury_types(id)
);

CREATE TABLE classes (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE injury_types (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
  -- key='password_hash' にハッシュ化パスワードを保存
);
```

---

## Issue #1 作業記録（2026-05-20）

### やったこと

- `electron-vite` を使ったプロジェクト雛形を構築
- 3層構造（メインプロセス / プリロード / Reactレンダラー）を整備
- TailwindCSS の設定
- `npm run dev` でアプリ起動を確認

### 詰まった点と解決策

#### 1. `better-sqlite3` のビルド失敗
**原因:** `better-sqlite3` はC++ネイティブモジュールのため、ビルドにPythonとVisual Studio Build Toolsが必要。  
**解決:** **sql.js**（WebAssembly版SQLite）に切り替え。Pythonなしでインストール可能。
- sql.jsはメモリ上でDBを操作し、変更時にバイナリをファイルへ保存する方式
- 機能は同等、パフォーマンスも実用上問題なし

#### 2. `@electron-toolkit/utils` の互換性エラー
**原因:** `@electron-toolkit/utils` v4 が Electron 34 と互換性がなかった。  
**解決:** パッケージを削除し、`process.env.NODE_ENV === 'development'` に置き換え。

#### 3. `electron.app` が undefined になる
**原因:** `npm install` 実行後、Electronの `install.js` が `ELECTRON_RUN_AS_NODE=1` を PowerShellセッションにセットしたまま残っていた。この状態で `electron.exe` を実行するとNode.jsモードで動作し、`require('electron')` がElectron APIではなくnpmパッケージのパス文字列を返す。  
**解決:** `package.json` の `dev` スクリプトに `SET ELECTRON_RUN_AS_NODE=0 &&` を追加。
```json
"dev": "SET ELECTRON_RUN_AS_NODE=0 && electron-vite dev"
```

---

## エラーログ

エラーが発生した作業は以下に記録する。

| 日付 | 作業 | エラー内容 | 原因 | 解決策 |
|------|------|-----------|------|--------|
| 2026-05-20 | Issue #1: `npm install` | `gyp ERR! Could not find any Python installation` | `better-sqlite3` がC++ネイティブモジュールのためPythonが必要 | `sql.js`（WASMベース）に切り替え |
| 2026-05-20 | Issue #1: `npm run dev` | `TypeError: Cannot read properties of undefined (reading 'isPackaged')` | `@electron-toolkit/utils` v4 が Electron 34 と非互換 | パッケージ削除、`process.env.NODE_ENV` で代替 |
| 2026-05-20 | Issue #1: `npm run dev` | `TypeError: Cannot read properties of undefined (reading 'whenReady')` | `npm install` 後に `ELECTRON_RUN_AS_NODE=1` がPowerShellセッションに残留。`electron.exe` がNode.jsモードで動作し `require('electron')` がAPI非返却 | `dev` スクリプトに `SET ELECTRON_RUN_AS_NODE=0 &&` を追加 |
| 2026-05-20 | Issue #5: `npm run dev` | `TypeError: Cannot read properties of undefined (reading 'whenReady')` | Electron 34 は `ELECTRON_RUN_AS_NODE` の**値**ではなく**存在**で判断。`SET VAR=0` は変数を存在させたままにするためNode.jsモードが継続 | `SET ELECTRON_RUN_AS_NODE=&&`（空値 = 変数を削除）に変更 |

---

## Issue #5 作業記録（2026-05-20）

### やったこと

- `src/main/db.ts` を新規作成（sql.js初期化 + 4テーブルスキーマ定義）
- `src/main/ipc.ts` を新規作成（IPCハンドラー骨格：クラス / けが種類 / ヒヤリハット / 設定）
- `src/main/index.ts` を更新（DB初期化とIPCハンドラー登録を追加）
- `src/renderer/src/env.d.ts` を新規作成（`window.api` 型定義）
- `package.json` にelectron-builderの設定と `sql-wasm.wasm` 同梱設定を追加
- `npm run dev` でアプリ起動・DBファイル生成（36864 bytes）を確認

### 詰まった点と解決策

#### `ELECTRON_RUN_AS_NODE` の挙動（Electron 34）
**原因:** Electron 34 は `ELECTRON_RUN_AS_NODE` の値ではなく**変数が存在するかどうか**でNode.jsモードを判断する。`SET ELECTRON_RUN_AS_NODE=0` は値を変更するだけで変数自体は残るため、Node.jsモードが継続した。  
**解決:** `SET ELECTRON_RUN_AS_NODE=&&`（等号の直後に `&&`）にして変数を削除する。  
`SET VAR=0` → 変数あり（Node.jsモード）  
`SET VAR=&&` → 変数なし（アプリモード）  
```json
"dev": "SET ELECTRON_RUN_AS_NODE=&& electron-vite dev"
```

---

## Issue #7 作業記録（2026-05-20）

### やったこと

- `src/main/auth.ts` を新規作成（`crypto.scryptSync` でパスワードをハッシュ化・検証）
- `src/main/ipc.ts` に3つのIPCハンドラーを追加（`auth:has-password` / `auth:verify` / `auth:set-password`）
- `src/renderer/src/components/LoginPage.tsx` を新規作成（初回パスワード設定 / ログインを切り替え）
- `src/renderer/src/components/ChangePasswordDialog.tsx` を新規作成（現パスワード確認 → 新パスワード設定）
- `src/renderer/src/App.tsx` を更新（`loading → locked → unlocked` の認証フローを管理）
- `npm run dev` で動作確認：初回起動時に「パスワードを設定してください」画面が正常に表示されることを確認

### 技術的な決定事項

- **ハッシュアルゴリズム**: `crypto.scryptSync`（Node.js標準。外部依存なし、パスワード専用の強いKDF）
- **ハッシュ保存形式**: `<16バイトsalt hex>:<32バイトhash hex>`（`settings` テーブルの `password_hash` キー）
- **タイミング攻撃対策**: `crypto.timingSafeEqual` で比較

---

## ブランチ・PR 履歴

| ブランチ | PR | 内容 | 状態 |
|----------|----|------|------|
| `chore/1-project-setup` | [#2](https://github.com/kobochan01/RiskManager/pull/2) | プロジェクト雛形 | ✅ マージ済み |
| `feature/5-db-setup` | [#6](https://github.com/kobochan01/RiskManager/pull/6) | DBセットアップ（SQLiteスキーマ） | ✅ マージ済み |
| `feature/7-password-auth` | [#8](https://github.com/kobochan01/RiskManager/pull/8) | 起動パスワード認証 + 変更機能 | ✅ マージ済み |
| `feature/9-incident-form-and-master` | [#10](https://github.com/kobochan01/RiskManager/pull/10) | ヒヤリハット報告入力 + マスタ管理 | ✅ マージ済み |
| `feature/11-incident-list` | [#12](https://github.com/kobochan01/RiskManager/pull/12) | 報告一覧・絞り込み検索 | ✅ マージ済み |
| `feature/13-dashboard` | [#14](https://github.com/kobochan01/RiskManager/pull/14) | 集計ダッシュボード | ✅ マージ済み |
| `feature/15-pdf-report` | [#16](https://github.com/kobochan01/RiskManager/pull/16) | PDFレポート出力 | ✅ マージ済み |
| `fix/17-remove-password-auth` | [#18](https://github.com/kobochan01/RiskManager/pull/18) | パスワード認証機能の撤廃 | ✅ マージ済み |
| `feature/19-form-state-retention` | [#20](https://github.com/kobochan01/RiskManager/pull/20) | フォーム状態保持 + 一括クリアボタン | ✅ マージ済み |
| `feature/21-freeword-inputs` | [#22](https://github.com/kobochan01/RiskManager/pull/22) | クラス・けがの種類フリーワード + 園児名オートコンプリート | ✅ マージ済み |
| `feature/23-dashboard-period-selector` | - | ダッシュボード集計期間の選択式変更（月別・四半期・年別） | ✅ マージ済み |
| `feature/41-restrict-time-selection-07-18` | [#42](https://github.com/kobochan01/RiskManager/pull/42) | 報告入力の時間選択肢を07時〜18時59分に制限する | ✅ マージ済み |
| `fix/49-foreign-keys-pragma` | [#50](https://github.com/kobochan01/RiskManager/pull/50) | SQLite の外部キー制約を有効化する（PRAGMA foreign_keys = ON） | ✅ マージ済み |

---

## Issue #9 作業記録（2026-05-21）

### やったこと

- `src/main/db.ts` に `locations` テーブルを追加し、`incidents.location TEXT` → `incidents.location_id INTEGER FK` に変更
- `initDb()` にマイグレーション処理を追加（既存DBの `location` カラムを `locations` テーブルに移行）
- `src/main/ipc.ts` に場所マスタ3ハンドラー（get/add/delete）を追加、incident ハンドラーを location_id 対応に更新
- `src/renderer/src/components/IncidentForm.tsx` を新規作成（報告入力フォーム、場所インライン追加機能付き）
- `src/renderer/src/components/MasterPage.tsx` を新規作成（クラス・けがの種類・場所の3タブ管理）
- `src/renderer/src/App.tsx` を「報告入力 | マスタ管理」2タブ構成に更新

### 技術的な決定事項

- **場所フィールドのUX**: セレクトボックス（登録済み場所）+ テキスト入力 + 追加ボタンのインライン方式。追加後は自動的にセレクトで選択済み状態になる
- **スキーマ変更**: `location TEXT` → `location_id INTEGER FK`（クラス・けがの種類と同じ正規化パターンに統一）
- **マイグレーション**: `PRAGMA table_info` で既存カラムを確認し、必要な場合のみ `ALTER TABLE` + データ移行を実行

---

## Issue #11 作業記録（2026-05-21）

### やったこと

- `src/renderer/src/components/IncidentList.tsx` を新規作成（報告一覧・絞り込みフィルタ・詳細展開）
- `src/renderer/src/App.tsx` に「報告一覧」タブを追加（3タブ構成に更新）
- `docs/requirements.md` を新規作成（要件定義書）
- `README.md` を更新（機能一覧をフェーズ別表形式に整理、要件定義書リンクを追加）

### 技術的な決定事項

- **フィルタリング**: フロントエンドのみで完結（全件取得後にクライアント側でフィルタ）。報告件数が数千件程度の想定なので DB クエリ分割は不要
- **詳細展開**: 行クリックでトグル。`React.Fragment key={id}` を使って行ペアを1単位として管理
- **`db:get-incidents` IPC**: JOIN で `location_name / class_name / injury_type_name` を結合して返すため、フロント側でマスタ ID→名称変換が不要

---

## Issue #13 作業記録（2026-05-21）

### やったこと

- `recharts` 3.8.1 を追加（グラフ描画ライブラリ）
- `src/main/ipc.ts` に `db:get-stats` IPCハンドラーを追加（時間帯別・けが種類別・場所別の集計クエリ）
- `src/renderer/src/components/DashboardPage.tsx` を新規作成（3グラフ + 期間フィルタ）
- `src/renderer/src/App.tsx` を4タブ構成に更新（ダッシュボードタブを追加）
- `src/main/db.ts` の `getWasmPath` を修正（preview モードで WASM ファイルが見つからないバグを修正）

### 技術的な決定事項

- **グラフライブラリ**: `recharts`（React ネイティブ、依存関係なし、TypeScript 型付き）
- **時間帯集計**: SQLite の `strftime` で時・分を抽出し、`CAST(...) / 15 * 15` で15分刻みにバケット化。`slot_index = hour * 4 + minute / 15` の整数で GROUP BY し、フロント側で時刻文字列に変換
- **期間フィルタ**: 今月・今四半期・今年・カスタムの4種。日付計算はフロントエンドで実施し、`dateFrom / dateTo` として IPC に渡す
- **WASM パスの修正**: 本番パッケージ（electron-builder）では `process.resourcesPath`、開発時は `node_modules/sql.js/dist/`、preview モードでは `existsSync` でフォールバック

---

## Issue #15 作業記録（2026-05-21）

### やったこと

- `html2canvas` 1.4.1 / `jspdf` 4.2.1 / `vitest` 4.1.7 を追加
- `src/renderer/src/utils/pdfExport.ts` を新規作成（`buildPdfFileName` ユーティリティ）
- `src/renderer/src/utils/pdfExport.test.ts` を新規作成（5件テスト）
- `vitest.config.ts` を新規作成、`package.json` に `test` スクリプトを追加
- `src/main/ipc.ts` に `pdf:export` IPCハンドラーを追加（printToPDF + showSaveDialog + writeFile）
- `src/renderer/src/components/DashboardPage.tsx` に「PDFとして出力」ボタンと印刷用ヘッダーを追加
- `src/renderer/src/App.tsx` のヘッダー・タブに `print:hidden` を追加（PDF印刷時のレイアウト制御）

### 技術的な決定事項

- **PDF生成方式**: `html2canvas` ではなく Electron の `webContents.printToPDF()` を使用。recharts が SVG を使用しており html2canvas では正常に描画できないため、Chromium ネイティブの print-to-PDF を採用
- **印刷レイアウト**: Tailwind の `print:hidden` / `hidden print:block` で `@media print` を制御。ヘッダー・タブ・操作ボタン類を非表示、ダッシュボードコンテンツのみ印刷
- **PDF保存フロー**: 1回の IPC 呼び出し `pdf:export` で printToPDF → showSaveDialog → writeFileSync を直列実行。レンダラー側の Buffer 往復が不要
- **IPC sender**: `e.sender.printToPDF()` でハンドラー呼び出し元の webContents を直接使用。`BrowserWindow.getFocusedWindow()` より確実

---

## Issue #17 作業記録（2026-05-21）

### やったこと

- `src/renderer/src/components/LoginPage.tsx` を削除
- `src/renderer/src/components/ChangePasswordDialog.tsx` を削除
- `src/main/auth.ts` を削除
- `src/main/ipc.ts` から `auth:has-password` / `auth:verify` / `auth:set-password` ハンドラーを削除
- `src/renderer/src/App.tsx` から認証フロー（`authState` / `hasPassword` / `showChangePw` 状態）とヘッダーの「パスワード変更」ボタンを削除。起動時に直接メイン画面を表示するよう変更

### 技術的な決定事項

- **DBスキーマは変更しない**: `settings` テーブルは残す。既存の `password_hash` レコードがあっても動作に影響なし
- **既存ユーザーへの影響**: DB ファイルが残っていても認証チェックが消えたため、次回起動からそのまま使用可能

---

## Issue #23 作業記録（2026-05-21）

### やったこと

- `src/renderer/src/components/DashboardPage.tsx` を全面書き換え
  - `Period` 型から `'custom'` を削除（`'month' | 'quarter' | 'year'` の3択に変更）
  - `customFrom` / `customTo` state を削除
  - `selectedYear` / `selectedMonth` / `selectedQuarter` state を追加
  - `getPeriodRange()` を新シグネチャ `(period, year, month, quarter)` に変更
  - `buildPeriodLabel()` 関数を追加（モード別の自然な日本語ラベル生成）
  - 期間フィルタUIを「ボタン3つ＋年/月/四半期ドロップダウン」構成に変更

### 技術的な決定事項

- **四半期の定義**: 第1四半期=4〜6月、第2=7〜9月、第3=10〜12月、第4=翌年1〜3月（`QUARTER_RANGES` 定数で管理）
- **selectedYear の意味**: 月別では暦年、四半期・年別では年度開始年（2026→2026年度＝2026-04-01〜2027-03-31）
- **年ドロップダウンの範囲**: 現在年/年度から4年前まで5件を表示
- **IPC変更なし**: `db:get-stats` の `{dateFrom, dateTo}` インターフェースはそのまま活用

---

## Issue #44 作業記録（2026-05-23）

### やったこと

- `scripts/seed.mjs` を新規作成（テスト用シードデータ生成スクリプト）
  - `randDateTime()` をローカル日付コンポーネント直接組み立てに変更（`toISOString()` 廃止）
  - 出力形式をフォームと同じ `YYYY-MM-DDTHH:MM` に統一
  - 時間帯を `07〜18` に変更（Issue #41 のフォーム制限と整合）
  - `main()` の先頭で既存 incidents を全件削除してからシード（マスタデータは保持）

### 技術的な決定事項

- **UTC vs ローカル時刻**: `d.toISOString()` は UTC 変換するため JST 業務時間（07〜17時）が `22:00〜08:00 UTC` になりグラフ集計（`strftime('%H', occurred_at)` が 07〜18 のみヒット）がずれる。ローカル成分（`d.getFullYear()` 等）を直接文字列化することで回避
- **seed のみの修正**: アプリ本体の INSERT/UPDATE は既にフォームのローカル時刻をそのままDBに保存しているため変更不要

---

## Issue #46 作業記録（2026-05-23）

### やったこと

- `src/preload/index.ts` の `invoke` 関数を1行修正

### 技術的な決定事項

- **原因**: `invoke: (channel: string, data?: unknown) => ipcRenderer.invoke(channel, data)` は単一引数しか渡せないため、`MasterPage` が `window.api.invoke(channel, id, name)` と2引数を渡すと `name` が捨てられる
- **影響**: `name = undefined → SQL NOT NULL 違反` となりマスタ管理（クラス・場所・けが種類）の名前変更が常に失敗していた。エラーメッセージも「同じ名前がすでに登録されています」と誤表示されていた
- **修正**: `...args: unknown[]` の可変長引数にすることで `env.d.ts` の型宣言と実装を一致させた

---

## Issue #49 作業記録（2026-05-23）

### やったこと

- `src/main/db.ts` の `initDb()` に `db.run('PRAGMA foreign_keys = ON')` を1行追加
- `src/main/db.test.ts` を新規作成（PRAGMA ON/OFF での FK 制約動作を3ケースで検証）

### 技術的な決定事項

- **PRAGMA のタイミング**: `db.run(SCHEMA)` の直後に設定。sql.js はインメモリDBのため、ファイルから読み込むたびに PRAGMA はリセットされる。毎回 `initDb()` で設定する必要がある
- **テスト方針**: `initDb()` は Electron の `app.getPath()` に依存するため直接テスト不可。代わりに sql.js を直接インポートして「PRAGMA あり/なし」で FK 違反の挙動が変わることを確認するテストを作成

---

## Issue #51 作業記録（2026-05-23）

### やったこと

- `src/preload/index.ts` に `ALLOWED_CHANNELS` 定数を追加し、allowlist 外のチャンネルは `Error` をスローするよう `invoke` を変更（P1-②）
- `src/main/index.ts` の `sandbox: false` に sql.js WASM 依存の理由コメントと移行時注記を追記（P1-③）
- `src/renderer/src/components/DashboardPage.tsx` の PDF 生成処理を修正。`container`・`root` を `try` 外で宣言し `finally` で `root.unmount()` と `removeChild` を実行することでエラー時のゾンビDOM を防止（P2-⑤）
- `src/renderer/src/components/MasterPage.tsx` の `handleDelete` に `window.confirm` を追加して誤削除を防止（P2-⑥）

### 技術的な決定事項

- **IPC allowlist の実装方針**: `as const` で型を絞った `ALLOWED_CHANNELS` 配列を定義し、`(ALLOWED_CHANNELS as readonly string[]).includes(channel)` でチェック。型推論を活かしつつランタイム検証も行う
- **ゾンビDOM修正のアプローチ**: `root` を `let` で外側に宣言し `finally` でクリーンアップする方式を採用。`container` 生成を `try` 外に出すことで、エラー・正常終了いずれでも DOM が残らないことを保証

---

## Issue #53 作業記録（2026-05-23）

### やったこと

- `src/renderer/src/utils/pdfExport.ts` の `html2canvas` オプションを変更
  - `scale: 1` → `scale: 2`（2x 解像度で描画）
  - `image/jpeg, 0.95` → `image/png`（可逆圧縮に変更）

### 技術的な決定事項

- **scale:2 の影響**: canvas サイズが縦横2倍になるため、メモリ使用量は約4倍になるが、ページ数が少ない（2〜3ページ）ため実用上問題なし
- **PNG 選択の理由**: グラフのラベル文字や罫線は高周波成分を含むため JPEG の離散コサイン変換でブロックノイズが出やすい。PNG の可逆圧縮で劣化を回避
