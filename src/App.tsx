import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from './lib/supabaseClient'

type Page = 'dashboard' | 'customers' | 'projects'
type AuthMode = 'login' | 'register'

function App() {
  const [session, setSession] = useState<any>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activePage, setActivePage] = useState<Page>('dashboard')

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
            <button
              onClick={() => setActivePage('projects')}
              className={`px-3 py-1 rounded ${
                activePage === 'projects' ? 'bg-white text-blue-800' : 'text-white'
              }`}
            >
              Projek
            </button>
          </nav>
        </header>

        <main className="max-w-5xl mx-auto p-4">
          {activePage === 'dashboard' && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
              <p>Selamat datang ke HBCurtain ERP.</p>
              <p className="mt-2 text-gray-600">
                Pilih menu di atas untuk mula mengurus perniagaan anda.
              </p>
            </div>
          )}

          {activePage === 'customers' && <CustomersPage />}
          {activePage === 'projects' && <ProjectsPage />}
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

  const filteredCustomers = customers.filter((c) =>
    `${c.full_name} ${c.phone || ''} ${c.address || ''} ${c.company_name || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold">Senarai Pelanggan</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Cari nama, telefon, alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-64"
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
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Telefon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            placeholder="Alamat"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Nama Syarikat"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            placeholder="Nota"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-3 py-2"
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

  // Data lists for sub-levels
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
    <div className="bg-white p-6 rounded shadow space-y-4">
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
            className="w-full border rounded px-3 py-2"
          />
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
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
            className="w-full border rounded px-3 py-2"
          />
          <select
            value={projectStatus}
            onChange={(e) => setProjectStatus(e.target.value)}
            className="w-full border rounded px-3 py-2"
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
            className="w-full border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
              />
              <textarea
                placeholder="Nota"
                value={roomNotes}
                onChange={(e) => setRoomNotes(e.target.value)}
                className="w-full border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Jenis Tingkap (cth: Panel, Eyelet)"
                value={windowType}
                onChange={(e) => setWindowType(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <textarea
                placeholder="Nota"
                value={windowNotes}
                onChange={(e) => setWindowNotes(e.target.value)}
                className="w-full border rounded px-3 py-2"
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
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Tinggi (cm)"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Drop (cm)"
                  value={dropCm}
                  onChange={(e) => setDropCm(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Fullness Ratio"
                  value={fullnessRatio}
                  onChange={(e) => setFullnessRatio(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Lebar Kain (cm)"
                  value={fabricWidthCm}
                  onChange={(e) => setFabricWidthCm(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Pattern Repeat (cm)"
                  value={patternRepeatCm}
                  onChange={(e) => setPatternRepeatCm(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <textarea
                placeholder="Nota"
                value={measurementNotes}
                onChange={(e) => setMeasurementNotes(e.target.value)}
                className="w-full border rounded px-3 py-2"
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

export default App