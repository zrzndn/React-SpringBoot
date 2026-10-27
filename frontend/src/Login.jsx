
import { useState } from 'react'
import './App.css'

function readCookie(name) {
  const entry = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`))

  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null
}

export default function Login({ onLogin, backendError = '' }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Get a CSRF cookie before submitting the login form.
      const csrfResponse = await fetch('/api/auth/csrf', {
        credentials: 'include',
      })

      if (!csrfResponse.ok) {
        throw new Error('Could not initialize secure login.')
      }

      const csrfToken = readCookie('XSRF-TOKEN')

      if (!csrfToken) {
        throw new Error(
          'Security token is missing. Refresh the page and try again.'
        )
      }

      // Spring Security formLogin expects form-encoded data.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-XSRF-TOKEN': csrfToken,
        },
        body: new URLSearchParams({ username, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Login failed. Check your credentials.')
      }

      // Spring Security clears the previous CSRF token on successful login.
      await fetch('/api/auth/csrf', { credentials: 'include' })

      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!userResponse.ok) {
        throw new Error('Signed in, but could not load your account.')
      }

      const user = await userResponse.json()
      setPassword('')
      onLogin(user)
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <a className="brand login-brand" href="/">
          <span className="brand-logo">P</span>
          <span>PeopleDesk</span>
        </a>

        <div className="login-heading">
          <p className="eyebrow">EMPLOYEE MANAGEMENT</p>
          <h1>Welcome back</h1>
          <p>Sign in to access your employee directory.</p>
        </div>

        {(error || backendError) && (
          <div className="feedback error-feedback" role="alert">
            {error || backendError}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button className="primary-button login-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="login-security">
          <span>♢</span>
          Protected by Spring Security
        </p>
      </section>
    </main>
  )
}
