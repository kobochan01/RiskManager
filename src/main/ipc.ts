import { ipcMain } from 'electron'
import { getDb, persistDb } from './db'
import { hashPassword, verifyPassword } from './auth'

export function registerIpcHandlers(): void {
  // ---- 認証 ----
  ipcMain.handle('auth:has-password', () => {
    const rows = getDb().exec("SELECT value FROM settings WHERE key = 'password_hash'")
    return rows[0]?.values.length > 0
  })

  ipcMain.handle('auth:verify', (_e, password: string) => {
    const rows = getDb().exec("SELECT value FROM settings WHERE key = 'password_hash'")
    const stored = rows[0]?.values[0]?.[0] as string | undefined
    if (!stored) return false
    return verifyPassword(password, stored)
  })

  ipcMain.handle('auth:set-password', (_e, password: string) => {
    const hash = hashPassword(password)
    getDb().run(
      "INSERT INTO settings (key, value) VALUES ('password_hash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [hash]
    )
    persistDb()
  })


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

  // ---- 場所マスタ ----
  ipcMain.handle('db:get-locations', () => {
    const rows = getDb().exec('SELECT id, name FROM locations ORDER BY id')
    return rows[0]?.values ?? []
  })

  ipcMain.handle('db:add-location', (_e, name: string) => {
    getDb().run('INSERT INTO locations (name) VALUES (?)', [name])
    persistDb()
  })

  ipcMain.handle('db:delete-location', (_e, id: number) => {
    getDb().run('DELETE FROM locations WHERE id = ?', [id])
    persistDb()
  })

  // ---- ヒヤリハット報告 ----
  ipcMain.handle('db:get-incidents', () => {
    const rows = getDb().exec(`
      SELECT
        i.id, i.occurred_at,
        l.name AS location_name,
        c.name AS class_name,
        i.child_name,
        it.name AS injury_type_name,
        i.description, i.created_at
      FROM incidents i
      JOIN locations   l  ON l.id  = i.location_id
      JOIN classes     c  ON c.id  = i.class_id
      JOIN injury_types it ON it.id = i.injury_type_id
      ORDER BY i.occurred_at DESC
    `)
    return rows[0]?.values ?? []
  })

  ipcMain.handle('db:add-incident', (_e, payload: {
    occurred_at: string
    location_id: number
    class_id: number
    child_name: string
    injury_type_id: number
    description: string
  }) => {
    getDb().run(
      `INSERT INTO incidents
        (occurred_at, location_id, class_id, child_name, injury_type_id, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payload.occurred_at, payload.location_id, payload.class_id,
        payload.child_name, payload.injury_type_id, payload.description
      ]
    )
    persistDb()
  })

  // ---- 集計 ----
  ipcMain.handle('db:get-stats', (_e, payload: { dateFrom: string; dateTo: string }) => {
    const db = getDb()
    const { dateFrom, dateTo } = payload

    const timeRows = db.exec(`
      SELECT
        CAST(strftime('%H', occurred_at) AS INTEGER) * 4 +
        CAST(strftime('%M', occurred_at) AS INTEGER) / 15 AS slot_index,
        COUNT(*) AS count
      FROM incidents
      WHERE date(occurred_at) >= ? AND date(occurred_at) <= ?
      GROUP BY slot_index
      ORDER BY slot_index
    `, [dateFrom, dateTo])

    const injuryRows = db.exec(`
      SELECT it.name, COUNT(*) AS count
      FROM incidents i
      JOIN injury_types it ON it.id = i.injury_type_id
      WHERE date(i.occurred_at) >= ? AND date(i.occurred_at) <= ?
      GROUP BY it.id
      ORDER BY count DESC
    `, [dateFrom, dateTo])

    const locationRows = db.exec(`
      SELECT l.name, COUNT(*) AS count
      FROM incidents i
      JOIN locations l ON l.id = i.location_id
      WHERE date(i.occurred_at) >= ? AND date(i.occurred_at) <= ?
      GROUP BY l.id
      ORDER BY count DESC
    `, [dateFrom, dateTo])

    const totalRows = db.exec(`
      SELECT COUNT(*) FROM incidents
      WHERE date(occurred_at) >= ? AND date(occurred_at) <= ?
    `, [dateFrom, dateTo])

    return {
      timeSlots: (timeRows[0]?.values ?? []).map(([slotIndex, count]) => {
        const idx = Number(slotIndex)
        const h = Math.floor(idx / 4)
        const m = (idx % 4) * 15
        return {
          slot: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          count: Number(count)
        }
      }),
      injuryTypes: (injuryRows[0]?.values ?? []).map(([name, count]) => ({
        name: String(name),
        count: Number(count)
      })),
      locations: (locationRows[0]?.values ?? []).map(([name, count]) => ({
        name: String(name),
        count: Number(count)
      })),
      total: Number(totalRows[0]?.values[0]?.[0] ?? 0)
    }
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
