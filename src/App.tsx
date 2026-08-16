import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
  const [session, setSession] = useState(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activePage, setActivePage] = useState<'dashboard' | 'customers'>('dashboard')

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
    setActivePage('dashboard')
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-blue-800 text-white p-4">
          <div className="flex justify-between items-center max-w-5xl mx-auto">
            <h1 className="text-xl font-bold">HBCurtain ERP</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm">{session.user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
              >
                Logout
              </button>
            </div>
          </div>
          {/* Menu */}
          <nav className="flex gap-4 max-w-5xl mx-auto mt-3">
            <button
              onClick={() => setActivePage('dashboard')}
              className={`px-3 py-1 rounded ${
                activePage === 'dashboard' ? 'bg-white text-blue-800' : 'text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActivePage('customers')}
              className={`px-3 py-1 rounded ${
                activePage === 'customers' ? 'bg-white text-blue-800' : 'text-white'
              }`}
            >
              Pelanggan
            </button>
          </nav>
        </header>

        {/* Kandungan */}
        <main className="max-w-5xl mx-auto p-4">
          {activePage === 'dashboard' && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
              <p>Selamat datang ke HBCurtain ERP.</p>
              <p className="mt-2 text-gray-600">
                Pilih menu di atas untuk mula mengurus pelanggan.
              </p>
            </div>
          )}

          {activePage === 'customers' && <CustomersPage />}
        </main>
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

function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [customerMessage, setCustomerMessage] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoadingCustomers(true)
    setCustomerMessage('')
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (err) {
      setCustomerMessage(err.message || 'Gagal memuat pelanggan')
    } finally {
      setLoadingCustomers(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Senarai Pelanggan</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">+ Tambah</button>
      </div>

      {customerMessage && <p className="text-red-500 mb-2">{customerMessage}</p>}

      {loadingCustomers ? (
        <p>Memuatkan data...</p>
      ) : customers.length === 0 ? (
        <p>Tiada pelanggan lagi. Klik "+ Tambah" untuk menambah.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Nama</th>
              <th className="text-left p-2 border">Telefon</th>
              <th className="text-left p-2 border">Email</th>
              <th className="text-left p-2 border">WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="p-2 border">{c.full_name}</td>
                <td className="p-2 border">{c.phone || '-'}</td>
                <td className="p-2 border">{c.email || '-'}</td>
                <td className="p-2 border">{c.whatsapp || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default App