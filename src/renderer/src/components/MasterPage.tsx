import { useState, useEffect } from 'react'

type MasterItem = [number, string]
type TabKey = 'classes' | 'injuryTypes' | 'locations' | 'children'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'classes',     label: 'クラス' },
  { key: 'injuryTypes', label: 'けがの種類' },
  { key: 'locations',   label: '場所' },
  { key: 'children',    label: '園児名' },
]

const IPC: Record<TabKey, { get: string; add: string; delete: string; update: string }> = {
  classes:     { get: 'db:get-classes',      add: 'db:add-class',       delete: 'db:delete-class',       update: 'db:update-class' },
  injuryTypes: { get: 'db:get-injury-types', add: 'db:add-injury-type', delete: 'db:delete-injury-type', update: 'db:update-injury-type' },
  locations:   { get: 'db:get-locations',    add: 'db:add-location',    delete: 'db:delete-location',    update: 'db:update-location' },
  children:    { get: 'db:get-children',     add: 'db:add-child',       delete: 'db:delete-child',       update: 'db:update-child' },
}

export default function MasterPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('classes')
  const [items, setItems] = useState<MasterItem[]>([])
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [editError, setEditError] = useState('')

  async function loadItems(tab: TabKey): Promise<void> {
    const data = (await window.api.invoke(IPC[tab].get)) as MasterItem[]
    setItems(data)
  }

  useEffect(() => {
    setInputValue('')
    setError('')
    setEditingId(null)
    setEditingValue('')
    setEditError('')
    loadItems(activeTab)
  }, [activeTab])

  async function handleAdd(): Promise<void> {
    const name = inputValue.trim()
    if (!name) return
    try {
      await window.api.invoke(IPC[activeTab].add, name)
      setInputValue('')
      setError('')
      await loadItems(activeTab)
    } catch {
      setError('同じ名前がすでに登録されています')
    }
  }

  async function handleDelete(id: number): Promise<void> {
    if (!window.confirm('このマスタを削除してもよいですか？')) return
    await window.api.invoke(IPC[activeTab].delete, id)
    await loadItems(activeTab)
  }

  function startEdit(id: number, name: string): void {
    setEditingId(id)
    setEditingValue(name)
    setEditError('')
  }

  function cancelEdit(): void {
    setEditingId(null)
    setEditingValue('')
    setEditError('')
  }

  async function handleUpdate(id: number): Promise<void> {
    const name = editingValue.trim()
    if (!name) return
    try {
      await window.api.invoke(IPC[activeTab].update, id, name)
      setEditingId(null)
      setEditingValue('')
      setEditError('')
      await loadItems(activeTab)
    } catch {
      setEditError('同じ名前がすでに登録されています')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">マスタ管理</h2>

      {/* タブ */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 追加フォーム */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          placeholder={`${TABS.find((t) => t.key === activeTab)?.label}名を入力`}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          追加
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {/* 一覧 */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">登録されていません</p>
      ) : (
        <ul className="space-y-2">
          {items.map(([id, name]) => (
            <li
              key={id}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded"
            >
              {editingId === id ? (
                <>
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    autoFocus
                    className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {editError && <span className="text-xs text-red-600">{editError}</span>}
                  <button
                    onClick={() => handleUpdate(id)}
                    className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800">{name}</span>
                  <button
                    onClick={() => startEdit(id, name)}
                    className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(id)}
                    className="text-xs text-gray-400 hover:text-red-600 px-2 py-1"
                  >
                    ×
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
