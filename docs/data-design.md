# データ設計

[要件定義書](requirements.md) のセクション 5 詳細。

---

## テーブル一覧

| テーブル名 | 用途 |
|-----------|------|
| `incidents` | ヒヤリハット報告 |
| `classes` | クラスマスタ |
| `injury_types` | けがの種類マスタ |
| `locations` | 場所マスタ |
| `settings` | アプリ設定（パスワードハッシュ等） |

---

## スキーマ定義

```sql
CREATE TABLE classes (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE injury_types (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE locations (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE incidents (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at    DATETIME NOT NULL,
  location_id    INTEGER  NOT NULL REFERENCES locations(id),
  class_id       INTEGER  NOT NULL REFERENCES classes(id),
  child_name     TEXT     NOT NULL,
  injury_type_id INTEGER  NOT NULL REFERENCES injury_types(id),
  description    TEXT     NOT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
  -- key='password_hash': scrypt ハッシュ（<saltHex>:<hashHex> 形式）
);
```

---

## ER図（テキスト）

```
classes ──────┐
               ├─── incidents
injury_types ──┤
               │
locations ─────┘

settings  （独立テーブル）
```

---

## DBファイルの保存先

| 環境 | パス |
|------|------|
| 本番（パッケージ済み） | `%APPDATA%\riskmanager\db.sqlite` |
| 開発（`npm run dev`） | プロジェクトルート直下 `db.sqlite` |
