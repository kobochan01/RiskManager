import { app } from 'electron'
import initSqlJs, { Database } from 'sql.js'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const isDev = process.env.NODE_ENV === 'development'

// WASMファイルの場所を環境ごとに切り替える
// - 開発時: node_modules/sql.js/dist/
// - 本番時: electron-builderが同梱したresources/
function getWasmPath(file: string): string {
  if (isDev) {
    return join(process.cwd(), 'node_modules/sql.js/dist', file)
  }
  return join(process.resourcesPath, file)
}

function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  mkdirSync(userDataPath, { recursive: true })
  return join(userDataPath, 'riskmanager.db')
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS classes (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS injury_types (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS incidents (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at     DATETIME NOT NULL,
  location        TEXT     NOT NULL,
  class_id        INTEGER  NOT NULL,
  child_name      TEXT     NOT NULL,
  injury_type_id  INTEGER  NOT NULL,
  description     TEXT     NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id)       REFERENCES classes(id),
  FOREIGN KEY (injury_type_id) REFERENCES injury_types(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

let db: Database | null = null

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs({ locateFile: getWasmPath })
  const dbPath = getDbPath()

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run(SCHEMA)
  persistDb()
}

// 変更をファイルに書き出す
export function persistDb(): void {
  if (!db) return
  const data = db.export()
  writeFileSync(getDbPath(), Buffer.from(data))
}

export function getDb(): Database {
  if (!db) throw new Error('DB が初期化されていません')
  return db
}
