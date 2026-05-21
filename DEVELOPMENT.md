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
| 4 | [#9](https://github.com/kobochan01/RiskManager/issues/9) | ヒヤリハット報告入力 + マスタ管理（クラス・けがの種類・場所） | 作業中 |
| 5 | - | 報告一覧・検索 | 未着手 |
| 6 | - | 集計ダッシュボード + PDFレポート | 未着手 |

---

## 機能スコープ（フェーズ）

### Phase 1 - MVP
- 起動パスワード認証（変更機能あり）
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
| `feature/9-incident-form-and-master` | - | ヒヤリハット報告入力 + マスタ管理 | 作業中 |

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
