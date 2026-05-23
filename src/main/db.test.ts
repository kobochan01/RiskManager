import { describe, it, expect, beforeAll } from 'vitest'
import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import { readFileSync } from 'fs'
import { join } from 'path'

let SQL: SqlJsStatic

beforeAll(async () => {
  const wasmBinary = readFileSync(join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'))
  SQL = await initSqlJs({ wasmBinary })
})

// --- テスト用 DB 構築ヘルパー ---

const SCHEMA = `
CREATE TABLE classes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
CREATE TABLE injury_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
CREATE TABLE locations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
CREATE TABLE incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at DATETIME NOT NULL,
  location_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  child_name TEXT NOT NULL,
  injury_type_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (injury_type_id) REFERENCES injury_types(id)
);
`

function createTestDb(): Database {
  const db = new SQL.Database()
  db.run(SCHEMA)
  db.run('PRAGMA foreign_keys = ON')
  db.run("INSERT INTO classes VALUES (1, '年少'), (2, '年中'), (3, '年長')")
  db.run("INSERT INTO injury_types VALUES (1, '打撲'), (2, '擦り傷')")
  db.run("INSERT INTO locations VALUES (1, '園庭'), (2, '廊下')")
  db.run(`INSERT INTO incidents (id, occurred_at, location_id, class_id, child_name, injury_type_id, description) VALUES
    (1, '2026-05-10T09:00', 1, 1, '田中一郎', 1, '転倒して膝を打った'),
    (2, '2026-05-15T10:30', 2, 2, '鈴木花子', 2, '廊下で滑って擦り傷'),
    (3, '2026-05-20T14:00', 1, 3, '山田太郎', 1, '遊具から落下')`)
  return db
}

function queryIncidents(db: Database, filters: {
  keyword?: string
  classId?: string
  injuryTypeId?: string
  dateFrom?: string
  dateTo?: string
} = {}): unknown[][] {
  const conditions: string[] = []
  const params: (string | number)[] = []
  if (filters.keyword) {
    conditions.push('(i.child_name LIKE ? OR i.description LIKE ?)')
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`)
  }
  if (filters.classId) {
    conditions.push('c.id = ?')
    params.push(Number(filters.classId))
  }
  if (filters.injuryTypeId) {
    conditions.push('it.id = ?')
    params.push(Number(filters.injuryTypeId))
  }
  if (filters.dateFrom) {
    conditions.push('date(i.occurred_at) >= ?')
    params.push(filters.dateFrom)
  }
  if (filters.dateTo) {
    conditions.push('date(i.occurred_at) <= ?')
    params.push(filters.dateTo)
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.exec(`
    SELECT i.id, i.occurred_at, l.name, c.name, i.child_name, it.name, i.description, i.created_at
    FROM incidents i
    JOIN locations l ON l.id = i.location_id
    JOIN classes c ON c.id = i.class_id
    JOIN injury_types it ON it.id = i.injury_type_id
    ${where}
    ORDER BY i.occurred_at DESC
  `, params)
  return rows[0]?.values ?? []
}

function createSchemaWithFk(db: Database): void {
  db.run(`CREATE TABLE parents (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`)
  db.run(`
    CREATE TABLE children (
      id INTEGER PRIMARY KEY,
      parent_id INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES parents(id)
    )
  `)
}

describe('PRAGMA foreign_keys', () => {
  it('ON のとき、存在しない親 ID を参照する INSERT が失敗する', () => {
    const db = new SQL.Database()
    createSchemaWithFk(db)
    db.run('PRAGMA foreign_keys = ON')

    expect(() => db.run('INSERT INTO children VALUES (1, 999)')).toThrow()
  })

  it('ON のとき、存在する親 ID を参照する INSERT は成功する', () => {
    const db = new SQL.Database()
    createSchemaWithFk(db)
    db.run('PRAGMA foreign_keys = ON')

    db.run("INSERT INTO parents VALUES (1, 'parent')")
    expect(() => db.run('INSERT INTO children VALUES (1, 1)')).not.toThrow()
  })

  it('OFF（デフォルト）のとき、FK 違反でも INSERT が通ってしまう', () => {
    const db = new SQL.Database()
    createSchemaWithFk(db)
    // PRAGMA なし = OFF

    expect(() => db.run('INSERT INTO children VALUES (1, 999)')).not.toThrow()
  })
})

describe('db:get-incidents フィルタリング', () => {
  it('フィルターなしのとき全件返す', () => {
    const db = createTestDb()
    expect(queryIncidents(db)).toHaveLength(3)
  })

  it('keyword で child_name を部分一致検索できる', () => {
    const db = createTestDb()
    const rows = queryIncidents(db, { keyword: '田中' })
    expect(rows).toHaveLength(1)
    expect(rows[0][4]).toBe('田中一郎')
  })

  it('keyword で description を部分一致検索できる', () => {
    const db = createTestDb()
    const rows = queryIncidents(db, { keyword: '廊下' })
    expect(rows).toHaveLength(1)
    expect(rows[0][4]).toBe('鈴木花子')
  })

  it('classId で絞り込める', () => {
    const db = createTestDb()
    const rows = queryIncidents(db, { classId: '2' })
    expect(rows).toHaveLength(1)
    expect(rows[0][3]).toBe('年中')
  })

  it('injuryTypeId で絞り込める', () => {
    const db = createTestDb()
    const rows = queryIncidents(db, { injuryTypeId: '1' })
    expect(rows).toHaveLength(2)
  })

  it('dateFrom で開始日以降を絞り込める', () => {
    const db = createTestDb()
    const rows = queryIncidents(db, { dateFrom: '2026-05-15' })
    expect(rows).toHaveLength(2)
  })

  it('dateTo で終了日以前を絞り込める', () => {
    const db = createTestDb()
    const rows = queryIncidents(db, { dateTo: '2026-05-15' })
    expect(rows).toHaveLength(2)
  })

  it('dateFrom と dateTo を組み合わせて期間絞り込みできる', () => {
    const db = createTestDb()
    const rows = queryIncidents(db, { dateFrom: '2026-05-12', dateTo: '2026-05-18' })
    expect(rows).toHaveLength(1)
    expect(rows[0][4]).toBe('鈴木花子')
  })

  it('スペース区切りの occurred_at でも日付フィルターが機能する', () => {
    const db = createTestDb()
    db.run(
      `INSERT INTO incidents (occurred_at, location_id, class_id, child_name, injury_type_id, description)
       VALUES ('2026-05-25 11:00:00', 1, 1, '旧形式太郎', 1, '旧形式データ')`
    )
    const rows = queryIncidents(db, { dateFrom: '2026-05-25', dateTo: '2026-05-25' })
    expect(rows).toHaveLength(1)
    expect(rows[0][4]).toBe('旧形式太郎')
  })
})

describe('occurred_at 正規化（openEdit 内の処理）', () => {
  it('スペース区切りの日時を T 区切りに正規化して16文字にスライスする', () => {
    const raw = '2026-05-23 09:30:00'
    expect(raw.replace(' ', 'T').slice(0, 16)).toBe('2026-05-23T09:30')
  })

  it('T 区切りの日時はそのまま16文字にスライスされる', () => {
    const raw = '2026-05-23T09:30'
    expect(raw.replace(' ', 'T').slice(0, 16)).toBe('2026-05-23T09:30')
  })
})
