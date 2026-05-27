import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        if (!username.trim()) throw new Error('Username is required')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() } }
        })
        if (error) throw error
        if (data.user && !data.session) {
          setMessage('Check your email to confirm your account!')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>💬</div>
          <h1 style={styles.title}>ChatRoom</h1>
          <p style={styles.subtitle}>Talk with your friends in real time</p>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isLogin ? styles.activeTab : {}) }}
            onClick={() => { setIsLogin(true); setError(''); setMessage('') }}
          >
            Sign in
          </button>
          <button
            style={{ ...styles.tab, ...(!isLogin ? styles.activeTab : {}) }}
            onClick={() => { setIsLogin(false); setError(''); setMessage('') }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleAuth} style={styles.form}>
          {!isLogin && (
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {message && <div style={styles.success}>{message}</div>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f0f',
    padding: '1rem',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logo: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
  },
  title: {
    color: '#ffffff',
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: '0 0 0.25rem',
  },
  subtitle: {
    color: '#666',
    fontSize: '0.9rem',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    background: '#111',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '1.5rem',
  },
  tab: {
    flex: 1,
    padding: '0.5rem',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: '#666',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
  activeTab: {
    background: '#2a2a2a',
    color: '#ffffff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    color: '#888',
    fontSize: '0.85rem',
  },
  input: {
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '0.65rem 0.85rem',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    background: '#2a1515',
    border: '1px solid #5a2020',
    borderRadius: '8px',
    padding: '0.65rem 0.85rem',
    color: '#f87171',
    fontSize: '0.875rem',
  },
  success: {
    background: '#152a1e',
    border: '1px solid #205a38',
    borderRadius: '8px',
    padding: '0.65rem 0.85rem',
    color: '#4ade80',
    fontSize: '0.875rem',
  },
  button: {
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'background 0.2s',
  },
}