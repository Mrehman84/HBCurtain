import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from './lib/supabaseClient'
import { calculateFabric } from './lib/curtainCalculator'
type Page = 'dashboard' | 'customers' | 'projects' | 'quotations' 
| 'salesorders' | 'invoices' | 'payments' | 'reports' 
| 'suppliers' | 'expenses' | 'inventory' | 'workshop' 
| 'installations' | 'backup' | 'analytics' | 'calculator'
type AuthMode = 'login' | 'register'

function exportCSV(filename: string, rows: any[]) {
  if (rows.length === 0) {
    alert('Tiada data untuk dieksport.')
    return
  }
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const value = row[h] ?? ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function exportJSON(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
pdfMake.vfs = pdfFonts.vfs

function sendWhatsApp(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  if (!cleanPhone) {
    alert('Nombor telefon pelanggan tiada.')
    return
  }
  const url = `https://wa.me/60${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

function generatePDF(title: string, content: any[]) {
  const docDefinition: any = {
    content: [
      { text: 'HBCurtain ERP', style: 'header' },
      { text: title, style: 'subheader' },
      { text: new Date().toLocaleDateString(), margin: [0, 5, 0, 10] },
      ...content,
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
    },
  }
  pdfMake.createPdf(docDefinition).download(title + '.pdf')
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [portalToken, setPortalToken] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
useEffect(() => {
  const hash = window.location.hash
  if (hash.startsWith('#portal?token=')) {
    setPortalToken(hash.replace('#portal?token=', ''))
  }
}, [])

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
    } catch (err: any) {
      setMessage(err.message || 'Ralat berlaku')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setActivePage('dashboard')
  }

  if (portalToken) {
  return <PortalPage token={portalToken} onClose={() => {
    setPortalToken(null)
    window.location.hash = ''
  }} />
}

  if (session) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-800 text-white p-4">
          <div className="flex justify-between items-center max-w-5xl mx-auto">
            <h1 className="text-xl font-bold">HBCurtain ERP</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm">{session.user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
              >
                Logout
              </button>
            </div>
          </div>
          <nav className="flex gap-2 sm:gap-4 max-w-5xl mx-auto mt-3 overflow-x-auto">
            <button
              onClick={() => setActivePage('dashboard')}
              className={`px-3 py-1 rounded whitespace-nowrap ${
                activePage === 'dashboard' ? 'bg-white text-blue-800' : 'text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActivePage('customers')}
              className={`px-3 py-1 rounded whitespace-nowrap ${
                activePage === 'customers' ? 'bg-white text-blue-800' : 'text-white'
              }`}
            >
              Pelanggan
            </button>
            <button
              onClick={() => setActivePage('projects')}
              className={`px-3 py-1 rounded whitespace-nowrap ${
                activePage === 'projects' ? 'bg-white text-blue-800' : 'text-white'
              }`}
            >
              Projek
            </button>
            <button
              onClick={() => setActivePage('quotations')}
              className={`px-3 py-1 rounded whitespace-nowrap ${
                activePage === 'quotations' ? 'bg-white text-blue-800' : 'text-white'
              }`}
            >
              Quotation
            </button>
            <button
            onClick={() => setActivePage('salesorders')}
            className={`px-3 py-1 rounded whitespace-nowrap ${
              activePage === 'salesorders' ? 'bg-white text-blue-800' : 'text-white'
            }`}
          >
            Sales Order
          </button>
            <button
              onClick={() => setActivePage('calculator')}
              className={`px-3 py-1 rounded whitespace-nowrap ${
                activePage === 'calculator' ? 'bg-white text-blue-800' : 'text-white'
              }`}
              
            >
              Kalkulator Kain
            </button>
            <button
          onClick={() => setActivePage('invoices')}
          className={`px-3 py-1 rounded whitespace-nowrap ${
            activePage === 'invoices' ? 'bg-white text-blue-800' : 'text-white'
          }`}
        >
          Invoice
          
        </button>
        <button
  onClick={() => setActivePage('payments')}
  className={`px-3 py-1 rounded whitespace-nowrap ${
    activePage === 'payments' ? 'bg-white text-blue-800' : 'text-white'
  }`}
>
  Bayaran
      </button>
      <button
        onClick={() => setActivePage('reports')}
        className={`px-3 py-1 rounded whitespace-nowrap ${
          activePage === 'reports' ? 'bg-white text-blue-800' : 'text-white'
        }`}
      >
        Laporan
            </button>
            <button
        onClick={() => setActivePage('suppliers')}
        className={`px-3 py-1 rounded whitespace-nowrap ${
          activePage === 'suppliers' ? 'bg-white text-blue-800' : 'text-white'
        }`}
      >
        Supplier
      </button>
      <button
        onClick={() => setActivePage('expenses')}
        className={`px-3 py-1 rounded whitespace-nowrap ${
          activePage === 'expenses' ? 'bg-white text-blue-800' : 'text-white'
        }`}
      >
        Expense
      </button>
      <button
        onClick={() => setActivePage('inventory')}
        className={`px-3 py-1 rounded whitespace-nowrap ${
          activePage === 'inventory' ? 'bg-white text-blue-800' : 'text-white'
        }`}
      >
        Inventory
      </button>
      <button
        onClick={() => setActivePage('workshop')}
        className={`px-3 py-1 rounded whitespace-nowrap ${
          activePage === 'workshop' ? 'bg-white text-blue-800' : 'text-white'
        }`}
      >
        Workshop
      </button>
      <button
        onClick={() => setActivePage('installations')}
        className={`px-3 py-1 rounded whitespace-nowrap ${
          activePage === 'installations' ? 'bg-white text-blue-800' : 'text-white'
        }`}
      >
        Pemasangan
      </button>
      <button
  onClick={() => setActivePage('backup')}
  className={`px-3 py-1 rounded whitespace-nowrap ${
    activePage === 'backup' ? 'bg-white text-blue-800' : 'text-white'
  }`}
>
  Backup
</button>
<button
  onClick={() => setActivePage('analytics')}
  className={`px-3 py-1 rounded whitespace-nowrap ${
    activePage === 'analytics' ? 'bg-white text-blue-800' : 'text-white'
  }`}
>
  Analisis
</button>
          </nav>
        </header>

        <main className="max-w-5xl mx-auto p-4">
          {activePage === 'dashboard' && <DashboardPage />}
          {activePage === 'customers' && <CustomersPage />}
          {activePage === 'projects' && <ProjectsPage />}
          {activePage === 'quotations' && <QuotationPage />}
          {activePage === 'calculator' && <CalculatorPage />}
          {activePage === 'salesorders' && <SalesOrderPage />}
          {activePage === 'invoices' && <InvoicePage />}
          {activePage === 'payments' && <PaymentPage />}
          {activePage === 'reports' && <ReportsPage />}
          {activePage === 'suppliers' && <SuppliersPage />}
          {activePage === 'expenses' && <ExpensesPage />}
          {activePage === 'inventory' && <InventoryPage />}
          {activePage === 'workshop' && <WorkshopPage />}
          {activePage === 'installations' && <InstallationPage />}
          {activePage === 'backup' && <BackupPage />}
          {activePage === 'analytics' && <AnalyticsPage />}

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
            className="w-full border rounded px-3 py-2 text-base"
          />
          <input
            type="password"
            placeholder="Kata Laluan"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
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
  const [search, setSearch] = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [customerMessage, setCustomerMessage] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

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

  function resetForm() {
    setEditingId(null)
    setFullName('')
    setPhone('')
    setAddress('')
    setCompanyName('')
    setNotes('')
  }

  function handleEdit(c: any) {
    setEditingId(c.id)
    setFullName(c.full_name || '')
    setPhone(c.phone || '')
    setAddress(c.address || '')
    setCompanyName(c.company_name || '')
    setNotes(c.notes || '')
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    resetForm()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setCustomerMessage('')

    if (!fullName.trim()) {
      setCustomerMessage('Nama penuh wajib diisi.')
      setSaving(false)
      return
    }

    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        company_name: companyName.trim() || null,
        notes: notes.trim() || null,
      }

      let error: any = null
      if (editingId) {
        const res = await supabase.from('customers').update(payload).eq('id', editingId)
        error = res.error
      } else {
        const res = await supabase.from('customers').insert([payload])
        error = res.error
      }

      if (error) throw error

      setShowForm(false)
      resetForm()
      await fetchCustomers()
    } catch (err: any) {
      setCustomerMessage(err.message || 'Gagal menyimpan pelanggan')
    } finally {
      setSaving(false)
    }
  }


  async function handleDelete(id: string) {
    if (!window.confirm('Padam pelanggan ini?')) return
    setCustomerMessage('')
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
      await fetchCustomers()
    } catch (err: any) {
      setCustomerMessage(err.message || 'Gagal padam pelanggan')
    }
  }
async function generatePortalToken(customer: any) {
  let token = customer.portal_token
  if (!token) {
    token = crypto.randomUUID()
    const { error } = await supabase
      .from('customers')
      .update({ portal_token: token })
      .eq('id', customer.id)
    if (error) {
      setCustomerMessage(error.message)
      return
    }
  }
  const link = `${window.location.origin}${window.location.pathname}#portal?token=${token}`
  try {
    await navigator.clipboard.writeText(link)
    alert(`Link portal disalin!\n\n${link}`)
  } catch {
    prompt('Salin link portal:', link)
  }
  await fetchCustomers()
}
  const filteredCustomers = customers.filter((c) =>
    `${c.full_name} ${c.phone || ''} ${c.address || ''} ${c.company_name || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold">Senarai Pelanggan</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Cari nama, telefon, alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 text-base w-full md:w-64"
          />
          <button
            onClick={() => {
              resetForm()
              setShowForm(!showForm)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded whitespace-nowrap"
          >
            {showForm ? 'Tutup Borang' : '+ Tambah'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded border space-y-3">
          <h3 className="font-bold">{editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
          <input
            type="text"
            placeholder="Nama Penuh *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-base"
          />
          <input
            type="text"
            placeholder="Telefon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          />
          <textarea
            placeholder="Alamat"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          />
          <input
            type="text"
            placeholder="Nama Syarikat"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          />
          <textarea
            placeholder="Nota"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Pelanggan'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {customerMessage && <p className="text-red-500 mb-2">{customerMessage}</p>}

      {loadingCustomers ? (
        <p>Memuatkan data...</p>
      ) : filteredCustomers.length === 0 ? (
        <p>Tiada pelanggan. Klik "+ Tambah" untuk menambah.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">Nama</th>
                <th className="text-left p-2 border">Telefon</th>
                <th className="text-left p-2 border">Alamat</th>
                <th className="text-left p-2 border">Syarikat</th>
                <th className="text-left p-2 border">Portal</th>
                <th className="text-left p-2 border">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td className="p-2 border">{c.full_name}</td>
                  <td className="p-2 border">{c.phone || '-'}</td>
                  <td className="p-2 border">{c.address || '-'}</td>
                  <td className="p-2 border">{c.company_name || '-'}</td>
                  <td className="p-2 border whitespace-nowrap">
                    <button
                      onClick={() => generatePortalToken(c)}
                      className="text-green-600 underline mr-3"
                    >
                      Buat Portal
                    </button>
                  </td>
                  <td className="p-2 border whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-blue-600 underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 underline"
                    >
                      Padam
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ProjectsPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
  const [selectedWindow, setSelectedWindow] = useState<any | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Form state
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [projectStatus, setProjectStatus] = useState('active')
  const [projectDescription, setProjectDescription] = useState('')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)

  const [showRoomForm, setShowRoomForm] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomNotes, setRoomNotes] = useState('')
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)

  const [showWindowForm, setShowWindowForm] = useState(false)
  const [windowName, setWindowName] = useState('')
  const [windowType, setWindowType] = useState('')
  const [windowNotes, setWindowNotes] = useState('')
  const [editingWindowId, setEditingWindowId] = useState<string | null>(null)

  const [showMeasurementForm, setShowMeasurementForm] = useState(false)
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [dropCm, setDropCm] = useState('')
  const [fullnessRatio, setFullnessRatio] = useState('')
  const [fabricWidthCm, setFabricWidthCm] = useState('')
  const [patternRepeatCm, setPatternRepeatCm] = useState('')
  const [measurementNotes, setMeasurementNotes] = useState('')
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null)

  const [rooms, setRooms] = useState<any[]>([])
  const [windows, setWindows] = useState<any[]>([])
  const [measurements, setMeasurements] = useState<any[]>([])

  useEffect(() => {
    fetchCustomers()
    fetchProjects()
  }, [])

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('id, full_name').order('full_name')
    setCustomers(data || [])
  }

  async function fetchProjects() {
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, customers(full_name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProjects(data || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal memuat projek')
    } finally {
      setLoading(false)
    }
  }

  async function fetchRooms(projectId: string) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    if (error) {
      setMessage(error.message)
      return
    }
    setRooms(data || [])
  }

  async function fetchWindows(roomId: string) {
    const { data, error } = await supabase
      .from('windows')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    if (error) {
      setMessage(error.message)
      return
    }
    setWindows(data || [])
  }

  async function fetchMeasurements(windowId: string) {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('window_id', windowId)
      .order('created_at', { ascending: true })
    if (error) {
      setMessage(error.message)
      return
    }
    setMeasurements(data || [])
  }

  function resetProjectForm() {
    setEditingProjectId(null)
    setProjectName('')
    setCustomerId('')
    setSiteAddress('')
    setProjectStatus('active')
    setProjectDescription('')
  }

  function handleEditProject(p: any) {
    setEditingProjectId(p.id)
    setProjectName(p.project_name || '')
    setCustomerId(p.customer_id || '')
    setSiteAddress(p.site_address || '')
    setProjectStatus(p.status || 'active')
    setProjectDescription(p.description || '')
    setShowProjectForm(true)
  }

  async function handleProjectSubmit(e: FormEvent) {
    e.preventDefault()
    if (!projectName.trim() || !customerId) {
      setMessage('Nama projek dan pelanggan wajib diisi.')
      return
    }
    try {
      const payload = {
        project_name: projectName.trim(),
        customer_id: customerId,
        site_address: siteAddress.trim() || null,
        status: projectStatus,
        description: projectDescription.trim() || null,
      }
      let error: any = null
      if (editingProjectId) {
        const res = await supabase.from('projects').update(payload).eq('id', editingProjectId)
        error = res.error
      } else {
        const res = await supabase.from('projects').insert([payload])
        error = res.error
      }
      if (error) throw error
      setShowProjectForm(false)
      resetProjectForm()
      await fetchProjects()
      setMessage('Projek disimpan.')
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan projek')
    }
  }

  async function handleDeleteProject(id: string) {
    if (!window.confirm('Padam projek ini?')) return
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      if (selectedProject?.id === id) {
        setSelectedProject(null)
        setSelectedRoom(null)
        setSelectedWindow(null)
      }
      await fetchProjects()
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam projek')
    }
  }

  function resetRoomForm() {
    setEditingRoomId(null)
    setRoomName('')
    setRoomNotes('')
  }

  function handleEditRoom(r: any) {
    setEditingRoomId(r.id)
    setRoomName(r.room_name || '')
    setRoomNotes(r.notes || '')
    setShowRoomForm(true)
  }

  async function handleRoomSubmit(e: FormEvent) {
    e.preventDefault()
    if (!roomName.trim() || !selectedProject) return
    try {
      const payload = {
        room_name: roomName.trim(),
        project_id: selectedProject.id,
        notes: roomNotes.trim() || null,
      }
      let error: any = null
      if (editingRoomId) {
        const res = await supabase.from('rooms').update(payload).eq('id', editingRoomId)
        error = res.error
      } else {
        const res = await supabase.from('rooms').insert([payload])
        error = res.error
      }
      if (error) throw error
      setShowRoomForm(false)
      resetRoomForm()
      await fetchRooms(selectedProject.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan bilik')
    }
  }

  async function handleDeleteRoom(id: string) {
    if (!window.confirm('Padam bilik ini?')) return
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', id)
      if (error) throw error
      if (selectedRoom?.id === id) {
        setSelectedRoom(null)
        setSelectedWindow(null)
      }
      await fetchRooms(selectedProject!.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam bilik')
    }
  }

  function resetWindowForm() {
    setEditingWindowId(null)
    setWindowName('')
    setWindowType('')
    setWindowNotes('')
  }

  function handleEditWindow(w: any) {
    setEditingWindowId(w.id)
    setWindowName(w.window_name || '')
    setWindowType(w.window_type || '')
    setWindowNotes(w.notes || '')
    setShowWindowForm(true)
  }

  async function handleWindowSubmit(e: FormEvent) {
    e.preventDefault()
    if (!windowName.trim() || !selectedRoom) return
    try {
      const payload = {
        window_name: windowName.trim(),
        room_id: selectedRoom.id,
        window_type: windowType.trim() || null,
        notes: windowNotes.trim() || null,
      }
      let error: any = null
      if (editingWindowId) {
        const res = await supabase.from('windows').update(payload).eq('id', editingWindowId)
        error = res.error
      } else {
        const res = await supabase.from('windows').insert([payload])
        error = res.error
      }
      if (error) throw error
      setShowWindowForm(false)
      resetWindowForm()
      await fetchWindows(selectedRoom.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan tingkap')
    }
  }

  async function handleDeleteWindow(id: string) {
    if (!window.confirm('Padam tingkap ini?')) return
    try {
      const { error } = await supabase.from('windows').delete().eq('id', id)
      if (error) throw error
      if (selectedWindow?.id === id) setSelectedWindow(null)
      await fetchWindows(selectedRoom!.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam tingkap')
    }
  }

  function resetMeasurementForm() {
    setEditingMeasurementId(null)
    setWidthCm('')
    setHeightCm('')
    setDropCm('')
    setFullnessRatio('')
    setFabricWidthCm('')
    setPatternRepeatCm('')
    setMeasurementNotes('')
  }

  function handleEditMeasurement(m: any) {
    setEditingMeasurementId(m.id)
    setWidthCm(m.width_cm?.toString() || '')
    setHeightCm(m.height_cm?.toString() || '')
    setDropCm(m.drop_cm?.toString() || '')
    setFullnessRatio(m.fullness_ratio?.toString() || '')
    setFabricWidthCm(m.fabric_width_cm?.toString() || '')
    setPatternRepeatCm(m.pattern_repeat_cm?.toString() || '')
    setMeasurementNotes(m.notes || '')
    setShowMeasurementForm(true)
  }

  async function handleMeasurementSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedWindow) return
    try {
      const payload = {
        window_id: selectedWindow.id,
        width_cm: widthCm ? Number(widthCm) : null,
        height_cm: heightCm ? Number(heightCm) : null,
        drop_cm: dropCm ? Number(dropCm) : null,
        fullness_ratio: fullnessRatio ? Number(fullnessRatio) : null,
        fabric_width_cm: fabricWidthCm ? Number(fabricWidthCm) : null,
        pattern_repeat_cm: patternRepeatCm ? Number(patternRepeatCm) : null,
        notes: measurementNotes.trim() || null,
      }
      let error: any = null
      if (editingMeasurementId) {
        const res = await supabase.from('measurements').update(payload).eq('id', editingMeasurementId)
        error = res.error
      } else {
        const res = await supabase.from('measurements').insert([payload])
        error = res.error
      }
      if (error) throw error
      setShowMeasurementForm(false)
      resetMeasurementForm()
      await fetchMeasurements(selectedWindow.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan ukuran')
    }
  }

  async function handleDeleteMeasurement(id: string) {
    if (!window.confirm('Padam ukuran ini?')) return
    try {
      const { error } = await supabase.from('measurements').delete().eq('id', id)
      if (error) throw error
      await fetchMeasurements(selectedWindow!.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam ukuran')
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projek</h2>
        <button
          onClick={() => {
            resetProjectForm()
            setShowProjectForm(!showProjectForm)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showProjectForm ? 'Tutup Borang' : '+ Tambah Projek'}
        </button>
      </div>

      {showProjectForm && (
        <form onSubmit={handleProjectSubmit} className="bg-gray-50 p-4 rounded border space-y-3">
          <h3 className="font-bold">{editingProjectId ? 'Edit Projek' : 'Tambah Projek Baru'}</h3>
          <input
            type="text"
            placeholder="Nama Projek *"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-base"
          />
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="">Pilih Pelanggan *</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Alamat Tapak"
            value={siteAddress}
            onChange={(e) => setSiteAddress(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          />
          <select
            value={projectStatus}
            onChange={(e) => setProjectStatus(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="active">Aktif</option>
            <option value="pending">Tertunda</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Batal</option>
          </select>
          <textarea
            placeholder="Penerangan"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            {editingProjectId ? 'Simpan Perubahan' : 'Simpan Projek'}
          </button>
        </form>
      )}

      {message && <p className="text-red-500">{message}</p>}

      {loading ? (
        <p>Memuatkan projek...</p>
      ) : projects.length === 0 ? (
        <p>Tiada projek. Klik "+ Tambah Projek".</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Nama Projek</th>
              <th className="text-left p-2 border">Pelanggan</th>
              <th className="text-left p-2 border">Status</th>
              <th className="text-left p-2 border">Alamat</th>
              <th className="text-left p-2 border">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="p-2 border font-medium">{p.project_name}</td>
                <td className="p-2 border">{p.customers?.full_name || '-'}</td>
                <td className="p-2 border">{p.status}</td>
                <td className="p-2 border">{p.site_address || '-'}</td>
                <td className="p-2 border whitespace-nowrap">
                  <button
                    onClick={() => {
                      setSelectedProject(p)
                      setSelectedRoom(null)
                      setSelectedWindow(null)
                      fetchRooms(p.id)
                    }}
                    className="text-blue-600 underline mr-3"
                  >
                    Pilih
                  </button>
                  <button onClick={() => handleEditProject(p)} className="text-green-600 underline mr-3">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteProject(p.id)} className="text-red-600 underline">
                    Padam
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Bilik */}
      {selectedProject && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Bilik untuk: {selectedProject.project_name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetRoomForm()
                  setShowRoomForm(!showRoomForm)
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                {showRoomForm ? 'Tutup' : '+ Tambah Bilik'}
              </button>
              <button
                onClick={() => {
                  setSelectedProject(null)
                  setSelectedRoom(null)
                  setSelectedWindow(null)
                }}
                className="bg-gray-500 text-white px-3 py-1 rounded"
              >
                Tutup Projek
              </button>
            </div>
          </div>

          {showRoomForm && (
            <form onSubmit={handleRoomSubmit} className="bg-gray-50 p-4 rounded border mt-3 space-y-3">
              <h4 className="font-bold">{editingRoomId ? 'Edit Bilik' : 'Tambah Bilik'}</h4>
              <input
                type="text"
                placeholder="Nama Bilik *"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
                className="w-full border rounded px-3 py-2 text-base"
              />
              <textarea
                placeholder="Nota"
                value={roomNotes}
                onChange={(e) => setRoomNotes(e.target.value)}
                className="w-full border rounded px-3 py-2 text-base"
              />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                {editingRoomId ? 'Simpan Perubahan' : 'Simpan Bilik'}
              </button>
            </form>
          )}

          {rooms.length === 0 ? (
            <p className="mt-3 text-gray-600">Tiada bilik. Tambah bilik untuk projek ini.</p>
          ) : (
            <table className="w-full border-collapse mt-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">Nama Bilik</th>
                  <th className="text-left p-2 border">Nota</th>
                  <th className="text-left p-2 border">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id}>
                    <td className="p-2 border font-medium">{r.room_name}</td>
                    <td className="p-2 border">{r.notes || '-'}</td>
                    <td className="p-2 border whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedRoom(r)
                          setSelectedWindow(null)
                          fetchWindows(r.id)
                        }}
                        className="text-blue-600 underline mr-3"
                      >
                        Pilih
                      </button>
                      <button onClick={() => handleEditRoom(r)} className="text-green-600 underline mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteRoom(r.id)} className="text-red-600 underline">
                        Padam
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tingkap */}
      {selectedRoom && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Tingkap untuk: {selectedRoom.room_name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetWindowForm()
                  setShowWindowForm(!showWindowForm)
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                {showWindowForm ? 'Tutup' : '+ Tambah Tingkap'}
              </button>
              <button
                onClick={() => {
                  setSelectedRoom(null)
                  setSelectedWindow(null)
                }}
                className="bg-gray-500 text-white px-3 py-1 rounded"
              >
                Tutup Bilik
              </button>
            </div>
          </div>

          {showWindowForm && (
            <form onSubmit={handleWindowSubmit} className="bg-gray-50 p-4 rounded border mt-3 space-y-3">
              <h4 className="font-bold">{editingWindowId ? 'Edit Tingkap' : 'Tambah Tingkap'}</h4>
              <input
                type="text"
                placeholder="Nama Tingkap *"
                value={windowName}
                onChange={(e) => setWindowName(e.target.value)}
                required
                className="w-full border rounded px-3 py-2 text-base"
              />
              <input
                type="text"
                placeholder="Jenis Tingkap (cth: Panel, Eyelet)"
                value={windowType}
                onChange={(e) => setWindowType(e.target.value)}
                className="w-full border rounded px-3 py-2 text-base"
              />
              <textarea
                placeholder="Nota"
                value={windowNotes}
                onChange={(e) => setWindowNotes(e.target.value)}
                className="w-full border rounded px-3 py-2 text-base"
              />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                {editingWindowId ? 'Simpan Perubahan' : 'Simpan Tingkap'}
              </button>
            </form>
          )}

          {windows.length === 0 ? (
            <p className="mt-3 text-gray-600">Tiada tingkap. Tambah tingkap untuk bilik ini.</p>
          ) : (
            <table className="w-full border-collapse mt-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">Nama Tingkap</th>
                  <th className="text-left p-2 border">Jenis</th>
                  <th className="text-left p-2 border">Nota</th>
                  <th className="text-left p-2 border">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {windows.map((w) => (
                  <tr key={w.id}>
                    <td className="p-2 border font-medium">{w.window_name}</td>
                    <td className="p-2 border">{w.window_type || '-'}</td>
                    <td className="p-2 border">{w.notes || '-'}</td>
                    <td className="p-2 border whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedWindow(w)
                          fetchMeasurements(w.id)
                        }}
                        className="text-blue-600 underline mr-3"
                      >
                        Pilih
                      </button>
                      <button onClick={() => handleEditWindow(w)} className="text-green-600 underline mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteWindow(w.id)} className="text-red-600 underline">
                        Padam
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Ukuran */}
      {selectedWindow && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Ukuran untuk: {selectedWindow.window_name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetMeasurementForm()
                  setShowMeasurementForm(!showMeasurementForm)
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                {showMeasurementForm ? 'Tutup' : '+ Tambah Ukuran'}
              </button>
              <button
                onClick={() => setSelectedWindow(null)}
                className="bg-gray-500 text-white px-3 py-1 rounded"
              >
                Tutup Tingkap
              </button>
            </div>
          </div>

          {showMeasurementForm && (
            <form onSubmit={handleMeasurementSubmit} className="bg-gray-50 p-4 rounded border mt-3 space-y-3">
              <h4 className="font-bold">{editingMeasurementId ? 'Edit Ukuran' : 'Tambah Ukuran'}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Lebar (cm)"
                  value={widthCm}
                  onChange={(e) => setWidthCm(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Tinggi (cm)"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Drop (cm)"
                  value={dropCm}
                  onChange={(e) => setDropCm(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Fullness Ratio"
                  value={fullnessRatio}
                  onChange={(e) => setFullnessRatio(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Lebar Kain (cm)"
                  value={fabricWidthCm}
                  onChange={(e) => setFabricWidthCm(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Pattern Repeat (cm)"
                  value={patternRepeatCm}
                  onChange={(e) => setPatternRepeatCm(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
              </div>
              <textarea
                placeholder="Nota"
                value={measurementNotes}
                onChange={(e) => setMeasurementNotes(e.target.value)}
                className="w-full border rounded px-3 py-2 text-base"
              />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                {editingMeasurementId ? 'Simpan Perubahan' : 'Simpan Ukuran'}
              </button>
            </form>
          )}

          {measurements.length === 0 ? (
            <p className="mt-3 text-gray-600">Tiada ukuran. Tambah ukuran untuk tingkap ini.</p>
          ) : (
            <table className="w-full border-collapse mt-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">Lebar</th>
                  <th className="text-left p-2 border">Tinggi</th>
                  <th className="text-left p-2 border">Drop</th>
                  <th className="text-left p-2 border">Fullness</th>
                  <th className="text-left p-2 border">Lebar Kain</th>
                  <th className="text-left p-2 border">Pattern</th>
                  <th className="text-left p-2 border">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((m) => (
                  <tr key={m.id}>
                    <td className="p-2 border">{m.width_cm ?? '-'}</td>
                    <td className="p-2 border">{m.height_cm ?? '-'}</td>
                    <td className="p-2 border">{m.drop_cm ?? '-'}</td>
                    <td className="p-2 border">{m.fullness_ratio ?? '-'}</td>
                    <td className="p-2 border">{m.fabric_width_cm ?? '-'}</td>
                    <td className="p-2 border">{m.pattern_repeat_cm ?? '-'}</td>
                    <td className="p-2 border whitespace-nowrap">
                      <button onClick={() => handleEditMeasurement(m)} className="text-green-600 underline mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteMeasurement(m.id)} className="text-red-600 underline">
                        Padam
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function QuotationPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Quotation form
  const [showQuotationForm, setShowQuotationForm] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [status, setStatus] = useState('draft')
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null)

  // Item form
  const [showItemForm, setShowItemForm] = useState(false)
  const [itemDescription, setItemDescription] = useState('')
  const [itemQuantity, setItemQuantity] = useState('1')
  const [itemUnit, setItemUnit] = useState('unit')
  const [itemUnitPrice, setItemUnitPrice] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
    fetchQuotations()
  }, [])

    async function fetchCustomers() {
    setLoadingCustomers(true)
    setCustomerMessage('')
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('full_name', { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (err: any) {
      setCustomerMessage(err.message || 'Gagal memuat pelanggan')
    } finally {
      setLoadingCustomers(false)
    }
  }

  async function fetchQuotations() {
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, customers(full_name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setQuotations(data || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal memuat quotation')
    } finally {
      setLoading(false)
    }
  }

  async function fetchItems(quotationId: string) {
    const { data, error } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('created_at', { ascending: true })
    if (error) {
      setMessage(error.message)
      return
    }
    setItems(data || [])
  }

  async function updateQuotationTotal(quotationId: string) {
    const { data } = await supabase
      .from('quotation_items')
      .select('line_total')
      .eq('quotation_id', quotationId)

    const total = (data || []).reduce((sum, item) => sum + Number(item.line_total || 0), 0)

    await supabase.from('quotations').update({ total_amount: total }).eq('id', quotationId)
    await fetchQuotations()
  }

  function resetQuotationForm() {
    setEditingQuotationId(null)
    setCustomerId('')
    setIssueDate('')
    setExpiryDate('')
    setStatus('draft')
  }

  function handleEditQuotation(q: any) {
    setEditingQuotationId(q.id)
    setCustomerId(q.customer_id || '')
    setIssueDate(q.issue_date || '')
    setExpiryDate(q.expiry_date || '')
    setStatus(q.status || 'draft')
    setShowQuotationForm(true)
  }

  async function handleQuotationSubmit(e: FormEvent) {
    e.preventDefault()
    if (!customerId) {
      setMessage('Pilih pelanggan.')
      return
    }
    try {
      const payload = {
      quotation_number: `QT-${Date.now()}`,
      customer_id: customerId,
      issue_date: issueDate || null,
      expiry_date: expiryDate || null,
      status,
    }
      let error: any = null
      if (editingQuotationId) {
        const res = await supabase.from('quotations').update(payload).eq('id', editingQuotationId)
        error = res.error
      } else {
        const res = await supabase.from('quotations').insert([payload])
        error = res.error
      }
      if (error) throw error
      setShowQuotationForm(false)
      resetQuotationForm()
      await fetchQuotations()
      setMessage('Quotation disimpan.')
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan quotation')
    }
  }

  async function handleDeleteQuotation(id: string) {
    if (!window.confirm('Padam quotation ini?')) return
    try {
      const { error } = await supabase.from('quotations').delete().eq('id', id)
      if (error) throw error
      if (selectedQuotation?.id === id) {
        setSelectedQuotation(null)
        setItems([])
      }
      await fetchQuotations()
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam quotation')
    }
  }

  function resetItemForm() {
    setEditingItemId(null)
    setItemDescription('')
    setItemQuantity('1')
    setItemUnit('unit')
    setItemUnitPrice('')
  }

  function handleEditItem(item: any) {
    setEditingItemId(item.id)
    setItemDescription(item.description || '')
    setItemQuantity(item.quantity?.toString() || '1')
    setItemUnit(item.unit || 'unit')
    setItemUnitPrice(item.unit_price?.toString() || '')
    setShowItemForm(true)
  }

  async function handleItemSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedQuotation || !itemDescription.trim()) return

    const qty = Number(itemQuantity) || 1
    const price = Number(itemUnitPrice) || 0
    const lineTotal = qty * price

    try {
      const payload = {
        quotation_id: selectedQuotation.id,
        description: itemDescription.trim(),
        quantity: qty,
        unit: itemUnit || null,
        unit_price: price,
        line_total: lineTotal,
      }
      let error: any = null
      if (editingItemId) {
        const res = await supabase.from('quotation_items').update(payload).eq('id', editingItemId)
        error = res.error
      } else {
        const res = await supabase.from('quotation_items').insert([payload])
        error = res.error
      }
      if (error) throw error

      setShowItemForm(false)
      resetItemForm()
      await fetchItems(selectedQuotation.id)
      await updateQuotationTotal(selectedQuotation.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan item')
    }
  }

  async function handleDeleteItem(id: string) {
    if (!window.confirm('Padam item ini?')) return
    try {
      const { error } = await supabase.from('quotation_items').delete().eq('id', id)
      if (error) throw error
      await fetchItems(selectedQuotation!.id)
      await updateQuotationTotal(selectedQuotation!.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam item')
    }
  }

  const selectedQuotationTotal = selectedQuotation
    ? items.reduce((sum, item) => sum + Number(item.line_total || 0), 0)
    : 0

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quotation</h2>
        <button
          onClick={() => {
            resetQuotationForm()
            setShowQuotationForm(!showQuotationForm)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showQuotationForm ? 'Tutup Borang' : '+ Tambah Quotation'}
        </button>
      </div>

      {showQuotationForm && (
        <form onSubmit={handleQuotationSubmit} className="bg-gray-50 p-4 rounded border space-y-3">
          <h3 className="font-bold">{editingQuotationId ? 'Edit Quotation' : 'Tambah Quotation Baru'}</h3>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="">Pilih Pelanggan *</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full border rounded px-3 py-2 text-base"
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border rounded px-3 py-2 text-base"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="draft">Draft</option>
            <option value="sent">Dihantar</option>
            <option value="accepted">Diterima</option>
            <option value="rejected">Ditolak</option>
          </select>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            {editingQuotationId ? 'Simpan Perubahan' : 'Simpan Quotation'}
          </button>
        </form>
      )}

      {message && <p className="text-red-500">{message}</p>}

      {loading ? (
        <p>Memuatkan quotation...</p>
      ) : quotations.length === 0 ? (
        <p>Tiada quotation. Klik "+ Tambah Quotation".</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">No.</th>
                <th className="text-left p-2 border">Pelanggan</th>
                <th className="text-left p-2 border">Tarikh</th>
                <th className="text-left p-2 border">Status</th>
                <th className="text-left p-2 border">Jumlah</th>
                <th className="text-left p-2 border">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id}>
                  <td className="p-2 border font-medium">{q.quotation_number}</td>
                  <td className="p-2 border">{q.customers?.full_name || '-'}</td>
                  <td className="p-2 border">{q.issue_date || '-'}</td>
                  <td className="p-2 border">{q.status}</td>
                  <td className="p-2 border">{q.total_amount ?? 0}</td>
                  <td className="p-2 border whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedQuotation(q)
                        fetchItems(q.id)
                      }}
                      className="text-blue-600 underline mr-3"
                    >
                      Pilih
                    </button>
                    <button onClick={() => handleEditQuotation(q)} className="text-green-600 underline mr-3">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteQuotation(q.id)} className="text-red-600 underline">
                      Padam
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Item section */}
      {selectedQuotation && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              Item untuk: {selectedQuotation.quotation_number}
            </h3>
            <div className="flex gap-2">
              <button
   onClick={() => {
   if (!selectedQuotation) return
    const phone = customers.find((c) => c.id === selectedQuotation.customer_id)?.phone || ''
    const message = `Salam ${selectedQuotation.customers?.full_name || 'pelanggan'},\n\nBerikut quotation anda:\n${selectedQuotation.quotation_number}\nJumlah: RM${selectedQuotationTotal.toFixed(2)}\n\nTerima kasih.`
    sendWhatsApp(phone, message)
  }}
  className="bg-green-600 text-white px-3 py-1 rounded"
>
  Hantar WhatsApp
</button>
              <button
                onClick={() => {
                  resetItemForm()
                  setShowItemForm(!showItemForm)
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                {showItemForm ? 'Tutup' : '+ Tambah Item'}
              </button>
              <button
                onClick={() => {
                  setSelectedQuotation(null)
                  setItems([])
                }}
                className="bg-gray-500 text-white px-3 py-1 rounded"
              >
                Tutup Quotation
              </button>
            </div>
          </div>

          {showItemForm && (
            <form onSubmit={handleItemSubmit} className="bg-gray-50 p-4 rounded border mt-3 space-y-3">
              <h4 className="font-bold">{editingItemId ? 'Edit Item' : 'Tambah Item'}</h4>
              <input
                type="text"
                placeholder="Penerangan (cth: Jahit langsir S-Fold)"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                required
                className="w-full border rounded px-3 py-2 text-base"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Qty"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Harga/Unit"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                {editingItemId ? 'Simpan Perubahan' : 'Simpan Item'}
              </button>
            </form>
          )}

          {items.length === 0 ? (
            <p className="mt-3 text-gray-600">Tiada item. Tambah item untuk quotation ini.</p>
          ) : (
            <div className="overflow-x-auto mt-3">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">Penerangan</th>
                    <th className="text-left p-2 border">Qty</th>
                    <th className="text-left p-2 border">Unit</th>
                    <th className="text-left p-2 border">Harga/Unit</th>
                    <th className="text-left p-2 border">Jumlah</th>
                    <th className="text-left p-2 border">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border">{item.description}</td>
                      <td className="p-2 border">{item.quantity}</td>
                      <td className="p-2 border">{item.unit || '-'}</td>
                      <td className="p-2 border">{item.unit_price}</td>
                      <td className="p-2 border">{item.line_total}</td>
                      <td className="p-2 border whitespace-nowrap">
                        <button onClick={() => handleEditItem(item)} className="text-green-600 underline mr-3">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 underline">
                          Padam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="p-2 border text-right">Jumlah Keseluruhan</td>
                    <td className="p-2 border">{selectedQuotationTotal.toFixed(2)}</td>
                    <td className="p-2 border"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CalculatorPage() {
  const [width, setWidth] = useState('')
  const [drop, setDrop] = useState('')
  const [unit, setUnit] = useState('cm')
  const [fullness, setFullness] = useState('2.0')
  const [fabricWidth, setFabricWidth] = useState('137')
  const [patternRepeat, setPatternRepeat] = useState('0')
  const [hemAllowance, setHemAllowance] = useState('20')
  const [sideAllowance, setSideAllowance] = useState('10')
  const [pricePerMeter, setPricePerMeter] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  function convertToCm(value: number, unit: string): number {
    if (unit === 'feet') return value * 30.48
    if (unit === 'inci') return value * 2.54
    return value
  }

  function handleCalculate(e: FormEvent) {
    e.preventDefault()
    setError('')

    const widthNumber = Number(width)
    const dropNumber = Number(drop)

    if (!widthNumber || !dropNumber || !fullness || !fabricWidth) {
      setError('Lebar, drop, fullness, dan lebar kain wajib diisi.')
      return
    }

    const widthCm = convertToCm(widthNumber, unit)
    const dropCm = convertToCm(dropNumber, unit)

    const input = {
      widthCm,
      dropCm,
      fullness: Number(fullness),
      fabricWidthCm: Number(fabricWidth),
      patternRepeatCm: Number(patternRepeat),
      hemAllowanceCm: Number(hemAllowance),
      sideAllowanceCm: Number(sideAllowance),
    }

    const calc = calculateFabric(input)
    setResult(calc)
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-1">Kalkulator Kain Langsir</h2>
      <p className="text-gray-600 mb-4 text-sm">
        Pilih unit ukuran, isi lebar dan drop, pilih fullness. Sistem akan kira jumlah kain.
      </p>

      <form onSubmit={handleCalculate} className="bg-gray-50 p-4 rounded border space-y-4">
        <div>
          <label className="block font-medium mb-1">Unit Ukuran</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="cm">Sentimeter (cm)</option>
            <option value="feet">Kaki (feet)</option>
            <option value="inci">Inci (inch)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Pilih unit untuk Lebar Tingkap dan Drop/Panjang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">
              Lebar Tingkap / Rel ({unit === 'cm' ? 'cm' : unit === 'feet' ? 'ft' : 'in'}) *
            </label>
            <input
              type="number"
              step="0.01"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              required
              placeholder={unit === 'cm' ? 'Contoh: 200' : unit === 'feet' ? 'Contoh: 6.5' : 'Contoh: 78'}
              className="w-full border rounded px-3 py-2 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lebar sebenar tingkap atau rel langsir dalam unit yang dipilih.
            </p>
          </div>

          <div>
            <label className="block font-medium mb-1">
              Drop / Panjang Langsir ({unit === 'cm' ? 'cm' : unit === 'feet' ? 'ft' : 'in'}) *
            </label>
            <input
              type="number"
              step="0.01"
              value={drop}
              onChange={(e) => setDrop(e.target.value)}
              required
              placeholder={unit === 'cm' ? 'Contoh: 250' : unit === 'feet' ? 'Contoh: 8.2' : 'Contoh: 98'}
              className="w-full border rounded px-3 py-2 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ukuran dari atas rel hingga ke bawah langsir yang dikehendaki.
            </p>
          </div>

          <div>
            <label className="block font-medium mb-1">Fullness (Nisbah Kekemasan) *</label>
            <input
              type="number"
              step="0.01"
              value={fullness}
              onChange={(e) => setFullness(e.target.value)}
              required
              placeholder="Contoh: 2.0"
              className="w-full border rounded px-3 py-2 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Berapa kali ganda lebar kain berbanding lebar tingkap. Nilai biasa: 1.5 – 2.5.
            </p>
          </div>

          <div>
            <label className="block font-medium mb-1">Lebar Kain (cm) *</label>
            <input
              type="number"
              step="0.01"
              value={fabricWidth}
              onChange={(e) => setFabricWidth(e.target.value)}
              required
              placeholder="Contoh: 137"
              className="w-full border rounded px-3 py-2 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lebar kain roll dalam cm. Kain biasa: 137 cm, 145 cm, 280 cm.
            </p>
          </div>

          <div>
            <label className="block font-medium mb-1">Pattern Repeat (cm)</label>
            <input
              type="number"
              step="0.01"
              value={patternRepeat}
              onChange={(e) => setPatternRepeat(e.target.value)}
              placeholder="0 jika tiada corak"
              className="w-full border rounded px-3 py-2 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Jarak ulangan corak kain dalam cm. Jika tiada corak, biarkan 0.
            </p>
          </div>

          <div>
            <label className="block font-medium mb-1">Harga Kain per Meter (RM)</label>
            <input
              type="number"
              step="0.01"
              value={pricePerMeter}
              onChange={(e) => setPricePerMeter(e.target.value)}
              placeholder="Contoh: 25.00"
              className="w-full border rounded px-3 py-2 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Untuk anggaran kos. Boleh dikosongkan.
            </p>
          </div>

          <div>
            <label className="block font-medium mb-1">Hem Allowance (cm)</label>
            <input
              type="number"
              step="0.01"
              value={hemAllowance}
              onChange={(e) => setHemAllowance(e.target.value)}
              placeholder="Biasa 20"
              className="w-full border rounded px-3 py-2 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lebihan kain untuk lipatan atas/bawah. Nilai biasa: 15–25 cm.
            </p>
          </div>

          <div>
            <label className="block font-medium mb-1">Side Allowance (cm)</label>
            <input
              type="number"
              step="0.01"
              value={sideAllowance}
              onChange={(e) => setSideAllowance(e.target.value)}
              placeholder="Biasa 10"
              className="w-full border rounded px-3 py-2 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lebihan kain untuk lipatan sisi. Nilai biasa: 5–10 cm.
            </p>
          </div>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto">
          Kira
        </button>
      </form>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {result && (
        <div className="mt-4 bg-blue-50 p-4 rounded border">
          <h3 className="font-bold mb-2">Hasil Pengiraan</h3>
          <p>Panel / Drop: <strong>{result.panels}</strong></p>
          <p>Panjang setiap panel: <strong>{result.lengthPerPanelCm} cm</strong></p>
          <p>Jumlah kain: <strong>{result.totalFabricMeter} meter</strong> ({result.totalFabricCm} cm)</p>
          {pricePerMeter && (
            <p>
              Anggaran kos kain:{' '}
              <strong>RM {(Number(pricePerMeter) * result.totalFabricMeter).toFixed(2)}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  )
}


function SalesOrderPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Form Sales Order
  const [showSalesOrderForm, setShowSalesOrderForm] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [quotationId, setQuotationId] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [status, setStatus] = useState('pending')
  const [editingSalesOrderId, setEditingSalesOrderId] = useState<string | null>(null)

  // Item Form
  const [showItemForm, setShowItemForm] = useState(false)
  const [itemDescription, setItemDescription] = useState('')
  const [itemQuantity, setItemQuantity] = useState('1')
  const [itemUnit, setItemUnit] = useState('unit')
  const [itemUnitPrice, setItemUnitPrice] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
    fetchQuotations()
    fetchSalesOrders()
  }, [])

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('id, full_name').order('full_name')
    setCustomers(data || [])
  }

  async function fetchQuotations() {
    const { data } = await supabase.from('quotations').select('id, quotation_number').order('created_at', { ascending: false })
    setQuotations(data || [])
  }

  async function fetchSalesOrders() {
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*, customers(full_name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setSalesOrders(data || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal memuat sales order')
    } finally {
      setLoading(false)
    }
  }

  async function fetchItems(salesOrderId: string) {
    const { data, error } = await supabase
      .from('sales_order_items')
      .select('*')
      .eq('sales_order_id', salesOrderId)
      .order('created_at', { ascending: true })
    if (error) {
      setMessage(error.message)
      return
    }
    setItems(data || [])
  }

  async function updateSalesOrderTotal(salesOrderId: string) {
    const { data } = await supabase
      .from('sales_order_items')
      .select('line_total')
      .eq('sales_order_id', salesOrderId)

    const total = (data || []).reduce((sum, item) => sum + Number(item.line_total || 0), 0)

    await supabase.from('sales_orders').update({ total_amount: total }).eq('id', salesOrderId)
    await fetchSalesOrders()
  }

  function resetSalesOrderForm() {
    setEditingSalesOrderId(null)
    setCustomerId('')
    setQuotationId('')
    setOrderDate('')
    setStatus('pending')
  }

  function handleEditSalesOrder(so: any) {
    setEditingSalesOrderId(so.id)
    setCustomerId(so.customer_id || '')
    setQuotationId(so.quotation_id || '')
    setOrderDate(so.order_date || '')
    setStatus(so.status || 'pending')
    setShowSalesOrderForm(true)
  }

  async function handleSalesOrderSubmit(e: FormEvent) {
    e.preventDefault()
    if (!customerId) {
      setMessage('Pilih pelanggan.')
      return
    }
    try {
      const payload = {
        order_number: `SO-${Date.now()}`,
        customer_id: customerId,
        quotation_id: quotationId || null,
        order_date: orderDate || null,
        status,
      }
      let error: any = null
      if (editingSalesOrderId) {
        const res = await supabase.from('sales_orders').update(payload).eq('id', editingSalesOrderId)
        error = res.error
      } else {
        const res = await supabase.from('sales_orders').insert([payload])
        error = res.error
      }
      if (error) throw error
      setShowSalesOrderForm(false)
      resetSalesOrderForm()
      await fetchSalesOrders()
      setMessage('Sales order disimpan.')
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan sales order')
    }
  }

  async function handleDeleteSalesOrder(id: string) {
    if (!window.confirm('Padam sales order ini?')) return
    try {
      const { error } = await supabase.from('sales_orders').delete().eq('id', id)
      if (error) throw error
      if (selectedSalesOrder?.id === id) {
        setSelectedSalesOrder(null)
        setItems([])
      }
      await fetchSalesOrders()
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam sales order')
    }
  }

  function resetItemForm() {
    setEditingItemId(null)
    setItemDescription('')
    setItemQuantity('1')
    setItemUnit('unit')
    setItemUnitPrice('')
  }

  function handleEditItem(item: any) {
    setEditingItemId(item.id)
    setItemDescription(item.description || '')
    setItemQuantity(item.quantity?.toString() || '1')
    setItemUnit(item.unit || 'unit')
    setItemUnitPrice(item.unit_price?.toString() || '')
    setShowItemForm(true)
  }

  async function handleItemSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedSalesOrder || !itemDescription.trim()) return

    const qty = Number(itemQuantity) || 1
    const price = Number(itemUnitPrice) || 0
    const lineTotal = qty * price

    try {
      const payload = {
        sales_order_id: selectedSalesOrder.id,
        description: itemDescription.trim(),
        quantity: qty,
        unit: itemUnit || null,
        unit_price: price,
        line_total: lineTotal,
      }
      let error: any = null
      if (editingItemId) {
        const res = await supabase.from('sales_order_items').update(payload).eq('id', editingItemId)
        error = res.error
      } else {
        const res = await supabase.from('sales_order_items').insert([payload])
        error = res.error
      }
      if (error) throw error

      setShowItemForm(false)
      resetItemForm()
      await fetchItems(selectedSalesOrder.id)
      await updateSalesOrderTotal(selectedSalesOrder.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan item')
    }
  }

  async function handleDeleteItem(id: string) {
    if (!window.confirm('Padam item ini?')) return
    try {
      const { error } = await supabase.from('sales_order_items').delete().eq('id', id)
      if (error) throw error
      await fetchItems(selectedSalesOrder!.id)
      await updateSalesOrderTotal(selectedSalesOrder!.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam item')
    }
  }

  const selectedSalesOrderTotal = selectedSalesOrder
    ? items.reduce((sum, item) => sum + Number(item.line_total || 0), 0)
    : 0

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Order</h2>
        <button
          onClick={() => {
            resetSalesOrderForm()
            setShowSalesOrderForm(!showSalesOrderForm)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showSalesOrderForm ? 'Tutup Borang' : '+ Tambah Sales Order'}
        </button>
      </div>

      {showSalesOrderForm && (
        <form onSubmit={handleSalesOrderSubmit} className="bg-gray-50 p-4 rounded border space-y-3">
          <h3 className="font-bold">{editingSalesOrderId ? 'Edit Sales Order' : 'Tambah Sales Order Baru'}</h3>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="">Pilih Pelanggan *</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
          <select
            value={quotationId}
            onChange={(e) => setQuotationId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="">Pilih Quotation (jika berkaitan)</option>
            {quotations.map((q) => (
              <option key={q.id} value={q.id}>{q.quotation_number}</option>
            ))}
          </select>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full border rounded px-3 py-2 text-base"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded px-3 py-2 text-base"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            {editingSalesOrderId ? 'Simpan Perubahan' : 'Simpan Sales Order'}
          </button>
        </form>
      )}

      {message && <p className="text-red-500">{message}</p>}

      {loading ? (
        <p>Memuatkan sales order...</p>
      ) : salesOrders.length === 0 ? (
        <p>Tiada sales order. Klik "+ Tambah Sales Order".</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">No.</th>
                <th className="text-left p-2 border">Pelanggan</th>
                <th className="text-left p-2 border">Tarikh</th>
                <th className="text-left p-2 border">Status</th>
                <th className="text-left p-2 border">Jumlah</th>
                <th className="text-left p-2 border">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {salesOrders.map((so) => (
                <tr key={so.id}>
                  <td className="p-2 border font-medium">{so.order_number}</td>
                  <td className="p-2 border">{so.customers?.full_name || '-'}</td>
                  <td className="p-2 border">{so.order_date || '-'}</td>
                  <td className="p-2 border">{so.status}</td>
                  <td className="p-2 border">{so.total_amount ?? 0}</td>
                  <td className="p-2 border whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedSalesOrder(so)
                        fetchItems(so.id)
                      }}
                      className="text-blue-600 underline mr-3"
                    >
                      Pilih
                    </button>
                    <button onClick={() => handleEditSalesOrder(so)} className="text-green-600 underline mr-3">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteSalesOrder(so.id)} className="text-red-600 underline">
                      Padam
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Item section */}
      {selectedSalesOrder && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              Item untuk: {selectedSalesOrder.order_number}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetItemForm()
                  setShowItemForm(!showItemForm)
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                {showItemForm ? 'Tutup' : '+ Tambah Item'}
              </button>
              <button
                onClick={() => {
                  setSelectedSalesOrder(null)
                  setItems([])
                }}
                className="bg-gray-500 text-white px-3 py-1 rounded"
              >
                Tutup Sales Order
              </button>
            </div>
          </div>

          {showItemForm && (
            <form onSubmit={handleItemSubmit} className="bg-gray-50 p-4 rounded border mt-3 space-y-3">
              <h4 className="font-bold">{editingItemId ? 'Edit Item' : 'Tambah Item'}</h4>
              <input
                type="text"
                placeholder="Penerangan (cth: Jahit langsir S-Fold)"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                required
                className="w-full border rounded px-3 py-2 text-base"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Qty"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Harga/Unit"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                {editingItemId ? 'Simpan Perubahan' : 'Simpan Item'}
              </button>
            </form>
          )}

          {items.length === 0 ? (
            <p className="mt-3 text-gray-600">Tiada item. Tambah item untuk sales order ini.</p>
          ) : (
            <div className="overflow-x-auto mt-3">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">Penerangan</th>
                    <th className="text-left p-2 border">Qty</th>
                    <th className="text-left p-2 border">Unit</th>
                    <th className="text-left p-2 border">Harga/Unit</th>
                    <th className="text-left p-2 border">Jumlah</th>
                    <th className="text-left p-2 border">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border">{item.description}</td>
                      <td className="p-2 border">{item.quantity}</td>
                      <td className="p-2 border">{item.unit || '-'}</td>
                      <td className="p-2 border">{item.unit_price}</td>
                      <td className="p-2 border">{item.line_total}</td>
                      <td className="p-2 border whitespace-nowrap">
                        <button onClick={() => handleEditItem(item)} className="text-green-600 underline mr-3">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 underline">
                          Padam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="p-2 border text-right">Jumlah Keseluruhan</td>
                    <td className="p-2 border">{selectedSalesOrderTotal.toFixed(2)}</td>
                    <td className="p-2 border"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InvoicePage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Form Invoice
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [salesOrderId, setSalesOrderId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState('draft')
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)

  // Item Form
  const [showItemForm, setShowItemForm] = useState(false)
  const [itemDescription, setItemDescription] = useState('')
  const [itemQuantity, setItemQuantity] = useState('1')
  const [itemUnit, setItemUnit] = useState('unit')
  const [itemUnitPrice, setItemUnitPrice] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
    fetchSalesOrders()
    fetchInvoices()
  }, [])

  async function fetchCustomers() {
    const { data } = await supabase
      .from('customers')
      .select('id, full_name, phone')
      .order('full_name')
    setCustomers(data || [])
  }

  async function fetchSalesOrders() {
    const { data } = await supabase
      .from('sales_orders')
      .select('id, order_number')
      .order('created_at', { ascending: false })
    setSalesOrders(data || [])
  }

  async function fetchInvoices() {
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customers(full_name, phone)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setInvoices(data || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal memuat invois')
    } finally {
      setLoading(false)
    }
  }

  async function fetchItems(invoiceId: string) {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true })
    if (error) {
      setMessage(error.message)
      return
    }
    setItems(data || [])
  }

  async function updateInvoiceTotal(invoiceId: string) {
    const { data } = await supabase
      .from('invoice_items')
      .select('line_total')
      .eq('invoice_id', invoiceId)

    const total = (data || []).reduce((sum, item) => sum + Number(item.line_total || 0), 0)

    await supabase.from('invoices').update({ total_amount: total }).eq('id', invoiceId)
    await fetchInvoices()
  }

  function resetInvoiceForm() {
    setEditingInvoiceId(null)
    setCustomerId('')
    setSalesOrderId('')
    setInvoiceDate('')
    setDueDate('')
    setStatus('draft')
  }

  function handleEditInvoice(inv: any) {
    setEditingInvoiceId(inv.id)
    setCustomerId(inv.customer_id || '')
    setSalesOrderId(inv.sales_order_id || '')
    setInvoiceDate(inv.invoice_date || '')
    setDueDate(inv.due_date || '')
    setStatus(inv.status || 'draft')
    setShowInvoiceForm(true)
  }

  async function handleInvoiceSubmit(e: FormEvent) {
    e.preventDefault()
    if (!customerId) {
      setMessage('Pilih pelanggan.')
      return
    }
    try {
      const payload = {
        invoice_number: `INV-${Date.now()}`,
        customer_id: customerId,
        sales_order_id: salesOrderId || null,
        invoice_date: invoiceDate || null,
        due_date: dueDate || null,
        status,
      }
      let error: any = null
      if (editingInvoiceId) {
        const res = await supabase.from('invoices').update(payload).eq('id', editingInvoiceId)
        error = res.error
      } else {
        const res = await supabase.from('invoices').insert([payload])
        error = res.error
      }
      if (error) throw error
      setShowInvoiceForm(false)
      resetInvoiceForm()
      await fetchInvoices()
      setMessage('Invois disimpan.')
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan invois')
    }
  }

  async function handleDeleteInvoice(id: string) {
    if (!window.confirm('Padam invois ini?')) return
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(null)
        setItems([])
      }
      await fetchInvoices()
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam invois')
    }
  }

  function resetItemForm() {
    setEditingItemId(null)
    setItemDescription('')
    setItemQuantity('1')
    setItemUnit('unit')
    setItemUnitPrice('')
  }

  function handleEditItem(item: any) {
    setEditingItemId(item.id)
    setItemDescription(item.description || '')
    setItemQuantity(item.quantity?.toString() || '1')
    setItemUnit(item.unit || 'unit')
    setItemUnitPrice(item.unit_price?.toString() || '')
    setShowItemForm(true)
  }

  async function handleItemSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedInvoice || !itemDescription.trim()) return

    const qty = Number(itemQuantity) || 1
    const price = Number(itemUnitPrice) || 0
    const lineTotal = qty * price

    try {
      const payload = {
        invoice_id: selectedInvoice.id,
        description: itemDescription.trim(),
        quantity: qty,
        unit: itemUnit || null,
        unit_price: price,
        line_total: lineTotal,
      }
      let error: any = null
      if (editingItemId) {
        const res = await supabase.from('invoice_items').update(payload).eq('id', editingItemId)
        error = res.error
      } else {
        const res = await supabase.from('invoice_items').insert([payload])
        error = res.error
      }
      if (error) throw error

      setShowItemForm(false)
      resetItemForm()
      await fetchItems(selectedInvoice.id)
      await updateInvoiceTotal(selectedInvoice.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan item')
    }
  }

  async function handleDeleteItem(id: string) {
    if (!window.confirm('Padam item ini?')) return
    try {
      const { error } = await supabase.from('invoice_items').delete().eq('id', id)
      if (error) throw error
      await fetchItems(selectedInvoice!.id)
      await updateInvoiceTotal(selectedInvoice!.id)
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam item')
    }
  }

  const selectedInvoiceTotal = selectedInvoice
    ? items.reduce((sum, item) => sum + Number(item.line_total || 0), 0)
    : 0

  const selectedInvoiceBalance = selectedInvoice
    ? Number(selectedInvoice.total_amount || 0) - Number(selectedInvoice.paid_amount || 0)
    : 0

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoice</h2>
        <button
          onClick={() => {
            resetInvoiceForm()
            setShowInvoiceForm(!showInvoiceForm)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showInvoiceForm ? 'Tutup Borang' : '+ Tambah Invoice'}
        </button>
      </div>

      {showInvoiceForm && (
        <form onSubmit={handleInvoiceSubmit} className="bg-gray-50 p-4 rounded border space-y-3">
          <h3 className="font-bold">{editingInvoiceId ? 'Edit Invoice' : 'Tambah Invoice Baru'}</h3>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="">Pilih Pelanggan *</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
          <select
            value={salesOrderId}
            onChange={(e) => setSalesOrderId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="">Pilih Sales Order (jika berkaitan)</option>
            {salesOrders.map((so) => (
              <option key={so.id} value={so.id}>{so.order_number}</option>
            ))}
          </select>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full border rounded px-3 py-2 text-base"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border rounded px-3 py-2 text-base"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="partially paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            {editingInvoiceId ? 'Simpan Perubahan' : 'Simpan Invoice'}
          </button>
        </form>
      )}

      {message && <p className="text-red-500">{message}</p>}

      {loading ? (
        <p>Memuatkan invois...</p>
      ) : invoices.length === 0 ? (
        <p>Tiada invois. Klik "+ Tambah Invoice".</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">No.</th>
                <th className="text-left p-2 border">Pelanggan</th>
                <th className="text-left p-2 border">Tarikh</th>
                <th className="text-left p-2 border">Due Date</th>
                <th className="text-left p-2 border">Status</th>
                <th className="text-left p-2 border">Jumlah</th>
                <th className="text-left p-2 border">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="p-2 border font-medium">{inv.invoice_number}</td>
                  <td className="p-2 border">{inv.customers?.full_name || '-'}</td>
                  <td className="p-2 border">{inv.invoice_date || '-'}</td>
                  <td className="p-2 border">{inv.due_date || '-'}</td>
                  <td className="p-2 border">{inv.status}</td>
                  <td className="p-2 border">{inv.total_amount ?? 0}</td>
                  <td className="p-2 border whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedInvoice(inv)
                        fetchItems(inv.id)
                      }}
                      className="text-blue-600 underline mr-3"
                    >
                      Pilih
                    </button>
                    <button onClick={() => handleEditInvoice(inv)} className="text-green-600 underline mr-3">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteInvoice(inv.id)} className="text-red-600 underline">
                      Padam
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Item section */}
      {selectedInvoice && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              Item untuk: {selectedInvoice.invoice_number}
            </h3>
            <div className="flex gap-2">
              {/* Butang WhatsApp */}
              <button
                onClick={() => {
                  if (!selectedInvoice) return
                  const phone = customers.find((c) => c.id === selectedInvoice.customer_id)?.phone || ''
                  const message = `Salam ${selectedInvoice.customers?.full_name || 'pelanggan'},\n\nInvois ${selectedInvoice.invoice_number}\nJumlah: RM${selectedInvoiceTotal.toFixed(2)}\nBaki: RM${selectedInvoiceBalance.toFixed(2)}\n\nTerima kasih.`
                  sendWhatsApp(phone, message)
                }}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Hantar WhatsApp
              </button>

              {/* Butang PDF */}
              <button
                onClick={() => {
                  if (!selectedInvoice || items.length === 0) return
                  const rows = items.map((item: any) => [
                    item.description,
                    item.quantity,
                    item.unit || '-',
                    `RM${Number(item.unit_price).toFixed(2)}`,
                    `RM${Number(item.line_total).toFixed(2)}`,
                  ])
                  generatePDF(selectedInvoice.invoice_number, [
                    {
                      table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                          ['Penerangan', 'Qty', 'Unit', 'Harga', 'Jumlah'],
                          ...rows,
                          ['', '', '', 'Jumlah', `RM${selectedInvoiceTotal.toFixed(2)}`],
                          ['', '', '', 'Baki', `RM${selectedInvoiceBalance.toFixed(2)}`],
                        ],
                      },
                    },
                  ])
                }}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                PDF
              </button>

              <button
                onClick={() => {
                  resetItemForm()
                  setShowItemForm(!showItemForm)
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                {showItemForm ? 'Tutup' : '+ Tambah Item'}
              </button>
              <button
                onClick={() => {
                  setSelectedInvoice(null)
                  setItems([])
                }}
                className="bg-gray-500 text-white px-3 py-1 rounded"
              >
                Tutup Invoice
              </button>
            </div>
          </div>

          {showItemForm && (
            <form onSubmit={handleItemSubmit} className="bg-gray-50 p-4 rounded border mt-3 space-y-3">
              <h4 className="font-bold">{editingItemId ? 'Edit Item' : 'Tambah Item'}</h4>
              <input
                type="text"
                placeholder="Penerangan (cth: Jahit langsir S-Fold)"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                required
                className="w-full border rounded px-3 py-2 text-base"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Qty"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Harga/Unit"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-base"
                />
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                {editingItemId ? 'Simpan Perubahan' : 'Simpan Item'}
              </button>
            </form>
          )}

          {items.length === 0 ? (
            <p className="mt-3 text-gray-600">Tiada item. Tambah item untuk invois ini.</p>
          ) : (
            <div className="overflow-x-auto mt-3">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">Penerangan</th>
                    <th className="text-left p-2 border">Qty</th>
                    <th className="text-left p-2 border">Unit</th>
                    <th className="text-left p-2 border">Harga/Unit</th>
                    <th className="text-left p-2 border">Jumlah</th>
                    <th className="text-left p-2 border">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border">{item.description}</td>
                      <td className="p-2 border">{item.quantity}</td>
                      <td className="p-2 border">{item.unit || '-'}</td>
                      <td className="p-2 border">{item.unit_price}</td>
                      <td className="p-2 border">{item.line_total}</td>
                      <td className="p-2 border whitespace-nowrap">
                        <button onClick={() => handleEditItem(item)} className="text-green-600 underline mr-3">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 underline">
                          Padam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="p-2 border text-right">Jumlah Keseluruhan</td>
                    <td className="p-2 border">{selectedInvoiceTotal.toFixed(2)}</td>
                    <td className="p-2 border"></td>
                  </tr>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="p-2 border text-right">Baki Belum Bayar</td>
                    <td className="p-2 border">{selectedInvoiceBalance.toFixed(2)}</td>
                    <td className="p-2 border"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PaymentPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [method, setMethod] = useState('cash')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchInvoices()
    fetchPayments()
  }, [])

  async function fetchInvoices() {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customers(full_name)')
      .order('created_at', { ascending: false })
    if (error) {
      setMessage(error.message)
      return
    }
    setInvoices(data || [])
  }

  async function fetchPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*, customers(full_name)')
      .order('created_at', { ascending: false })
    if (error) {
      setMessage(error.message)
      return
    }
    setPayments(data || [])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedInvoiceId || !amount) {
      setMessage('Pilih invois dan masukkan jumlah.')
      return
    }

    setSaving(true)
    setMessage('')

    const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId)
    if (!selectedInvoice) {
      setMessage('Invois tidak dijumpai.')
      setSaving(false)
      return
    }

    const paymentAmount = Number(amount)
    if (paymentAmount <= 0) {
      setMessage('Jumlah mesti lebih besar daripada 0.')
      setSaving(false)
      return
    }

    try {
      // 1. Simpan payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            payment_number: `PAY-${Date.now()}`,
            customer_id: selectedInvoice.customer_id,
            invoice_id: selectedInvoice.id,
            payment_date: paymentDate || null,
            amount: paymentAmount,
            method,
            reference_number: referenceNumber || null,
            status: 'confirmed',
          },
        ])
        .select()
        .single()

      if (paymentError) throw paymentError

      // 2. Simpan allocation
      const { error: allocationError } = await supabase
        .from('payment_allocations')
        .insert([
          {
            payment_id: paymentData.id,
            invoice_id: selectedInvoice.id,
            amount: paymentAmount,
          },
        ])

      if (allocationError) throw allocationError

      // 3. Kemas kini paid_amount dan balance_due pada invoice
      const newPaidAmount = Number(selectedInvoice.paid_amount || 0) + paymentAmount
      const newBalanceDue = Number(selectedInvoice.total_amount || 0) - newPaidAmount

      const { error: updateError } = await supabase
        .from('invoices')
        .update({ paid_amount: newPaidAmount, balance_due: newBalanceDue })
        .eq('id', selectedInvoice.id)

      if (updateError) throw updateError

      setSelectedInvoiceId('')
      setAmount('')
      setPaymentDate('')
      setMethod('cash')
      setReferenceNumber('')
      await fetchInvoices()
      await fetchPayments()
      setMessage('Bayaran disimpan.')
    } catch (err: any) {
      setMessage(err.message || 'Gagal menyimpan bayaran')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <h2 className="text-2xl font-bold">Bayaran & Hutang</h2>

      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded border space-y-3">
        <h3 className="font-bold">Rekod Bayaran</h3>
        <select
          value={selectedInvoiceId}
          onChange={(e) => setSelectedInvoiceId(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 text-base"
        >
          <option value="">Pilih Invois *</option>
          {invoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.invoice_number} — {inv.customers?.full_name || '-'} (Baki: RM{(Number(inv.total_amount || 0) - Number(inv.paid_amount || 0)).toFixed(2)})
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Jumlah Bayaran (RM) *"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 text-base"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="cash">Tunai</option>
            <option value="bank">Bank Transfer</option>
            <option value="ewallet">E-Wallet</option>
            <option value="cheque">Cek</option>
          </select>
        </div>
        <input
          type="text"
          placeholder="Nombor Rujukan (jika ada)"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          className="w-full border rounded px-3 py-2 text-base"
        />
        <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded">
          {saving ? 'Menyimpan...' : 'Simpan Bayaran'}
        </button>
      </form>

      {message && <p className="text-red-500">{message}</p>}

      <h3 className="text-xl font-bold mt-4">Senarai Bayaran</h3>
      {payments.length === 0 ? (
        <p>Tiada bayaran direkod.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">No.</th>
                <th className="text-left p-2 border">Pelanggan</th>
                <th className="text-left p-2 border">Tarikh</th>
                <th className="text-left p-2 border">Kaedah</th>
                <th className="text-left p-2 border">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 border font-medium">{p.payment_number}</td>
                  <td className="p-2 border">{p.customers?.full_name || '-'}</td>
                  <td className="p-2 border">{p.payment_date || '-'}</td>
                  <td className="p-2 border">{p.method}</td>
                  <td className="p-2 border">RM{Number(p.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ReportsPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setMessage('')
    try {
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, paid_amount, balance_due, status')
        .order('created_at', { ascending: false })

      if (invError) throw invError

      const { data: payData, error: payError } = await supabase
        .from('payments')
        .select('id, amount')
        .order('created_at', { ascending: false })

      if (payError) throw payError

      setInvoices(invData || [])
      setPayments(payData || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal memuat laporan')
    }
  }

  const totalInvoice = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0)

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <h2 className="text-2xl font-bold">Laporan Kewangan Ringkas</h2>
      {message && <p className="text-red-500">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded border">
          <p className="text-gray-600">Jumlah Invois</p>
          <p className="text-2xl font-bold">RM{totalInvoice.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded border">
          <p className="text-gray-600">Jumlah Bayaran</p>
          <p className="text-2xl font-bold">RM{totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded border">
          <p className="text-gray-600">Baki Hutang</p>
          <p className="text-2xl font-bold">RM{totalOutstanding.toFixed(2)}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold mt-4">Senarai Invois</h3>
      {invoices.length === 0 ? (
        <p>Tiada invois.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">No.</th>
                <th className="text-left p-2 border">Jumlah</th>
                <th className="text-left p-2 border">Dibayar</th>
                <th className="text-left p-2 border">Baki</th>
                <th className="text-left p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="p-2 border font-medium">{inv.invoice_number}</td>
                  <td className="p-2 border">RM{Number(inv.total_amount || 0).toFixed(2)}</td>
                  <td className="p-2 border">RM{Number(inv.paid_amount || 0).toFixed(2)}</td>
                  <td className="p-2 border">RM{Number(inv.balance_due || 0).toFixed(2)}</td>
                  <td className="p-2 border">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [supplierName, setSupplierName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  async function fetchSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setMessage(error.message)
      return
    }
    setSuppliers(data || [])
  }

  function resetForm() {
    setEditingId(null)
    setSupplierName('')
    setContactPerson('')
    setPhone('')
    setEmail('')
    setAddress('')
    setNotes('')
  }

  function handleEdit(s: any) {
    setEditingId(s.id)
    setSupplierName(s.supplier_name || '')
    setContactPerson(s.contact_person || '')
    setPhone(s.phone || '')
    setEmail(s.email || '')
    setAddress(s.address || '')
    setNotes(s.notes || '')
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    if (!supplierName.trim()) {
      setMessage('Nama supplier wajib diisi.')
      setSaving(false)
      return
    }
    try {
      const payload = {
        supplier_name: supplierName.trim(),
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      }
      let error: any = null
      if (editingId) {
        const res = await supabase.from('suppliers').update(payload).eq('id', editingId)
        error = res.error
      } else {
        const res = await supabase.from('suppliers').insert([payload])
        error = res.error
      }
      if (error) throw error
      setShowForm(false)
      resetForm()
      await fetchSuppliers()
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan supplier')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Padam supplier ini?')) return
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
      await fetchSuppliers()
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam supplier')
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Supplier</h2>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Tutup Borang' : '+ Tambah Supplier'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded border space-y-3">
          <h3 className="font-bold">{editingId ? 'Edit Supplier' : 'Tambah Supplier'}</h3>
          <input type="text" placeholder="Nama Supplier *" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required className="w-full border rounded px-3 py-2 text-base" />
          <input type="text" placeholder="Nama Kontak" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <input type="text" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <textarea placeholder="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <textarea placeholder="Nota" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded">
            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Supplier'}
          </button>
        </form>
      )}

      {message && <p className="text-red-500">{message}</p>}

      {suppliers.length === 0 ? (
        <p>Tiada supplier.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">Nama</th>
                <th className="text-left p-2 border">Kontak</th>
                <th className="text-left p-2 border">Telefon</th>
                <th className="text-left p-2 border">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="p-2 border font-medium">{s.supplier_name}</td>
                  <td className="p-2 border">{s.contact_person || '-'}</td>
                  <td className="p-2 border">{s.phone || '-'}</td>
                  <td className="p-2 border whitespace-nowrap">
                    <button onClick={() => handleEdit(s)} className="text-green-600 underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 underline">Padam</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expenseDate, setExpenseDate] = useState('')
  const [category, setCategory] = useState('Belanja Lain')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchExpenses()
    fetchSuppliers()
  }, [])

  async function fetchExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, suppliers(supplier_name)')
      .order('created_at', { ascending: false })
    if (error) {
      setMessage(error.message)
      return
    }
    setExpenses(data || [])
  }

  async function fetchSuppliers() {
    const { data } = await supabase.from('suppliers').select('id, supplier_name').order('supplier_name')
    setSuppliers(data || [])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    if (!amount || Number(amount) <= 0) {
      setMessage('Jumlah mesti lebih besar daripada 0.')
      setSaving(false)
      return
    }
    try {
      const payload = {
        expense_number: `EXP-${Date.now()}`,
        supplier_id: supplierId || null,
        expense_date: expenseDate || null,
        category,
        amount: Number(amount),
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes.trim() || null,
      }
      const { error } = await supabase.from('expenses').insert([payload])
      if (error) throw error
      setShowForm(false)
      setExpenseDate('')
      setCategory('Belanja Lain')
      setAmount('')
      setPaymentMethod('cash')
      setReferenceNumber('')
      setSupplierId('')
      setNotes('')
      await fetchExpenses()
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expense</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded">
          {showForm ? 'Tutup Borang' : '+ Tambah Expense'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded border space-y-3">
          <h3 className="font-bold">Tambah Expense</h3>
          <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded px-3 py-2 text-base">
            <option value="Belanja Lain">Belanja Lain</option>
            <option value="Sewa">Sewa</option>
            <option value="Elektrik">Elektrik</option>
            <option value="Air">Air</option>
            <option value="Pengangkutan">Pengangkutan</option>
            <option value="Pemasaran">Pemasaran</option>
            <option value="Internet">Internet</option>
            <option value="Upah Jahit">Upah Jahit</option>
            <option value="Belian Kain">Belian Kain</option>
          </select>
          <input type="number" step="0.01" placeholder="Jumlah (RM) *" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full border rounded px-3 py-2 text-base" />
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border rounded px-3 py-2 text-base">
            <option value="cash">Tunai</option>
            <option value="bank">Bank Transfer</option>
            <option value="ewallet">E-Wallet</option>
            <option value="cheque">Cek</option>
          </select>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full border rounded px-3 py-2 text-base">
            <option value="">Pilih Supplier (jika berkaitan)</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.supplier_name}</option>
            ))}
          </select>
          <input type="text" placeholder="Nombor Rujukan" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <textarea placeholder="Nota" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded">
            {saving ? 'Menyimpan...' : 'Simpan Expense'}
          </button>
        </form>
      )}

      {message && <p className="text-red-500">{message}</p>}

      {expenses.length === 0 ? (
        <p>Tiada expense direkod.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">No.</th>
                <th className="text-left p-2 border">Tarikh</th>
                <th className="text-left p-2 border">Kategori</th>
                <th className="text-left p-2 border">Jumlah</th>
                <th className="text-left p-2 border">Supplier</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="p-2 border font-medium">{e.expense_number}</td>
                  <td className="p-2 border">{e.expense_date || '-'}</td>
                  <td className="p-2 border">{e.category}</td>
                  <td className="p-2 border">RM{Number(e.amount).toFixed(2)}</td>
                  <td className="p-2 border">{e.suppliers?.supplier_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function InventoryPage() {
  const [fabricStock, setFabricStock] = useState<any[]>([])
  const [productStock, setProductStock] = useState<any[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: fabricData, error: fabricError } = await supabase
        .from('fabric_stock')
        .select('*, fabrics(fabric_name)')
        .order('created_at', { ascending: false })
      if (fabricError) throw fabricError

      const { data: productData, error: productError } = await supabase
        .from('product_stock')
        .select('*, products(product_name)')
        .order('created_at', { ascending: false })
      if (productError) throw productError

      setFabricStock(fabricData || [])
      setProductStock(productData || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal memuat stok')
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <h2 className="text-2xl font-bold">Inventory</h2>
      {message && <p className="text-red-500">{message}</p>}

      <h3 className="text-xl font-bold">Stok Kain</h3>
      {fabricStock.length === 0 ? (
        <p>Tiada stok kain.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">Kain</th>
                <th className="text-left p-2 border">Batch/No. Gulung</th>
                <th className="text-left p-2 border">Baki Meter</th>
                <th className="text-left p-2 border">Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {fabricStock.map((f) => (
                <tr key={f.id}>
                  <td className="p-2 border">{f.fabrics?.fabric_name || '-'}</td>
                  <td className="p-2 border">{f.roll_no || f.batch_code || '-'}</td>
                  <td className="p-2 border">{f.remaining_meter}</td>
                  <td className="p-2 border">{f.location || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="text-xl font-bold mt-4">Stok Produk</h3>
      {productStock.length === 0 ? (
        <p>Tiada stok produk.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">Produk</th>
                <th className="text-left p-2 border">Batch</th>
                <th className="text-left p-2 border">Baki Unit</th>
                <th className="text-left p-2 border">Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {productStock.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 border">{p.products?.product_name || '-'}</td>
                  <td className="p-2 border">{p.batch_code || '-'}</td>
                  <td className="p-2 border">{p.remaining_quantity}</td>
                  <td className="p-2 border">{p.location || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function WorkshopPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [status, setStatus] = useState('pending')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchJobs()
    fetchCustomers()
  }, [])

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('workshop_jobs')
      .select('*, customers(full_name)')
      .order('created_at', { ascending: false })
    if (error) {
      setMessage(error.message)
      return
    }
    setJobs(data || [])
  }

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('id, full_name').order('full_name')
    setCustomers(data || [])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    if (!customerId) {
      setMessage('Pilih pelanggan.')
      setSaving(false)
      return
    }
    try {
      const payload = {
        job_number: `JOB-${Date.now()}`,
        customer_id: customerId,
        status,
        assigned_to: assignedTo.trim() || null,
        due_date: dueDate || null,
        notes: notes.trim() || null,
      }
      const { error } = await supabase.from('workshop_jobs').insert([payload])
      if (error) throw error
      setShowForm(false)
      setCustomerId('')
      setStatus('pending')
      setAssignedTo('')
      setDueDate('')
      setNotes('')
      await fetchJobs()
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan job')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Workshop</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded">
          {showForm ? 'Tutup Borang' : '+ Tambah Job'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded border space-y-3">
          <h3 className="font-bold">Tambah Job Jahitan</h3>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="w-full border rounded px-3 py-2 text-base">
            <option value="">Pilih Pelanggan *</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
          <input type="text" placeholder="Tukang Jahit / Assigned To" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-base">
            <option value="pending">Pending</option>
            <option value="cutting">Potong</option>
            <option value="sewing">Jahit</option>
            <option value="qc">QC</option>
            <option value="completed">Selesai</option>
          </select>
          <textarea placeholder="Nota" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded">
            {saving ? 'Menyimpan...' : 'Simpan Job'}
          </button>
        </form>
      )}

      {message && <p className="text-red-500">{message}</p>}

      {jobs.length === 0 ? (
        <p>Tiada job workshop.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">No.</th>
                <th className="text-left p-2 border">Pelanggan</th>
                <th className="text-left p-2 border">Status</th>
                <th className="text-left p-2 border">Tukang</th>
                <th className="text-left p-2 border">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td className="p-2 border font-medium">{j.job_number}</td>
                  <td className="p-2 border">{j.customers?.full_name || '-'}</td>
                  <td className="p-2 border">{j.status}</td>
                  <td className="p-2 border">{j.assigned_to || '-'}</td>
                  <td className="p-2 border">{j.due_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function InstallationPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [installations, setInstallations] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [installationDate, setInstallationDate] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState('pending')
  const [installerName, setInstallerName] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCustomers()
    fetchInvoices()
    fetchInstallations()
  }, [])

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('id, full_name').order('full_name')
    setCustomers(data || [])
  }

  async function fetchInvoices() {
    const { data } = await supabase.from('invoices').select('id, invoice_number').order('created_at', { ascending: false })
    setInvoices(data || [])
  }

  async function fetchInstallations() {
    const { data, error } = await supabase
      .from('installations')
      .select('*, customers(full_name)')
      .order('created_at', { ascending: false })
    if (error) {
      setMessage(error.message)
      return
    }
    setInstallations(data || [])
  }

  function resetForm() {
    setEditingId(null)
    setCustomerId('')
    setInvoiceId('')
    setInstallationDate('')
    setAddress('')
    setStatus('pending')
    setInstallerName('')
    setNotes('')
  }

  function handleEdit(inst: any) {
    setEditingId(inst.id)
    setCustomerId(inst.customer_id || '')
    setInvoiceId(inst.invoice_id || '')
    setInstallationDate(inst.installation_date || '')
    setAddress(inst.address || '')
    setStatus(inst.status || 'pending')
    setInstallerName(inst.installer_name || '')
    setNotes(inst.notes || '')
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    if (!customerId) {
      setMessage('Pilih pelanggan.')
      setSaving(false)
      return
    }
    try {
      const payload = {
        customer_id: customerId,
        invoice_id: invoiceId || null,
        installation_date: installationDate || null,
        address: address.trim() || null,
        status,
        installer_name: installerName.trim() || null,
        notes: notes.trim() || null,
      }
      let error: any = null
      if (editingId) {
        const res = await supabase.from('installations').update(payload).eq('id', editingId)
        error = res.error
      } else {
        const res = await supabase.from('installations').insert([payload])
        error = res.error
      }
      if (error) throw error
      setShowForm(false)
      resetForm()
      await fetchInstallations()
    } catch (err: any) {
      setMessage(err.message || 'Gagal simpan pemasangan')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Padam rekod pemasangan ini?')) return
    try {
      const { error } = await supabase.from('installations').delete().eq('id', id)
      if (error) throw error
      await fetchInstallations()
    } catch (err: any) {
      setMessage(err.message || 'Gagal padam pemasangan')
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pemasangan</h2>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Tutup Borang' : '+ Tambah Pemasangan'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded border space-y-3">
          <h3 className="font-bold">{editingId ? 'Edit Pemasangan' : 'Tambah Pemasangan'}</h3>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="w-full border rounded px-3 py-2 text-base">
            <option value="">Pilih Pelanggan *</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
          <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="w-full border rounded px-3 py-2 text-base">
            <option value="">Pilih Invois (jika berkaitan)</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>
            ))}
          </select>
          <input type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <input type="text" placeholder="Alamat Pemasangan" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-base">
            <option value="pending">Pending</option>
            <option value="scheduled">Dijadualkan</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Batal</option>
          </select>
          <input type="text" placeholder="Nama Pemasang" value={installerName} onChange={(e) => setInstallerName(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <textarea placeholder="Nota" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded px-3 py-2 text-base" />
          <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded">
            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Pemasangan'}
          </button>
        </form>
      )}

      {message && <p className="text-red-500">{message}</p>}

      {installations.length === 0 ? (
        <p>Tiada rekod pemasangan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">Pelanggan</th>
                <th className="text-left p-2 border">Tarikh</th>
                <th className="text-left p-2 border">Status</th>
                <th className="text-left p-2 border">Pemasang</th>
                <th className="text-left p-2 border">Alamat</th>
                <th className="text-left p-2 border">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {installations.map((inst) => (
                <tr key={inst.id}>
                  <td className="p-2 border font-medium">{inst.customers?.full_name || '-'}</td>
                  <td className="p-2 border">{inst.installation_date || '-'}</td>
                  <td className="p-2 border">{inst.status}</td>
                  <td className="p-2 border">{inst.installer_name || '-'}</td>
                  <td className="p-2 border">{inst.address || '-'}</td>
                  <td className="p-2 border whitespace-nowrap">
                    <button onClick={() => handleEdit(inst)} className="text-green-600 underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(inst.id)} className="text-red-600 underline">Padam</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DashboardPage() {
  const [customerCount, setCustomerCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)
  const [invoiceTotal, setInvoiceTotal] = useState(0)
  const [outstandingTotal, setOutstandingTotal] = useState(0)
  const [paymentTotal, setPaymentTotal] = useState(0)
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    setMessage('')
    try {
      const { count: custCount, error: custError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
      if (custError) throw custError

      const { count: projCount, error: projError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
      if (projError) throw projError

      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select('total_amount, balance_due')
      if (invError) throw invError

      const { data: payData, error: payError } = await supabase
        .from('payments')
        .select('amount')
      if (payError) throw payError

      const { data: expData, error: expError } = await supabase
        .from('expenses')
        .select('amount')
      if (expError) throw expError

      setCustomerCount(custCount || 0)
      setProjectCount(projCount || 0)
      setInvoiceTotal((invData || []).reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0))
      setOutstandingTotal((invData || []).reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0))
      setPaymentTotal((payData || []).reduce((sum, p) => sum + Number(p.amount || 0), 0))
      setExpenseTotal((expData || []).reduce((sum, e) => sum + Number(e.amount || 0), 0))
    } catch (err: any) {
      setMessage(err.message || 'Gagal memuat dashboard')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 sm:p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        {message && <p className="text-red-500">{message}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded border">
            <p className="text-gray-600">Pelanggan</p>
            <p className="text-2xl font-bold">{customerCount}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded border">
            <p className="text-gray-600">Projek</p>
            <p className="text-2xl font-bold">{projectCount}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded border">
            <p className="text-gray-600">Jumlah Invois</p>
            <p className="text-2xl font-bold">RM{invoiceTotal.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded border">
            <p className="text-gray-600">Jumlah Bayaran</p>
            <p className="text-2xl font-bold">RM{paymentTotal.toFixed(2)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded border">
            <p className="text-gray-600">Baki Hutang</p>
            <p className="text-2xl font-bold">RM{outstandingTotal.toFixed(2)}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded border">
            <p className="text-gray-600">Jumlah Belanja</p>
            <p className="text-2xl font-bold">RM{expenseTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function BackupPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState('')

  async function handleExportCustomers() {
    setLoading('customers')
    setMessage('')
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
      if (error) throw error
      exportCSV('pelanggan.csv', data || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal eksport pelanggan')
    } finally {
      setLoading('')
    }
  }

  async function handleExportInvoices() {
    setLoading('invoices')
    setMessage('')
    try {
      const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
      if (error) throw error
      exportCSV('invois.csv', data || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal eksport invois')
    } finally {
      setLoading('')
    }
  }

  async function handleExportPayments() {
    setLoading('payments')
    setMessage('')
    try {
      const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
      if (error) throw error
      exportCSV('bayaran.csv', data || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal eksport bayaran')
    } finally {
      setLoading('')
    }
  }

  async function handleExportAllJSON() {
    setLoading('all')
    setMessage('')
    try {
      const [custRes, invRes, payRes, expRes, supRes] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('suppliers').select('*'),
      ])
      exportJSON('backup-semua-data.json', {
        customers: custRes.data || [],
        invoices: invRes.data || [],
        payments: payRes.data || [],
        expenses: expRes.data || [],
        suppliers: supRes.data || [],
        exported_at: new Date().toISOString(),
      })
    } catch (err: any) {
      setMessage(err.message || 'Gagal eksport semua data')
    } finally {
      setLoading('')
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <h2 className="text-2xl font-bold">Backup Data</h2>
      <p className="text-gray-600">
        Muat turun salinan data penting untuk disimpan di tempat selamat.
      </p>

      {message && <p className="text-red-500">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleExportCustomers}
          disabled={loading === 'customers'}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading === 'customers' ? 'Mengeksport...' : 'Eksport Pelanggan (CSV)'}
        </button>
        <button
          onClick={handleExportInvoices}
          disabled={loading === 'invoices'}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading === 'invoices' ? 'Mengeksport...' : 'Eksport Invois (CSV)'}
        </button>
        <button
          onClick={handleExportPayments}
          disabled={loading === 'payments'}
          className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading === 'payments' ? 'Mengeksport...' : 'Eksport Bayaran (CSV)'}
        </button>
        <button
          onClick={handleExportAllJSON}
          disabled={loading === 'all'}
          className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading === 'all' ? 'Mengeksport...' : 'Eksport Semua Data (JSON)'}
        </button>
      </div>
    </div>
  )
}

function AnalyticsPage() {
  const [invoiceData, setInvoiceData] = useState<any[]>([])
  const [expenseData, setExpenseData] = useState<any[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setMessage('')
    try {
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, paid_amount, balance_due, status, invoice_date')
        .order('invoice_date', { ascending: false })
      if (invError) throw invError

      const { data: expData, error: expError } = await supabase
        .from('expenses')
        .select('id, expense_number, category, amount, expense_date')
        .order('expense_date', { ascending: false })
      if (expError) throw expError

      setInvoiceData(invData || [])
      setExpenseData(expData || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal memuat analisis')
    }
  }

  const totalRevenue = invoiceData.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
  const totalExpense = expenseData.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
  const netProfit = totalRevenue - totalExpense

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
      <h2 className="text-2xl font-bold">Analisis Untung Rugi</h2>
      {message && <p className="text-red-500">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded border">
          <p className="text-gray-600">Jumlah Hasil (Invois)</p>
          <p className="text-2xl font-bold">RM{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded border">
          <p className="text-gray-600">Jumlah Belanja</p>
          <p className="text-2xl font-bold">RM{totalExpense.toFixed(2)}</p>
        </div>
        <div className={`p-4 rounded border ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-100'}`}>
          <p className="text-gray-600">Untung / Rugi Bersih</p>
          <p className="text-2xl font-bold">RM{netProfit.toFixed(2)}</p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-2">Invois Terkini</h3>
        {invoiceData.length === 0 ? (
          <p>Tiada invois.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">No.</th>
                  <th className="text-left p-2 border">Tarikh</th>
                  <th className="text-left p-2 border">Jumlah</th>
                  <th className="text-left p-2 border">Baki</th>
                  <th className="text-left p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.map((inv) => (
                  <tr key={inv.id}>
                    <td className="p-2 border font-medium">{inv.invoice_number}</td>
                    <td className="p-2 border">{inv.invoice_date || '-'}</td>
                    <td className="p-2 border">RM{Number(inv.total_amount || 0).toFixed(2)}</td>
                    <td className="p-2 border">RM{Number(inv.balance_due || 0).toFixed(2)}</td>
                    <td className="p-2 border">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold mb-2">Belanja Terkini</h3>
        {expenseData.length === 0 ? (
          <p>Tiada belanja.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">No.</th>
                  <th className="text-left p-2 border">Tarikh</th>
                  <th className="text-left p-2 border">Kategori</th>
                  <th className="text-left p-2 border">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {expenseData.map((exp) => (
                  <tr key={exp.id}>
                    <td className="p-2 border font-medium">{exp.expense_number}</td>
                    <td className="p-2 border">{exp.expense_date || '-'}</td>
                    <td className="p-2 border">{exp.category}</td>
                    <td className="p-2 border">RM{Number(exp.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function PortalPage({ token, onClose }: { token: string; onClose: () => void }) {
  const [customer, setCustomer] = useState<any | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPortalData()
  }, [])

  async function fetchPortalData() {
    setLoading(true)
    setMessage('')
    try {
      const { data: custData, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('portal_token', token)
        .single()

      if (custError) throw new Error('Pautan tidak sah atau telah tamat.')
      setCustomer(custData)

      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', custData.id)
        .order('created_at', { ascending: false })

      if (invError) throw invError
      setInvoices(invData || [])

      const { data: payData, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', custData.id)
        .order('created_at', { ascending: false })

      if (payError) throw payError
      setPayments(payData || [])
    } catch (err: any) {
      setMessage(err.message || 'Gagal memuat portal')
    } finally {
      setLoading(false)
    }
  }

  const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p>Memuatkan portal...</p>
      </div>
    )
  }

  if (message) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-red-500 mb-4">{message}</p>
        <button onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded">
          Tutup
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded shadow space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Portal Pelanggan</h1>
            <button onClick={onClose} className="bg-gray-500 text-white px-3 py-1 rounded">
              Tutup
            </button>
          </div>

          <div className="bg-blue-50 p-4 rounded border">
            <h2 className="text-xl font-bold">{customer.full_name}</h2>
            <p className="text-gray-600">{customer.phone || ''}</p>
            <p className="text-gray-600">{customer.address || ''}</p>
          </div>

          <div className="bg-red-50 p-4 rounded border">
            <p className="text-gray-600">Jumlah Baki Hutang</p>
            <p className="text-3xl font-bold">RM{totalOutstanding.toFixed(2)}</p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Invois</h3>
            {invoices.length === 0 ? (
              <p>Tiada invois.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 border">No.</th>
                      <th className="text-left p-2 border">Tarikh</th>
                      <th className="text-left p-2 border">Jumlah</th>
                      <th className="text-left p-2 border">Dibayar</th>
                      <th className="text-left p-2 border">Baki</th>
                      <th className="text-left p-2 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="p-2 border font-medium">{inv.invoice_number}</td>
                        <td className="p-2 border">{inv.invoice_date || '-'}</td>
                        <td className="p-2 border">RM{Number(inv.total_amount || 0).toFixed(2)}</td>
                        <td className="p-2 border">RM{Number(inv.paid_amount || 0).toFixed(2)}</td>
                        <td className="p-2 border">RM{Number(inv.balance_due || 0).toFixed(2)}</td>
                        <td className="p-2 border">{inv.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Bayaran</h3>
            {payments.length === 0 ? (
              <p>Tiada bayaran direkod.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 border">No.</th>
                      <th className="text-left p-2 border">Tarikh</th>
                      <th className="text-left p-2 border">Kaedah</th>
                      <th className="text-left p-2 border">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2 border font-medium">{p.payment_number}</td>
                        <td className="p-2 border">{p.payment_date || '-'}</td>
                        <td className="p-2 border">{p.method}</td>
                        <td className="p-2 border">RM{Number(p.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default App