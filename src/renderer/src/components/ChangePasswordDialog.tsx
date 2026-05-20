import { useState } from 'react'

type Props = {
  onClose: () => void
}

export function ChangePasswordDialog({ onClose }: Props): JSX.Element {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const ok = await window.api.invoke('auth:verify', currentPw)
      if (!ok) {
        setError('現在のパスワードが違います')
        setCurrentPw('')
        return
      }
      if (newPw.length < 4) {
        setError('新しいパスワードは4文字以上で入力してください')
        return
      }
      if (newPw !== confirmPw) {
        setError('確認用パスワードが一致しません')
        return
      }
      await window.api.invoke('auth:set-password', newPw)
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-base font-semibold text-gray-800 mb-4">パスワード変更</h2>

        {success ? (
          <div>
            <p className="text-sm text-green-600 mb-4">パスワードを変更しました。</p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700"
            >
              閉じる
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">現在のパスワード</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">新しいパスワード</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">確認用パスワード</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '処理中...' : '変更'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
