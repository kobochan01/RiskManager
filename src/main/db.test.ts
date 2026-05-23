import { describe, it, expect, beforeAll } from 'vitest'
import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import { readFileSync } from 'fs'
import { join } from 'path'

let SQL: SqlJsStatic

beforeAll(async () => {
  const wasmBinary = readFileSync(join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'))
  SQL = await initSqlJs({ wasmBinary })
})

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
