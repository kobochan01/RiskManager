import { useState, useEffect } from 'react'

type MasterItem = [number, string]

export default function IncidentForm(): JSX.Element {
  const [locations, setLocations] = useState<MasterItem[]>([])
  const [classes, setClasses] = useState<MasterItem[]>([])
  const [injuryTypes, setInjuryTypes] = useState<MasterItem[]>([])

  const [occurredAt, setOccurredAt] = useState('')
  const [locationId, setLocationId] = useState<number>(0)
  const [classId, setClassId] = useState<number>(0)
  const [childName, setChildName] = useState('')
  const [injuryTypeId, setInjuryTypeId] = useState<number>(0)
  const [description, setDescription] = useState('')

  const [newLocation, setNewLocation] = useState('')
  const [addLocationError, setAddLocationError] = useState('')
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

  function handleClear(): void {
    setOccurredAt('')
    setLocationId(0)
    setClassId(0)
    setChildName('')
    setInjuryTypeId(0)
    setDescription('')
    setSubmitMessage('')
    setSubmitError('')
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setSubmitMessage('')
    setSubmitError('')

    if (!occurredAt || locationId === 0 || classId === 0 || !childName || injuryTypeId === 0 || !description) {
      setSubmitError('すべての項目を入力してください')
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
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
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
          {/* 新しい場所を追加 */}
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
        </div>

        {/* 園児名 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">園児名</label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
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
