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

  // Kontrol Antaramuka
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  // Negeri Borang (Form State)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Negeri Carian (Search State)
  const [searchTerm, setSearchTerm] = useState('')

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
    } catch (err: any) {
      setCustomerMessage(err.message || 'Gagal memuat pelanggan')
    } finally {
      setLoadingCustomers(false)
    }
  }

  // Menguruskan Tambah atau Kemaskini data
  async function handleSaveCustomer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setCustomerMessage('')

    const payload = {
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      whatsapp: whatsapp || null,
      company_name: companyName || null,
      notes: notes || null,
    }

    try {
      if (editMode && selectedCustomerId) {
        // Operasi KEMASKINI (UPDATE)
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', selectedCustomerId)

        if (error) throw error
      } else {
        // Operasi TAMBAH BARU (INSERT)
        const { error } = await supabase
          .from('customers')
          .insert([payload])

        if (error) throw error
      }

      resetForm()
      await fetchCustomers()
    } catch (err: any) {
      setCustomerMessage(err.message || 'Gagal menyimpan data pelanggan')
    } finally {
      setSaving(false)
    }
  }

  // Memasukkan data ke dalam borang untuk diedit
  function handleEditClick(customer: any) {
    setEditMode(true)
    setSelectedCustomerId(customer.id)
    setFullName(customer.full_name)
    setPhone(customer.phone || '')
    setEmail(customer.email || '')
    setWhatsapp(customer.whatsapp || '')
    setCompanyName(customer.company_name || '')
    setNotes(customer.notes || '')
    setShowForm(true)
  }

  // Operasi PADAM (DELETE)
  async function handleDeleteCustomer(id: string, name: string) {
    const confirmDelete = window.confirm(`Adakah anda pasti mahu memadam pelanggan "${name}"?`)
    if (!confirmDelete) return

    setCustomerMessage('')
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchCustomers()
    } catch (err: any) {
      setCustomerMessage(err.message || 'Gagal memadam pelanggan')
    }
  }

  function resetForm() {
    setFullName('')
    setPhone('')
    setEmail('')
    setWhatsapp('')
    setCompanyName('')
    setNotes('')
    setShowForm(false)
    setEditMode(false)
    setSelectedCustomerId(null)
  }

  // Fungsi Tapis data berdasarkan Input Carian
  const filteredCustomers = customers.filter((c) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      c.full_name?.toLowerCase().includes(searchLower) ||
      c.phone?.includes(searchTerm) ||
      c.company_name?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="bg-white p-6 rounded shadow">
      {/* Bahagian Atas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Senarai Pelanggan</h2>
          <p className="text-sm text-gray-500">Urus profil dan maklumat perhubungan pelanggan anda.</p>
        </div>
        <button
          onClick={() => {
            if (showForm) resetForm()
            else setShowForm(true)
          }}
          className={`${showForm ? 'bg-gray-500' : 'bg-blue-600'} text-white px-4 py-2 rounded font-medium transition-colors`}
        >
          {showForm ? 'Tutup Borang' : '+ Tambah Pelanggan'}
        </button>
      </div>

      {/* Borang Input (Tambah / Edit) */}
      {showForm && (
        <form onSubmit={handleSaveCustomer} className="mb-6 bg-gray-50 p-5 rounded border border-gray-200 space-y-4 shadow-sm">
          <h3 className="font-bold text-lg text-gray-700">
            {editMode ? 'Kemaskini Maklumat Pelanggan' : 'Tambah Pelanggan Baru'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Penuh *</label>
              <input
                type="text"
                placeholder="cth: Ahmad Fauzi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Syarikat (Opsional)</label>
              <input
                type="text"
                placeholder="cth: HB Curtain Sdn Bhd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">No. Telefon</label>
              <input
                type="text"
                placeholder="cth: 0123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp</label>
              <input
                type="text"
                placeholder="cth: 0123456789"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Emel</label>
              <input
                type="email"
                placeholder="cth: ahmad@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nota / Alamat Kediaman</label>
            <textarea
              placeholder="Masukkan nota tambahan atau butiran alamat ukuran di sini..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 justify-end">
            {editMode && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded transition-colors"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? 'Menyimpan...' : editMode ? 'Kemaskini Pelanggan' : 'Simpan Pelanggan'}
            </button>
          </div>
        </form>
      )}

      {/* Bar Carian */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔎 Cari nama, nombor telefon atau syarikat pelanggan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {customerMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
          <p className="text-red-700 text-sm font-medium">{customerMessage}</p>
        </div>
      )}

      {/* Jadual / Senarai Pelanggan */}
      {loadingCustomers ? (
        <p className="text-gray-500 text-center py-4">Memuatkan data pelanggan...</p>
            ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg bg-gray-50">
          <p className="text-gray-500">
            {searchTerm ? 'Tiada padanan carian dijumpai.' : 'Tiada rekod pelanggan disimpan lagi.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          {/* Jadual pelanggan diletakkan di sini */}
        </div>
      )}
    </div>
  )
}

export default CustomersPage

