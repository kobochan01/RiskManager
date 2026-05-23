# レビュー記録

---

## 2026-05-23 品質レビュー

レビュー対象ブランチ: `fix/44-seed-utc-datetime-bug`

### 重大バグ（P0）

#### 1. マスタ管理の「名前変更」が常に失敗する

**対象ファイル:**
- `src/preload/index.ts:5`
- `src/renderer/src/components/MasterPage.tsx:75`

**原因:** `env.d.ts` では `invoke(channel: string, ...args: unknown[])` と宣言されているが、preload の実装は `(channel: string, data?: unknown)` の単一引数しか受け取れない。MasterPage で `window.api.invoke(channel, id, name)` と2引数を渡しているため、`name` が実行時に捨てられる。

```ts
// preload の実装（バグあり）
invoke: (channel: string, data?: unknown) => ipcRenderer.invoke(channel, data)

// MasterPage の呼び出し
await window.api.invoke(IPC[activeTab].update, id, name)
// → 実行時: ipcRenderer.invoke(channel, id) となり name が消える
```

**影響:** IPC ハンドラ側で `name = undefined → SQL NULL` となり、`NOT NULL` 制約違反でエラー。ユーザーには「同じ名前がすでに登録されています」という誤ったメッセージが表示され、クラス・場所・けが種類の名前変更が完全に機能しない。

**修正方法:**
```ts
// preload/index.ts
invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args)
```

---

### セキュリティ（P1）

#### 2. 外部キー制約が有効化されていない

**対象ファイル:** `src/main/db.ts:90`

SQLite はデフォルトで外部キー制約が無効。`PRAGMA foreign_keys = ON` がないため、incidents テーブルから参照されているクラス・場所・けが種類をマスタ管理から削除できてしまい、孤立レコードが発生する。

**修正方法:**
```ts
// initDb() 内で SCHEMA 実行後に追加
db.run('PRAGMA foreign_keys = ON')
```

#### 3. Preload に IPC channel allowlist がない

**対象ファイル:** `src/preload/index.ts:4`

任意のチャンネル名を渡せるため、XSS が発生した場合に `db:get-setting` / `db:set-setting` など設定系チャンネルへのアクセスが可能になる。ローカルアプリなので現実的リスクは低いが、許可チャンネルを明示するのがベストプラクティス。

#### 4. `sandbox: false` の設定

**対象ファイル:** `src/main/index.ts:14`

Electron のセキュリティベストプラクティスでは `sandbox: true`（デフォルト）を推奨。sql.js の WASM ローディングとの依存関係があるなら、その理由をコメントで明示すること。

---

### バグ（P2）

#### 5. PDF生成中のエラーでゾンビDOMが残る

**対象ファイル:** `src/renderer/src/components/DashboardPage.tsx:148`

`document.body.removeChild(container)` が `try` ブロック内にあるため、エラー発生時にスキップされ DOM が残留する。`createRoot` のアンマウントも行われていない。

**修正方法:**
```ts
const root = createRoot(container)
try {
  // ... PDF生成処理
} finally {
  root.unmount()
  document.body.removeChild(container)
  setExporting(false)
}
```

#### 6. MasterPage の削除に確認ダイアログがない

**対象ファイル:** `src/renderer/src/components/MasterPage.tsx:54`

IncidentList では `window.confirm` があるのに MasterPage にはなく、×ボタンクリックで即削除される。誤削除リスクがある。

#### 7. IncidentList のフィルターが全件取得+クライアントサイド処理

**対象ファイル:** `src/renderer/src/components/IncidentList.tsx:63`

全件取得後にクライアントサイドでフィルタリングしている。現在の規模（数百件程度）では問題ないが、将来的にはサーバーサイドフィルタリングへの移行を検討すること。

#### 8. `formatOccurredAt` / `openEdit` の日付形式混在リスク

**対象ファイル:** `src/renderer/src/components/IncidentList.tsx:4`, `:99`

```ts
const d = new Date(raw.replace(' ', 'T'))  // スペース区切りに対応
occurred_at: occurred_at.slice(0, 16)       // T区切り・秒なしを前提
```

DB に `2026-05-23T09:30`（フォーム登録）と `2026-05-23 09:30:00`（旧形式/シードデータ）が混在する場合、`slice(0, 16)` の結果が変わる。

---

### テスト（P3）

#### 9. テストカバレッジが事実上ゼロ

`src/renderer/src/utils/pdfExport.test.ts` は `buildPdfFileName` のみ対象。以下の重要ロジックにテストがない：

- `splitIncidentsIntoPages` の境界値（0件、30件ちょうど、31件）
- `getPeriodRange` の四半期計算（年度またぎの Q4: `yearOffset: 1` パス）
- `migrateDb` のマイグレーション処理
- IPC ハンドラの SQL の正当性（統合テスト）

---

### コード品質（P4）

#### 10. `buildPdfFileName` の replace が意図不明瞭

**対象ファイル:** `src/renderer/src/utils/pdfExport.ts:46`

```ts
const yyyymm = from.slice(0, 7).replace('-', '')
// 動作は正しいが、String.replace は最初の1件のみ置換するという挙動に依存している
// より明示的な書き方:
const yyyymm = from.slice(0, 4) + from.slice(5, 7)
```

#### 11. タブ切り替えで全コンポーネントが常時マウント済み

**対象ファイル:** `src/renderer/src/App.tsx:38`

```tsx
<div className={mainTab !== 'form' ? 'hidden' : ''}><IncidentForm /></div>
```

`hidden` クラスで非表示にしているだけなので、起動時に4ページが同時マウントされ、それぞれ独立して IPC 呼び出しを行う。起動時の DB 問い合わせが多発する。

---

### 優先度まとめ

| 優先度 | 件数 | 内容 |
|--------|------|------|
| P0（リリースブロッカー） | 1 | マスタ名前変更バグ（`invoke` 引数が消える） |
| P1（セキュリティ） | 3 | 外部キー制約なし・channel allowlist なし・sandbox: false |
| P2（機能バグ） | 4 | ゾンビDOM・削除確認なし・全件取得フィルター・日付形式混在 |
| P3（テスト） | 1 | カバレッジ不足 |
| P4（コード品質） | 2 | replace の意図不明・全タブ同時マウント |

**最優先修正:** P0 の preload 1行修正（`data?` → `...args`）と、P1 の `PRAGMA foreign_keys = ON` 追加。
