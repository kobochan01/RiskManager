import { ipcMain, dialog } from 'electron'
import { writeFileSync } from 'fs'
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

  ipcMain.handle('db:update-class', (_e, id: number, name: string) => {
    getDb().run('UPDATE classes SET name = ? WHERE id = ?', [name, id])
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

  ipcMain.handle('db:update-injury-type', (_e, id: number, name: string) => {
    getDb().run('UPDATE injury_types SET name = ? WHERE id = ?', [name, id])
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

  ipcMain.handle('db:update-location', (_e, id: number, name: string) => {
    getDb().run('UPDATE locations SET name = ? WHERE id = ?', [name, id])
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

  ipcMain.handle('db:update-incident', (_e, payload: {
    id: number
    occurred_at: string
    location_id: number
    class_id: number
    child_name: string
    injury_type_id: number
    description: string
  }) => {
    getDb().run(
      `UPDATE incidents SET
        occurred_at = ?, location_id = ?, class_id = ?,
        child_name = ?, injury_type_id = ?, description = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        payload.occurred_at, payload.location_id, payload.class_id,
        payload.child_name, payload.injury_type_id, payload.description,
        payload.id
      ]
    )
    persistDb()
  })

  ipcMain.handle('db:delete-incident', (_e, id: number) => {
    getDb().run('DELETE FROM incidents WHERE id = ?', [id])
    persistDb()
  })

  // ---- 集計 ----
  ipcMain.handle('db:get-stats', (_e, payload: { dateFrom: string; dateTo: string }) => {
    const db = getDb()
    const { dateFrom, dateTo } = payload

    const timeRows = db.exec(`
      SELECT
        CAST(strftime('%H', occurred_at) AS INTEGER) AS slot_index,
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

    const countMap = new Map<number, number>()
    for (const [slotIndex, count] of (timeRows[0]?.values ?? [])) {
      countMap.set(Number(slotIndex), Number(count))
    }
    const timeSlots: { slot: string; count: number }[] = []
    for (let h = 7; h <= 18; h++) {
      const hh = String(h).padStart(2, '0')
      timeSlots.push({
        slot: `${hh}:00-${hh}:59`,
        count: countMap.get(h) ?? 0
      })
    }

    return {
      timeSlots,
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

  // ---- 期間フィルタ付き事案一覧 ----
  ipcMain.handle('db:get-incidents-filtered', (_e, payload: { dateFrom: string; dateTo: string }) => {
    const { dateFrom, dateTo } = payload
    const rows = getDb().exec(`
      SELECT i.id, i.occurred_at, l.name, c.name, i.child_name,
             it.name, i.description
      FROM incidents i
      JOIN locations   l  ON l.id  = i.location_id
      JOIN classes     c  ON c.id  = i.class_id
      JOIN injury_types it ON it.id = i.injury_type_id
      WHERE date(i.occurred_at) >= ? AND date(i.occurred_at) <= ?
      ORDER BY i.occurred_at
    `, [dateFrom, dateTo])
    return rows[0]?.values ?? []
  })

  // ---- 時間帯クロス集計（場所別・けが種類別） ----
  ipcMain.handle('db:get-matrix', (_e, payload: { dateFrom: string; dateTo: string }) => {
    const { dateFrom, dateTo } = payload
    const db = getDb()

    const locRows = db.exec(`
      SELECT
        CAST(strftime('%H', i.occurred_at) AS INTEGER) * 4 +
        CAST(strftime('%M', i.occurred_at) AS INTEGER) / 15 AS slot_index,
        l.name AS location_name,
        COUNT(*) AS count
      FROM incidents i
      JOIN locations l ON l.id = i.location_id
      WHERE date(i.occurred_at) >= ? AND date(i.occurred_at) <= ?
      GROUP BY slot_index, location_name
      ORDER BY slot_index
    `, [dateFrom, dateTo])

    const injRows = db.exec(`
      SELECT
        CAST(strftime('%H', i.occurred_at) AS INTEGER) * 4 +
        CAST(strftime('%M', i.occurred_at) AS INTEGER) / 15 AS slot_index,
        it.name AS injury_type_name,
        COUNT(*) AS count
      FROM incidents i
      JOIN injury_types it ON it.id = i.injury_type_id
      WHERE date(i.occurred_at) >= ? AND date(i.occurred_at) <= ?
      GROUP BY slot_index, injury_type_name
      ORDER BY slot_index
    `, [dateFrom, dateTo])

    const locationMatrix: Record<string, Record<string, number>> = {}
    const injuryMatrix: Record<string, Record<string, number>> = {}

    // 表示する時間帯スロット（07:00〜18:00、15分刻み）
    const SLOT_START_H = 7
    const SLOT_END_H = 18
    const allSlots: string[] = []
    for (let h = SLOT_START_H; h <= SLOT_END_H; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = String(h).padStart(2, '0')
        allSlots.push(`${hh}:${String(m).padStart(2, '0')}-${hh}:${String(m + 14).padStart(2, '0')}`)
      }
    }
    const slotSet = new Set<string>(allSlots)

    // マスタ全件を列の初期値にする（0件の項目も表示するため）
    const allLocRows = db.exec('SELECT name FROM locations ORDER BY id')
    const allInjRows = db.exec('SELECT name FROM injury_types ORDER BY id')
    const locationSet = new Set<string>(
      (allLocRows[0]?.values ?? []).map(([name]) => String(name))
    )
    const injuryTypeSet = new Set<string>(
      (allInjRows[0]?.values ?? []).map(([name]) => String(name))
    )

    for (const [slotIndex, locationName, count] of (locRows[0]?.values ?? [])) {
      const idx = Number(slotIndex)
      const h = Math.floor(idx / 4)
      const m = (idx % 4) * 15
      const hh = String(h).padStart(2, '0')
      const slot = `${hh}:${String(m).padStart(2, '0')}-${hh}:${String(m + 14).padStart(2, '0')}`
      if (!slotSet.has(slot)) continue
      if (!locationMatrix[slot]) locationMatrix[slot] = {}
      locationMatrix[slot][String(locationName)] = Number(count)
    }

    for (const [slotIndex, injuryTypeName, count] of (injRows[0]?.values ?? [])) {
      const idx = Number(slotIndex)
      const h = Math.floor(idx / 4)
      const m = (idx % 4) * 15
      const hh = String(h).padStart(2, '0')
      const slot = `${hh}:${String(m).padStart(2, '0')}-${hh}:${String(m + 14).padStart(2, '0')}`
      if (!slotSet.has(slot)) continue
      if (!injuryMatrix[slot]) injuryMatrix[slot] = {}
      injuryMatrix[slot][String(injuryTypeName)] = Number(count)
    }

    return {
      slotLabels: Array.from(slotSet).sort(),
      locations: Array.from(locationSet),
      injuryTypes: Array.from(injuryTypeSet),
      locationMatrix,
      injuryMatrix,
    }
  })

  // ---- PDF保存（バッファ受け取り） ----
  ipcMain.handle('pdf:export-save', async (_e, payload: { buffer: number[]; defaultName: string }) => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: payload.defaultName,
      filters: [{ name: 'PDF ファイル', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return { success: false }
    writeFileSync(filePath, Buffer.from(payload.buffer))
    return { success: true }
  })

  // ---- PDF出力（旧実装・互換用） ----
  ipcMain.handle('pdf:export', async (e, payload: { defaultName: string }) => {
    const pdfBuffer = await e.sender.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      landscape: true
    })
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: payload.defaultName,
      filters: [{ name: 'PDF ファイル', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return { success: false }
    writeFileSync(filePath, pdfBuffer)
    return { success: true }
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
