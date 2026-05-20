import { ipcMain } from 'electron'
import { getDb, persistDb } from './db'

export function registerIpcHandlers(): void {
  // ---- クラスマスタ ----
  ipcMain.handle('db:get-classes', () => {
    const rows = getDb().exec('SELECT id, name FROM classes ORDER BY id')
    return rows[0]?.values ?? []
  })

  ipcMain.handle('db:add-class', (_e, name: string) => {
    getDb().run('INSERT INTO classes (name) VALUES (?)', [name])
    persistDb()
  })

  ipcMain.handle('db:delete-class', (_e, id: number) => {
    getDb().run('DELETE FROM classes WHERE id = ?', [id])
    persistDb()
  })

  // ---- けが種類マスタ ----
  ipcMain.handle('db:get-injury-types', () => {
    const rows = getDb().exec('SELECT id, name FROM injury_types ORDER BY id')
    return rows[0]?.values ?? []
  })

  ipcMain.handle('db:add-injury-type', (_e, name: string) => {
    getDb().run('INSERT INTO injury_types (name) VALUES (?)', [name])
    persistDb()
  })

  ipcMain.handle('db:delete-injury-type', (_e, id: number) => {
    getDb().run('DELETE FROM injury_types WHERE id = ?', [id])
    persistDb()
  })

  // ---- ヒヤリハット報告 ----
  ipcMain.handle('db:get-incidents', () => {
    const rows = getDb().exec(`
      SELECT
        i.id, i.occurred_at, i.location,
        c.name AS class_name,
        i.child_name,
        it.name AS injury_type_name,
        i.description, i.created_at
      FROM incidents i
      JOIN classes      c  ON c.id  = i.class_id
      JOIN injury_types it ON it.id = i.injury_type_id
      ORDER BY i.occurred_at DESC
    `)
    return rows[0]?.values ?? []
  })

  ipcMain.handle('db:add-incident', (_e, payload: {
    occurred_at: string
    location: string
    class_id: number
    child_name: string
    injury_type_id: number
    description: string
  }) => {
    getDb().run(
      `INSERT INTO incidents
        (occurred_at, location, class_id, child_name, injury_type_id, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payload.occurred_at, payload.location, payload.class_id,
        payload.child_name, payload.injury_type_id, payload.description
      ]
    )
    persistDb()
  })

  // ---- 設定 ----
  ipcMain.handle('db:get-setting', (_e, key: string) => {
    const rows = getDb().exec('SELECT value FROM settings WHERE key = ?', [key])
    return rows[0]?.values[0]?.[0] ?? null
  })

  ipcMain.handle('db:set-setting', (_e, key: string, value: string) => {
    getDb().run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    )
    persistDb()
  })
}
