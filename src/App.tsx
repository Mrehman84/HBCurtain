import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
  const [status, setStatus] = useState('Checking...')

  useEffect(() => {
    supabase.auth.getSession().then(({ error }) => {
      if (error) {
        setStatus('Connection Error: ' + error.message)
      } else {
        setStatus('Supabase Connection OK')
      }
    })
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>HBCurtain ERP</h1>
      <p>Status: {status}</p>
    </div>
  )
}

export default App