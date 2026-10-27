
import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = '/api/employees'

function readCookie(name) {
  const entry = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`))

  return entry
    ? decodeURIComponent(entry.slice(name.length + 1))
    : null
}

async function getResponseError(response) {
  const data = await response.clone().json().catch(() => ({}))
  const fieldErrors = Object.values(data.fieldErrors ?? {})

  if (fieldErrors.length) {
    return fieldErrors.join(', ')
  }

  if (data.message) {
    return data.message
  }

  if (response.status === 403) {
    return 'Forbidden. Check the CSRF token and your account permissions.'
  }

  return `Request failed with status ${response.status}`
}

async function getCsrfHeaders() {
  const response = await fetch('/api/auth/csrf', {
    credentials: 'include',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Could not initialize security. Refresh and try again.')
  }

  const token = readCookie('XSRF-TOKEN')

  if (!token) {
    throw new Error(
      'CSRF cookie is missing. Check the backend CSRF configuration.'
    )
  }

  return { 'X-XSRF-TOKEN': token }
}

function LoginPage({ onLogin, backendError }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const csrfHeaders = await getCsrfHeaders()

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...csrfHeaders,
        },
        body: new URLSearchParams({ username, password }),
      })

      if (!response.ok) {
        throw new Error(await getResponseError(response))
      }

      // Login clears the previous CSRF token. Obtain a fresh one.
      await getCsrfHeaders()

      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!userResponse.ok) {
        throw new Error('Login succeeded, but the session could not be read.')
      }

      const user = await userResponse.json()
      setPassword('')
      onLogin(user)
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setSubmitting(false)
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
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            className="primary-button login-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
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

function App() {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ name: '', department: '' })
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiOnline, setApiOnline] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Initialize CSRF and discover whether a session already exists.
  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        await getCsrfHeaders()

        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.status === 401) {
          if (!cancelled) {
            setAuthenticated(false)
            setCurrentUser(null)
            setApiOnline(true)
            setError('')
          }
          return
        }

        if (!response.ok) {
          throw new Error(`Session check failed (${response.status}).`)
        }

        const user = await response.json()

        if (!cancelled) {
          setCurrentUser(user)
          setAuthenticated(true)
          setApiOnline(true)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setApiOnline(false)
          setError(err.message || 'Cannot reach the backend.')
        }
      } finally {
        if (!cancelled) {
          setAuthChecking(false)
        }
      }
    }

    void checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  // Only request employee records after authentication succeeds.
  useEffect(() => {
    let cancelled = false

  if (!authenticated) {
  return () => {
    cancelled = true
  }
}

    async function loadEmployees() {
      setLoading(true)

      try {
        const response = await fetch(API_URL, {
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.status === 401) {
          if (!cancelled) {
            setAuthenticated(false)
            setCurrentUser(null)
          }
          return
        }

        if (!response.ok) {
          throw new Error(await getResponseError(response))
        }

        const data = await response.json()

        if (!cancelled) {
          setEmployees(data)
          setApiOnline(true)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setApiOnline(false)
          setError(err.message || 'Unable to load employees.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadEmployees()

    return () => {
      cancelled = true
    }
  }, [authenticated])

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return employees

    return employees.filter((employee) =>
      [
        employee.name,
        employee.department,
        String(employee.id),
      ].some((value) => value.toLowerCase().includes(query))
    )
  }, [employees, search])

  const departmentCount = new Set(
    employees.map((employee) => employee.department)
  ).size

  const canManage = currentUser?.roles?.some(
    (role) => role === 'ROLE_ADMIN' || role === 'ADMIN'
  ) ?? false

  function resetForm() {
    setForm({ name: '', department: '' })
    setEditingId(null)
  }

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!form.name.trim() || !form.department.trim()) {
      setError('Please enter a name and department.')
      return
    }

    setSaving(true)

    const editing = editingId !== null

    try {
      // Every state-changing request sends a current CSRF token.
      const csrfHeaders = await getCsrfHeaders()

      const response = await fetch(
        editing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editing ? 'PUT' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            department: form.department.trim(),
          }),
        }
      )

      if (response.status === 401) {
        setAuthenticated(false)
        setCurrentUser(null)
        throw new Error('Your session has expired. Please sign in again.')
      }

      if (!response.ok) {
        throw new Error(await getResponseError(response))
      }

      const employee = await response.json()

      if (editing) {
        setEmployees((current) =>
          current.map((item) =>
            item.id === employee.id ? employee : item
          )
        )
        setNotice('Employee updated successfully.')
      } else {
        setEmployees((current) => [employee, ...current])
        setNotice('Employee created successfully.')
      }

      resetForm()
      setApiOnline(true)
    } catch (err) {
      setError(err.message || 'Unable to save employee.')
    } finally {
      setSaving(false)
    }
  }

  function startEditing(employee) {
    setEditingId(employee.id)
    setForm({
      name: employee.name,
      department: employee.department,
    })
    setError('')
    setNotice('')
  }

  async function deleteEmployee(employee) {
    if (!window.confirm(`Delete ${employee.name}?`)) return

    setError('')
    setNotice('')

    try {
      const csrfHeaders = await getCsrfHeaders()

      const response = await fetch(`${API_URL}/${employee.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: csrfHeaders,
      })

      if (response.status === 401) {
        setAuthenticated(false)
        setCurrentUser(null)
        throw new Error('Your session has expired. Please sign in again.')
      }

      if (!response.ok) {
        throw new Error(await getResponseError(response))
      }

      setEmployees((current) =>
        current.filter((item) => item.id !== employee.id)
      )

      if (editingId === employee.id) {
        resetForm()
      }

      setNotice('Employee deleted successfully.')
    } catch (err) {
      setError(err.message || 'Unable to delete employee.')
    }
  }

  async function handleLogout() {
    setError('')
    setNotice('')

    try {
      const csrfHeaders = await getCsrfHeaders()

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders,
      })

      if (!response.ok) {
        throw new Error(await getResponseError(response))
      }

      setAuthenticated(false)
      setCurrentUser(null)
      setEmployees([])
      setSearch('')
      resetForm()
    } catch (err) {
      setError(err.message || 'Unable to sign out.')
    }
  }

  if (authChecking) {
    return (
      <main className="auth-loading">
        Checking your session...
      </main>
    )
  }

  if (!authenticated) {
    return (
      <LoginPage
        onLogin={(user) => {
          setCurrentUser(user)
          setAuthenticated(true)
          setApiOnline(true)
          setError('')
          setNotice('')
        }}
        backendError={!apiOnline ? error : ''}
      />
    )
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-logo">P</span>
          <span>PeopleDesk</span>
        </a>

        <p className="nav-label">WORKSPACE</p>

        <div className="nav-item active">
          <span>▦</span>
          Employee directory
        </div>

        <div className="sidebar-bottom">
          <span className={`connection-dot ${apiOnline ? 'online' : ''}`} />
          <div>
            <strong>{apiOnline ? 'API connected' : 'API unavailable'}</strong>
            <small>Local development</small>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <span className="breadcrumb">Workspace / Employees</span>

          <div className="topbar-actions">
            <span className="environment-pill">DEVELOPMENT</span>
            <span className="logged-in-user">
              {currentUser?.username || 'User'}
            </span>
            <button
              className="logout-button"
              type="button"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">PEOPLE OPERATIONS</p>
              <h1>Employee directory</h1>
              <p className="page-subtitle">
                Manage your employee records in one place.
              </p>
            </div>

            {canManage && (
              <button
                className="primary-button heading-button"
                type="button"
                onClick={() => {
                  resetForm()
                  setError('')
                  setNotice('')
                  document.getElementById('employee-name')?.focus()
                }}
              >
                <span>＋</span> Add employee
              </button>
            )}
          </section>

          {error && (
            <div className="feedback error-feedback" role="alert">
              <strong>Something went wrong</strong>
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="feedback success-feedback" role="status">
              {notice}
            </div>
          )}

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span>Total employees</span>
                <span className="stat-icon purple">♙</span>
              </div>
              <strong>{employees.length}</strong>
              <small>Stored employee records</small>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Departments</span>
                <span className="stat-icon blue">▤</span>
              </div>
              <strong>{departmentCount}</strong>
              <small>Distinct departments</small>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Backend status</span>
                <span className="stat-icon green">⌁</span>
              </div>
              <strong className={`status-value ${apiOnline ? 'connected' : ''}`}>
                {loading ? 'Checking' : apiOnline ? 'Connected' : 'Offline'}
              </strong>
              <small>Spring Boot API</small>
            </article>
          </section>

          <section className="content-grid">
            <article className="panel directory-panel">
              <div className="panel-heading">
                <div>
                  <h2>All employees</h2>
                  <p>View and manage your team members.</p>
                </div>
                <span className="record-count">
                  {employees.length} records
                </span>
              </div>

              <div className="table-toolbar">
                <div className="search-box">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    placeholder="Search name, department or ID..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search employees"
                  />
                </div>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th>
                      <th>DEPARTMENT</th>
                      <th>ID</th>
                      {canManage && <th>ACTIONS</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={canManage ? 4 : 3}
                          className="empty-state"
                        >
                          Loading employee records...
                        </td>
                      </tr>
                    ) : filteredEmployees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canManage ? 4 : 3}
                          className="empty-state"
                        >
                          {error
                            ? 'Could not load employees. Check the API.'
                            : search
                              ? 'No matching employees found.'
                              : 'No employees yet. Add your first record.'}
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <tr key={employee.id}>
                          <td>
                            <div className="employee-info">
                              <span className="avatar">
                                {employee.name.trim().charAt(0).toUpperCase()}
                              </span>
                              <span className="employee-name">
                                {employee.name}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="department-badge">
                              {employee.department}
                            </span>
                          </td>
                          <td className="employee-id">#{employee.id}</td>

                          {canManage && (
                            <td>
                              <div className="actions">
                                <button
                                  className="action-button"
                                  type="button"
                                  onClick={() => startEditing(employee)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="action-button delete-action"
                                  type="button"
                                  onClick={() => deleteEmployee(employee)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="panel-footer">
                Showing {filteredEmployees.length} of {employees.length} records
              </div>
            </article>

            {canManage && (
              <aside className="panel form-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{editingId === null ? 'New employee' : 'Edit employee'}</h2>
                    <p>
                      {editingId === null
                        ? 'Add a record to your directory.'
                        : `Editing employee #${editingId}`}
                    </p>
                  </div>
                  <span className="form-symbol">
                    {editingId === null ? '+' : '✎'}
                  </span>
                </div>

                <form className="employee-form" onSubmit={handleSubmit}>
                  <div className="form-field">
                    <label htmlFor="employee-name">Full name</label>
                    <input
                      id="employee-name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Ahmad Zubir"
                      maxLength={100}
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="employee-department">Department</label>
                    <input
                      id="employee-department"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      placeholder="e.g. Technology"
                      maxLength={100}
                      required
                    />
                  </div>

                  <button
                    className="primary-button submit-button"
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : editingId === null
                        ? 'Create employee'
                        : 'Save changes'}
                  </button>

                  {editingId !== null && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetForm}
                    >
                      Cancel editing
                    </button>
                  )}
                </form>

                <div className="form-hint">
                  <span>i</span>
                  <p>Employee records are saved through the API to MySQL.</p>
                </div>
              </aside>
            )}
          </section>

          <footer className="page-footer">
            <span>PeopleDesk · Employee Management</span>
            <span>React · Spring Boot · MySQL</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
