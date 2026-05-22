import { Fragment, useEffect, useState } from 'react'

function formatOccurredAt(raw: string): string {
  const d = new Date(raw.replace(' ', 'T'))
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hh}時${mm}分`
}

type MasterItem = [number, string]
type IncidentRow = [number, string, string, string, string, string, string, string]
// [id, occurred_at, location_name, class_name, child_name, injury_type_name, description, created_at]

type Filters = {
  keyword: string
  classId: string
  injuryTypeId: string
  dateFrom: string
  dateTo: string
}

type EditTarget = {
  id: number
  occurred_at: string
  location_id: number
  class_id: number
  child_name: string
  injury_type_id: number
  description: string
}

export default function IncidentList(): JSX.Element {
  const [rows, setRows] = useState<IncidentRow[]>([])
  const [locations, setLocations] = useState<MasterItem[]>([])
  const [classes, setClasses] = useState<MasterItem[]>([])
  const [injuryTypes, setInjuryTypes] = useState<MasterItem[]>([])
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    classId: '',
    injuryTypeId: '',
    dateFrom: '',
    dateTo: '',
  })
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [editError, setEditError] = useState('')

  async function loadAll(): Promise<void> {
    const [incidents, locs, cls, inj] = await Promise.all([
      window.api.invoke('db:get-incidents'),
      window.api.invoke('db:get-locations'),
      window.api.invoke('db:get-classes'),
      window.api.invoke('db:get-injury-types'),
    ])
    setRows(incidents as IncidentRow[])
    setLocations(locs as MasterItem[])
    setClasses(cls as MasterItem[])
    setInjuryTypes(inj as MasterItem[])
  }

  useEffect(() => { loadAll() }, [])

  const filtered = rows.filter((r) => {
    const [, occurredAt, , className, childName, injuryTypeName, description] = r
    if (
      filters.keyword &&
      !childName.includes(filters.keyword) &&
      !description.includes(filters.keyword)
    ) {
      return false
    }
    if (filters.classId) {
      const cls = classes.find(([id]) => String(id) === filters.classId)
      if (!cls || cls[1] !== className) return false
    }
    if (filters.injuryTypeId) {
      const inj = injuryTypes.find(([id]) => String(id) === filters.injuryTypeId)
      if (!inj || inj[1] !== injuryTypeName) return false
    }
    if (filters.dateFrom && occurredAt < filters.dateFrom) return false
    if (filters.dateTo && occurredAt > filters.dateTo + 'T23:59:59') return false
    return true
  })

  const resetFilters = (): void => {
    setFilters({ keyword: '', classId: '', injuryTypeId: '', dateFrom: '', dateTo: '' })
  }

  const hasFilter = Object.values(filters).some(Boolean)

  function openEdit(row: IncidentRow): void {
    const [id, occurred_at, locationName, className, , injuryTypeName, description] = row
    const childName = row[4]
    const loc = locations.find(([, n]) => n === locationName)
    const cls = classes.find(([, n]) => n === className)
    const inj = injuryTypes.find(([, n]) => n === injuryTypeName)
    setEditTarget({
      id,
      occurred_at: occurred_at.slice(0, 16),
      location_id: loc?.[0] ?? 0,
      class_id: cls?.[0] ?? 0,
      child_name: childName,
      injury_type_id: inj?.[0] ?? 0,
      description,
    })
    setEditError('')
  }

  async function handleSave(): Promise<void> {
    if (!editTarget) return
    if (
      !editTarget.occurred_at || editTarget.location_id === 0 ||
      editTarget.class_id === 0 || !editTarget.child_name ||
      editTarget.injury_type_id === 0 || !editTarget.description
    ) {
      setEditError('すべての項目を入力してください')
      return
    }
    const hour = new Date(editTarget.occurred_at).getHours()
    if (hour < 7 || hour > 18) {
      setEditError('発生時刻は07:00〜18:59の範囲で入力してください')
      return
    }
    try {
      await window.api.invoke('db:update-incident', editTarget)
      setEditTarget(null)
      await loadAll()
    } catch {
      setEditError('更新に失敗しました')
    }
  }

  async function handleDelete(id: number): Promise<void> {
    if (!window.confirm('この報告を削除してもよいですか？')) return
    await window.api.invoke('db:delete-incident', id)
    setExpandedId(null)
    await loadAll()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* フィルターパネル */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              フリーワード（園児名・内容）
            </label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
              placeholder="例: 山田"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">クラス</label>
            <select
              value={filters.classId}
              onChange={(e) => setFilters((f) => ({ ...f, classId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">すべて</option>
              {classes.map(([id, name]) => (
                <option key={id} value={String(id)}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">けがの種類</label>
            <select
              value={filters.injuryTypeId}
              onChange={(e) => setFilters((f) => ({ ...f, injuryTypeId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">すべて</option>
              {injuryTypes.map(([id, name]) => (
                <option key={id} value={String(id)}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">開始日</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">終了日</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="col-span-2 flex items-end justify-end">
            {hasFilter && (
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                フィルターをリセット
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 件数表示 */}
      <p className="text-sm text-gray-500 mb-2">
        {filtered.length} 件{hasFilter && `（全 ${rows.length} 件中）`}
      </p>

      {/* 一覧テーブル */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {rows.length === 0 ? '報告データがありません。' : '条件に一致する報告がありません。'}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-600 uppercase">
              <tr>
                <th className="px-3 py-2 text-left w-36">発生日時</th>
                <th className="px-3 py-2 text-left w-24">場所</th>
                <th className="px-3 py-2 text-left w-20">クラス</th>
                <th className="px-3 py-2 text-left w-24">園児名</th>
                <th className="px-3 py-2 text-left w-24">けがの種類</th>
                <th className="px-3 py-2 text-left">内容</th>
                <th className="px-3 py-2 text-left w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const [id, occurredAt, locationName, className, childName, injuryTypeName, description] = r
                const isExpanded = expandedId === id
                const shortDesc = description.length > 50 ? description.slice(0, 50) + '…' : description
                return (
                  <Fragment key={id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-3 py-2 text-gray-700">{formatOccurredAt(occurredAt)}</td>
                      <td className="px-3 py-2 text-gray-700">{locationName}</td>
                      <td className="px-3 py-2 text-gray-700">{className}</td>
                      <td className="px-3 py-2 text-gray-700">{childName}</td>
                      <td className="px-3 py-2 text-gray-700">{injuryTypeName}</td>
                      <td className="px-3 py-2 text-gray-500">{shortDesc}</td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(r)}
                            className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-blue-50">
                        <td colSpan={7} className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">
                          <span className="font-medium text-gray-500 text-xs mr-2">内容:</span>
                          {description}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 編集モーダル */}
      {editTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">報告を編集</h3>
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">発生日時</label>
                <input
                  type="datetime-local"
                  value={editTarget.occurred_at}
                  onChange={(e) => setEditTarget((t) => t && { ...t, occurred_at: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">場所</label>
                <select
                  value={editTarget.location_id}
                  onChange={(e) => setEditTarget((t) => t && { ...t, location_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={0}>-- 選択してください --</option>
                  {locations.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">クラス</label>
                <select
                  value={editTarget.class_id}
                  onChange={(e) => setEditTarget((t) => t && { ...t, class_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={0}>-- 選択してください --</option>
                  {classes.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">園児名</label>
                <input
                  type="text"
                  value={editTarget.child_name}
                  onChange={(e) => setEditTarget((t) => t && { ...t, child_name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">けがの種類</label>
                <select
                  value={editTarget.injury_type_id}
                  onChange={(e) => setEditTarget((t) => t && { ...t, injury_type_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={0}>-- 選択してください --</option>
                  {injuryTypes.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">事故内容</label>
                <textarea
                  value={editTarget.description}
                  onChange={(e) => setEditTarget((t) => t && { ...t, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              {editError && <p className="text-sm text-red-600">{editError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditTarget(null)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded border border-gray-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
