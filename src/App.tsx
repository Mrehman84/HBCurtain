import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
  const [session, setSession] = useState(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleAuth() {
    setLoading(true)
    setMessage('')
    try {
      if (authMode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Pendaftaran berjaya! Sekarang anda boleh login.')
        setAuthMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setMessage(err.message || 'Ralat berlaku')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded shadow w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">HBCurtain</h1>
          <p>Selamat datang, <strong>{session.user.email}</strong></p>
          <button
            onClick={handleLogout}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded w-full"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">HBCurtain ERP</h1>
        <h2 className="text-lg mb-4">{authMode === 'login' ? 'Log Masuk' : 'Daftar Akaun'}</h2>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="password"
            placeholder="Kata Laluan"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {message && <p className="text-red-500 mt-2">{message}</p>}

        <button
          onClick={handleAuth}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? 'Sila tunggu...' : authMode === 'login' ? 'Log Masuk' : 'Daftar'}
        </button>

        <button
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          className="mt-2 text-blue-600 underline w-full text-center"
        >
          {authMode === 'login' ? 'Belum ada akaun? Daftar' : 'Sudah ada akaun? Log Masuk'}
        </button>
      </div>
    </div>
  )
}

export default App