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
  // パッケージ済みアプリ: electron-builder が resources/ に配置
  // preview モード: node_modules にフォールバック
  const productionPath = join(process.resourcesPath, file)
  if (existsSync(productionPath)) return productionPath
  return join(process.cwd(), 'node_modules/sql.js/dist', file)
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

CREATE TABLE IF NOT EXISTS locations (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS incidents (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at     DATETIME NOT NULL,
  location_id     INTEGER  NOT NULL,
  class_id        INTEGER  NOT NULL,
  child_name      TEXT     NOT NULL,
  injury_type_id  INTEGER  NOT NULL,
  description     TEXT     NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id)    REFERENCES locations(id),
  FOREIGN KEY (class_id)       REFERENCES classes(id),
  FOREIGN KEY (injury_type_id) REFERENCES injury_types(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

// incidents.location(TEXT) → location_id(INTEGER FK) への移行
function migrateDb(database: Database): void {
  let cols = database.exec('PRAGMA table_info(incidents)')[0]?.values.map((r) => r[1]) ?? []

  if (cols.includes('location') && !cols.includes('location_id')) {
    database.run('ALTER TABLE incidents ADD COLUMN location_id INTEGER NOT NULL DEFAULT 0')
    database.run('INSERT OR IGNORE INTO locations (name) SELECT DISTINCT location FROM incidents')
    database.run(
      'UPDATE incidents SET location_id = (SELECT id FROM locations WHERE name = incidents.location)'
    )
    cols = database.exec('PRAGMA table_info(incidents)')[0]?.values.map((r) => r[1]) ?? []
  }

  // location_id への移行済みだが旧 location カラムが残っている場合、テーブルを再構築して除去
  if (cols.includes('location') && cols.includes('location_id')) {
    database.run('PRAGMA foreign_keys = OFF')
    database.run(`
      CREATE TABLE incidents_new (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        occurred_at     DATETIME NOT NULL,
        location_id     INTEGER  NOT NULL,
        class_id        INTEGER  NOT NULL,
        child_name      TEXT     NOT NULL,
        injury_type_id  INTEGER  NOT NULL,
        description     TEXT     NOT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id)    REFERENCES locations(id),
        FOREIGN KEY (class_id)       REFERENCES classes(id),
        FOREIGN KEY (injury_type_id) REFERENCES injury_types(id)
      )
    `)
    database.run(`
      INSERT INTO incidents_new
        (id, occurred_at, location_id, class_id, child_name, injury_type_id, description, created_at, updated_at)
      SELECT
        id, occurred_at, location_id, class_id, child_name, injury_type_id, description, created_at, updated_at
      FROM incidents
    `)
    database.run('DROP TABLE incidents')
    database.run('ALTER TABLE incidents_new RENAME TO incidents')
    database.run('PRAGMA foreign_keys = ON')
  }
}

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
  db.run('PRAGMA foreign_keys = ON')
  migrateDb(db)
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
