import { Fragment, useEffect, useState } from 'react'

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

export default function IncidentList(): JSX.Element {
  const [rows, setRows] = useState<IncidentRow[]>([])
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

  useEffect(() => {
    Promise.all([
      window.api.invoke('db:get-incidents'),
      window.api.invoke('db:get-classes'),
      window.api.invoke('db:get-injury-types'),
    ]).then(([incidents, cls, inj]) => {
      setRows(incidents as IncidentRow[])
      setClasses(cls as MasterItem[])
      setInjuryTypes(inj as MasterItem[])
    })
  }, [])

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
                      <td className="px-3 py-2 text-gray-700">{occurredAt.replace('T', ' ').slice(0, 16)}</td>
                      <td className="px-3 py-2 text-gray-700">{locationName}</td>
                      <td className="px-3 py-2 text-gray-700">{className}</td>
                      <td className="px-3 py-2 text-gray-700">{childName}</td>
                      <td className="px-3 py-2 text-gray-700">{injuryTypeName}</td>
                      <td className="px-3 py-2 text-gray-500">{shortDesc}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-blue-50">
                        <td colSpan={6} className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">
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
    </div>
  )
}
