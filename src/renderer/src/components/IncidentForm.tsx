import { useState, useEffect } from 'react'

type MasterItem = [number, string]

const CHILD_NAME_HISTORY_KEY = 'childNameHistory'

function loadChildNameHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHILD_NAME_HISTORY_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveChildNameHistory(name: string, history: string[]): string[] {
  const updated = [name, ...history.filter((n) => n !== name)].slice(0, 50)
  localStorage.setItem(CHILD_NAME_HISTORY_KEY, JSON.stringify(updated))
  return updated
}

export default function IncidentForm(): JSX.Element {
  const [locations, setLocations] = useState<MasterItem[]>([])
  const [classes, setClasses] = useState<MasterItem[]>([])
  const [injuryTypes, setInjuryTypes] = useState<MasterItem[]>([])

  const [occurredDate, setOccurredDate] = useState('')
  const [occurredHour, setOccurredHour] = useState('')
  const [occurredMinute, setOccurredMinute] = useState('')
  const [locationId, setLocationId] = useState<number>(0)
  const [classId, setClassId] = useState<number>(0)
  const [childName, setChildName] = useState('')
  const [injuryTypeId, setInjuryTypeId] = useState<number>(0)
  const [description, setDescription] = useState('')

  const [newLocation, setNewLocation] = useState('')
  const [addLocationError, setAddLocationError] = useState('')
  const [newClass, setNewClass] = useState('')
  const [addClassError, setAddClassError] = useState('')
  const [newInjuryType, setNewInjuryType] = useState('')
  const [addInjuryTypeError, setAddInjuryTypeError] = useState('')
  const [childNameHistory, setChildNameHistory] = useState<string[]>(() => loadChildNameHistory())
  const [newChildName, setNewChildName] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')

  async function loadMasters(): Promise<void> {
    const [locs, cls, inj] = await Promise.all([
      window.api.invoke('db:get-locations') as Promise<MasterItem[]>,
      window.api.invoke('db:get-classes') as Promise<MasterItem[]>,
      window.api.invoke('db:get-injury-types') as Promise<MasterItem[]>
    ])
    setLocations(locs)
    setClasses(cls)
    setInjuryTypes(inj)
  }

  useEffect(() => {
    loadMasters()
  }, [])

  async function handleAddLocation(): Promise<void> {
    const name = newLocation.trim()
    if (!name) return
    try {
      await window.api.invoke('db:add-location', name)
      const updated = (await window.api.invoke('db:get-locations')) as MasterItem[]
      setLocations(updated)
      const added = updated.find((l) => l[1] === name)
      if (added) setLocationId(added[0])
      setNewLocation('')
      setAddLocationError('')
    } catch {
      setAddLocationError('同じ名前の場所がすでに登録されています')
    }
  }

  async function handleAddClass(): Promise<void> {
    const name = newClass.trim()
    if (!name) return
    try {
      await window.api.invoke('db:add-class', name)
      const updated = (await window.api.invoke('db:get-classes')) as MasterItem[]
      setClasses(updated)
      const added = updated.find((c) => c[1] === name)
      if (added) setClassId(added[0])
      setNewClass('')
      setAddClassError('')
    } catch {
      setAddClassError('同じ名前のクラスがすでに登録されています')
    }
  }

  async function handleAddInjuryType(): Promise<void> {
    const name = newInjuryType.trim()
    if (!name) return
    try {
      await window.api.invoke('db:add-injury-type', name)
      const updated = (await window.api.invoke('db:get-injury-types')) as MasterItem[]
      setInjuryTypes(updated)
      const added = updated.find((i) => i[1] === name)
      if (added) setInjuryTypeId(added[0])
      setNewInjuryType('')
      setAddInjuryTypeError('')
    } catch {
      setAddInjuryTypeError('同じ名前のけがの種類がすでに登録されています')
    }
  }

  function handleAddChildName(): void {
    const name = newChildName.trim()
    if (!name) return
    setChildNameHistory((prev) => saveChildNameHistory(name, prev))
    setChildName(name)
    setNewChildName('')
  }

  function handleClear(): void {
    setOccurredDate('')
    setOccurredHour('')
    setOccurredMinute('')
    setLocationId(0)
    setClassId(0)
    setChildName('')
    setNewChildName('')
    setInjuryTypeId(0)
    setDescription('')
    setSubmitMessage('')
    setSubmitError('')
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setSubmitMessage('')
    setSubmitError('')

    if (!occurredDate || !occurredHour || !occurredMinute || locationId === 0 || classId === 0 || !childName || injuryTypeId === 0 || !description) {
      setSubmitError('すべての項目を入力してください')
      return
    }
    const occurredAt = `${occurredDate}T${occurredHour}:${occurredMinute}`
    const hour = new Date(occurredAt).getHours()
    if (hour < 7 || hour > 18) {
      setSubmitError('発生時刻は07:00〜18:59の範囲で入力してください')
      return
    }

    try {
      await window.api.invoke('db:add-incident', {
        occurred_at: occurredAt,
        location_id: locationId,
        class_id: classId,
        child_name: childName,
        injury_type_id: injuryTypeId,
        description
      })
      setChildNameHistory((prev) => saveChildNameHistory(childName, prev))
      handleClear()
      setSubmitMessage('報告を登録しました')
    } catch {
      setSubmitError('登録に失敗しました')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-6">ヒヤリハット報告入力</h2>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* 発生日時 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">発生日時</label>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="date"
              value={occurredDate}
              onChange={(e) => setOccurredDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={occurredHour}
              onChange={(e) => setOccurredHour(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">--</option>
              {Array.from({ length: 12 }, (_, i) => {
                const h = String(i + 7).padStart(2, '0')
                return <option key={h} value={h}>{h}</option>
              })}
            </select>
            <span className="text-sm text-gray-600">時</span>
            <select
              value={occurredMinute}
              onChange={(e) => setOccurredMinute(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">--</option>
              {Array.from({ length: 60 }, (_, i) => {
                const m = String(i).padStart(2, '0')
                return <option key={m} value={m}>{m}</option>
              })}
            </select>
            <span className="text-sm text-gray-600">分</span>
          </div>
        </div>

        {/* 場所 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">場所</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value={0}>-- 選択してください --</option>
            {locations.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="新しい場所を入力"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLocation() } }}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={handleAddLocation}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
            >
              追加
            </button>
          </div>
          {addLocationError && <p className="text-xs text-red-600 mt-1">{addLocationError}</p>}
        </div>

        {/* クラス */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">クラス</label>
          <select
            value={classId}
            onChange={(e) => setClassId(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value={0}>-- 選択してください --</option>
            {classes.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="新しいクラスを入力"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddClass() } }}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={handleAddClass}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
            >
              追加
            </button>
          </div>
          {addClassError && <p className="text-xs text-red-600 mt-1">{addClassError}</p>}
        </div>

        {/* 園児名 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">園児名</label>
          <select
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">-- 選択してください --</option>
            {childNameHistory.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="新しい園児名を入力"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChildName() } }}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={handleAddChildName}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
            >
              追加
            </button>
          </div>
        </div>

        {/* けがの種類 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">けがの種類</label>
          <select
            value={injuryTypeId}
            onChange={(e) => setInjuryTypeId(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value={0}>-- 選択してください --</option>
            {injuryTypes.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="新しいけがの種類を入力"
              value={newInjuryType}
              onChange={(e) => setNewInjuryType(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInjuryType() } }}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={handleAddInjuryType}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
            >
              追加
            </button>
          </div>
          {addInjuryTypeError && <p className="text-xs text-red-600 mt-1">{addInjuryTypeError}</p>}
        </div>

        {/* 事故内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">事故内容</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
        {submitMessage && <p className="text-sm text-green-600">{submitMessage}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded border border-gray-300"
          >
            入力をクリア
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded"
          >
            報告を登録する
          </button>
        </div>
      </form>
    </div>
  )
}
