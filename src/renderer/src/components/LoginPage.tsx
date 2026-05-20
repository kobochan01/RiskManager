import { useState } from 'react'

type Props = {
  hasPassword: boolean
  onAuthenticated: () => void
}

export function LoginPage({ hasPassword, onAuthenticated }: Props): JSX.Element {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (hasPassword) {
        const ok = await window.api.invoke('auth:verify', password)
        if (ok) {
          onAuthenticated()
        } else {
          setError('パスワードが違います')
          setPassword('')
        }
      } else {
        if (password.length < 4) {
          setError('パスワードは4文字以上で入力してください')
          setLoading(false)
          return
        }
        if (password !== confirm) {
          setError('確認用パスワードが一致しません')
          setLoading(false)
          return
        }
        await window.api.invoke('auth:set-password', password)
        onAuthenticated()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-80">
        <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">RiskManager</h1>
        <p className="text-sm text-gray-500 text-center mb-6">保育園向けヒヤリハット管理</p>

        <h2 className="text-base font-semibold text-gray-700 mb-4">
          {hasPassword ? 'ログイン' : 'パスワードを設定してください'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              autoFocus
            />
          </div>

          {!hasPassword && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">確認用パスワード</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '処理中...' : hasPassword ? 'ログイン' : 'パスワードを設定'}
          </button>
        </form>
      </div>
    </div>
  )
}
