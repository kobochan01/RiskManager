import { useEffect, useState } from 'react'
import { LoginPage } from './components/LoginPage'
import { ChangePasswordDialog } from './components/ChangePasswordDialog'

type AuthState = 'loading' | 'locked' | 'unlocked'

function App(): JSX.Element {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [hasPassword, setHasPassword] = useState(false)
  const [showChangePw, setShowChangePw] = useState(false)

  useEffect(() => {
    window.api.invoke('auth:has-password').then((result) => {
      const has = result as boolean
      setHasPassword(has)
      setAuthState('locked')
    })
  }, [])

  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    )
  }

  if (authState === 'locked') {
    return (
      <LoginPage
        hasPassword={hasPassword}
        onAuthenticated={() => setAuthState('unlocked')}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">RiskManager</h1>
        <button
          onClick={() => setShowChangePw(true)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          パスワード変更
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">ヒヤリハット管理（実装予定）</p>
      </main>

      {showChangePw && (
        <ChangePasswordDialog onClose={() => setShowChangePw(false)} />
      )}
    </div>
  )
}

export default App
