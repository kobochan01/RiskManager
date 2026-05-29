import { ipcMain, dialog } from 'electron'
import { writeFileSync } from 'fs'
import { getDb, persistDb } from './db'
import { buildPdfWithTextPages } from './pdfBuilder'
import type { IncidentRow } from './pdfBuilder'

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

  // ---- 園児名マスタ ----
  ipcMain.handle('db:get-children', () => {
    const rows = getDb().exec('SELECT id, name FROM children ORDER BY id')
    return rows[0]?.values ?? []
  })

  ipcMain.handle('db:add-child', (_e, name: string) => {
    getDb().run('INSERT INTO children (name) VALUES (?)', [name])
    persistDb()
  })

  ipcMain.handle('db:delete-child', (_e, id: number) => {
    getDb().run('DELETE FROM children WHERE id = ?', [id])
    persistDb()
  })

  ipcMain.handle('db:update-child', (_e, id: number, name: string) => {
    getDb().run('UPDATE children SET name = ? WHERE id = ?', [name, id])
    persistDb()
  })

  // ---- ヒヤリハット報告 ----
  ipcMain.handle('db:get-incidents', (_e, filters?: {
    keyword?: string
    classId?: string
    injuryTypeId?: string
    dateFrom?: string
    dateTo?: string
    incidentType?: string
  }) => {
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (filters?.keyword) {
      conditions.push('(i.child_name LIKE ? OR i.description LIKE ?)')
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`)
    }
    if (filters?.classId) {
      conditions.push('c.id = ?')
      params.push(Number(filters.classId))
    }
    if (filters?.injuryTypeId) {
      conditions.push('it.id = ?')
      params.push(Number(filters.injuryTypeId))
    }
    if (filters?.dateFrom) {
      conditions.push('date(i.occurred_at) >= ?')
      params.push(filters.dateFrom)
    }
    if (filters?.dateTo) {
      conditions.push('date(i.occurred_at) <= ?')
      params.push(filters.dateTo)
    }
    if (filters?.incidentType) {
      conditions.push('i.incident_type = ?')
      params.push(filters.incidentType)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const rows = getDb().exec(`
      SELECT
        i.id, i.occurred_at,
        i.incident_type,
        l.name AS location_name,
        c.name AS class_name,
        i.child_name,
        it.name AS injury_type_name,
        i.description, i.created_at
      FROM incidents i
      JOIN locations   l  ON l.id  = i.location_id
      JOIN classes     c  ON c.id  = i.class_id
      JOIN injury_types it ON it.id = i.injury_type_id
      ${where}
      ORDER BY i.occurred_at DESC
    `, params)
    return rows[0]?.values ?? []
  })

  ipcMain.handle('db:add-incident', (_e, payload: {
    occurred_at: string
    incident_type: string
    location_id: number
    class_id: number
    child_name: string
    injury_type_id: number
    description: string
  }) => {
    getDb().run(
      `INSERT INTO incidents
        (occurred_at, incident_type, location_id, class_id, child_name, injury_type_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.occurred_at, payload.incident_type, payload.location_id, payload.class_id,
        payload.child_name, payload.injury_type_id, payload.description
      ]
    )
    persistDb()
  })

  ipcMain.handle('db:update-incident', (_e, payload: {
    id: number
    occurred_at: string
    incident_type: string
    location_id: number
    class_id: number
    child_name: string
    injury_type_id: number
    description: string
  }) => {
    getDb().run(
      `UPDATE incidents SET
        occurred_at = ?, incident_type = ?, location_id = ?, class_id = ?,
        child_name = ?, injury_type_id = ?, description = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        payload.occurred_at, payload.incident_type, payload.location_id, payload.class_id,
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
  ipcMain.handle('db:get-stats', (_e, payload: {
    dateFrom: string
    dateTo: string
    incidentType?: string
  }) => {
    const db = getDb()
    const { dateFrom, dateTo, incidentType } = payload
    const typeFilter = incidentType ? 'AND incident_type = ?' : ''
    const typeParam = incidentType ? [incidentType] : []

    const timeRows = db.exec(`
      SELECT
        CAST(strftime('%H', occurred_at) AS INTEGER) * 2 +
        CASE WHEN CAST(strftime('%M', occurred_at) AS INTEGER) >= 30 THEN 1 ELSE 0 END AS slot_index,
        COUNT(*) AS count
      FROM incidents
      WHERE date(occurred_at) >= ? AND date(occurred_at) <= ?
      ${typeFilter}
      GROUP BY slot_index
      ORDER BY slot_index
    `, [dateFrom, dateTo, ...typeParam])

    const injuryRows = db.exec(`
      SELECT it.name, COUNT(*) AS count
      FROM incidents i
      JOIN injury_types it ON it.id = i.injury_type_id
      WHERE date(i.occurred_at) >= ? AND date(i.occurred_at) <= ?
      ${typeFilter}
      GROUP BY it.id
      ORDER BY count DESC
    `, [dateFrom, dateTo, ...typeParam])

    const locationRows = db.exec(`
      SELECT l.name, COUNT(*) AS count
      FROM incidents i
      JOIN locations l ON l.id = i.location_id
      WHERE date(i.occurred_at) >= ? AND date(i.occurred_at) <= ?
      ${typeFilter}
      GROUP BY l.id
      ORDER BY count DESC
    `, [dateFrom, dateTo, ...typeParam])

    const totalRows = db.exec(`
      SELECT COUNT(*) FROM incidents
      WHERE date(occurred_at) >= ? AND date(occurred_at) <= ?
      ${typeFilter}
    `, [dateFrom, dateTo, ...typeParam])

    const countMap = new Map<number, number>()
    for (const [slotIndex, count] of (timeRows[0]?.values ?? [])) {
      countMap.set(Number(slotIndex), Number(count))
    }
    const timeSlots: { slot: string; count: number }[] = []
    for (let h = 7; h <= 18; h++) {
      for (let half = 0; half < 2; half++) {
        const hh = String(h).padStart(2, '0')
        const mStart = half === 0 ? '00' : '30'
        const mEnd   = half === 0 ? '29' : '59'
        timeSlots.push({
          slot: `${hh}:${mStart}-${hh}:${mEnd}`,
          count: countMap.get(h * 2 + half) ?? 0
        })
      }
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
  ipcMain.handle('db:get-incidents-filtered', (_e, payload: {
    dateFrom: string
    dateTo: string
    incidentType?: string
  }) => {
    const { dateFrom, dateTo, incidentType } = payload
    const rows = getDb().exec(`
      SELECT i.id, i.occurred_at, i.incident_type, l.name, c.name, i.child_name,
             it.name, i.description
      FROM incidents i
      JOIN locations   l  ON l.id  = i.location_id
      JOIN classes     c  ON c.id  = i.class_id
      JOIN injury_types it ON it.id = i.injury_type_id
      WHERE date(i.occurred_at) >= ? AND date(i.occurred_at) <= ?
      ${incidentType ? 'AND i.incident_type = ?' : ''}
      ORDER BY i.occurred_at
    `, incidentType ? [dateFrom, dateTo, incidentType] : [dateFrom, dateTo])
    return rows[0]?.values ?? []
  })

  // ---- PDF生成（テキストベース） ----
  ipcMain.handle('pdf:build', async (_e, payload: {
    incidentsByType: { type: string; incidents: IncidentRow[] }[]
    periodLabel: string
    chartImagesByType: { type: string; imageBytes: Uint8Array }[]
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return buildPdfWithTextPages(payload as any)
  })

  // ---- PDF保存（バッファ受け取り） ----
  ipcMain.handle('pdf:export-save', async (_e, payload: { buffer: Uint8Array; defaultName: string }) => {
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
