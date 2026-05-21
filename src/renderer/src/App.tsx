import { useEffect, useState } from 'react'
import { LoginPage } from './components/LoginPage'
import { ChangePasswordDialog } from './components/ChangePasswordDialog'
import IncidentForm from './components/IncidentForm'
import IncidentList from './components/IncidentList'
import MasterPage from './components/MasterPage'
import DashboardPage from './components/DashboardPage'

type AuthState = 'loading' | 'locked' | 'unlocked'
type MainTab = 'form' | 'list' | 'master' | 'dashboard'

function App(): JSX.Element {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [hasPassword, setHasPassword] = useState(false)
  const [showChangePw, setShowChangePw] = useState(false)
  const [mainTab, setMainTab] = useState<MainTab>('form')

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
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between print:hidden">
        <h1 className="text-lg font-bold text-gray-800">RiskManager</h1>
        <button
          onClick={() => setShowChangePw(true)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          パスワード変更
        </button>
      </header>

      {/* メインタブ */}
      <div className="bg-white border-b border-gray-200 px-6 print:hidden">
        <div className="flex gap-1">
          {([['form', '報告入力'], ['list', '報告一覧'], ['master', 'マスタ管理'], ['dashboard', 'ダッシュボード']] as [MainTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMainTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                mainTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        {mainTab === 'form' ? <IncidentForm /> : mainTab === 'list' ? <IncidentList /> : mainTab === 'master' ? <MasterPage /> : <DashboardPage />}
      </main>

      {showChangePw && (
        <ChangePasswordDialog onClose={() => setShowChangePw(false)} />
      )}
    </div>
  )
}

export default App
