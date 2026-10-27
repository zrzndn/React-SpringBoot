
import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = '/api/employees'

async function getErrorMessage(response) {
  const data = await response.json().catch(() => ({}))
  const fieldErrors = Object.values(data.fieldErrors ?? {})

  if (fieldErrors.length > 0) {
    return fieldErrors.join(', ')
  }

  return data.message || `Request failed (${response.status})`
}

function App() {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ name: '', department: '' })
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Load employee records from the Spring Boot API.
  useEffect(() => {
    let active = true

    async function loadEmployees() {
      try {
        const response = await fetch(API_URL)

        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const data = await response.json()

        if (active) {
          setEmployees(data)
          setError('')
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not connect to the backend.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadEmployees()

    return () => {
      active = false
    }
  }, [])

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return employees

    return employees.filter((employee) =>
      employee.name.toLowerCase().includes(query) ||
      employee.department.toLowerCase().includes(query) ||
      String(employee.id).includes(query)
    )
  }, [employees, search])

  const departmentCount = new Set(
    employees.map((employee) => employee.department)
  ).size

  function handleInputChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function resetForm() {
    setForm({ name: '', department: '' })
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setNotice('')

    const isEditing = editingId !== null
    const url = isEditing ? `${API_URL}/${editingId}` : API_URL

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          department: form.department.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      const savedEmployee = await response.json()

      if (isEditing) {
        setEmployees((current) =>
          current.map((employee) =>
            employee.id === savedEmployee.id
              ? savedEmployee
              : employee
          )
        )
        setNotice('Employee updated successfully.')
      } else {
        setEmployees((current) => [savedEmployee, ...current])
        setNotice('Employee created successfully.')
      }

      resetForm()
    } catch (err) {
      setError(err.message || 'Could not save the employee.')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(employee) {
    setEditingId(employee.id)
    setForm({
      name: employee.name,
      department: employee.department,
    })
    setError('')
    setNotice('')
  }

  async function handleDelete(employee) {
    const confirmed = window.confirm(
      `Delete ${employee.name}? This action cannot be undone.`
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      const response = await fetch(`${API_URL}/${employee.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      setEmployees((current) =>
        current.filter((item) => item.id !== employee.id)
      )

      if (editingId === employee.id) resetForm()

      setNotice('Employee deleted successfully.')
    } catch (err) {
      setError(err.message || 'Could not delete the employee.')
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="PeopleDesk home">
          <span className="brand-mark">P</span>
          <span>PeopleDesk</span>
        </a>
        <span className="environment-label">
          <span className="status-dot" />
          LOCAL DEVELOPMENT
        </span>
      </header>

      <section className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">PEOPLE OPERATIONS</p>
            <h1>Employee directory</h1>
            <p className="subtitle">
              Manage employee records from one place.
            </p>
          </div>

          <div className="heading-icon" aria-hidden="true">
            <span>♙</span>
          </div>
        </div>

        <section className="stats-grid" aria-label="Employee statistics">
          <article className="stat-card">
            <span className="stat-label">Total employees</span>
            <strong className="stat-value">{employees.length}</strong>
            <span className="stat-description">Employee records</span>
          </article>

          <article className="stat-card">
            <span className="stat-label">Departments</span>
            <strong className="stat-value">{departmentCount}</strong>
            <span className="stat-description">Distinct departments</span>
          </article>

          <article className="stat-card">
            <span className="stat-label">API status</span>
            <strong className="stat-value stat-status">
              {loading ? 'Checking' : error ? 'Error' : 'Available'}
            </strong>
            <span className="stat-description">
              {loading
                ? 'Connecting to backend'
                : error
                  ? 'Check the backend'
                  : 'Employee endpoint responded'}
            </span>
          </article>
        </section>

        {error && (
          <div className="alert alert-error" role="alert">
            <strong>Something went wrong.</strong> {error}
          </div>
        )}

        {notice && (
          <div className="alert alert-success" role="status">
            {notice}
          </div>
        )}

        <section className="workspace">
          <article className="panel employee-panel">
            <div className="panel-heading">
              <div>
                <h2>Employees</h2>
                <p>Browse and manage your team.</p>
              </div>
              <span className="count-badge">{employees.length}</span>
            </div>

            <div className="search-wrapper">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                className="search-input"
                type="search"
                placeholder="Search by name, department or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search employees"
              />
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>DEPARTMENT</th>
                    <th>ID</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="empty-state">
                        Loading employees...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-state">
                        {error
                          ? 'Employees could not be loaded.'
                          : search
                            ? 'No employees match your search.'
                            : 'No employees yet. Add your first employee.'}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <div className="employee-cell">
                            <span className="avatar">
                              {employee.name.trim().charAt(0).toUpperCase()}
                            </span>
                            <span className="employee-name">
                              {employee.name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="department-tag">
                            {employee.department}
                          </span>
                        </td>
                        <td className="id-cell">#{employee.id}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => handleEdit(employee)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-button delete-button"
                              type="button"
                              onClick={() => handleDelete(employee)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              Showing {filteredEmployees.length} of {employees.length} employees
            </div>
          </article>

          <aside className="panel form-panel">
            <div className="panel-heading">
              <div>
                <h2>{editingId !== null ? 'Edit employee' : 'Add employee'}</h2>
                <p>
                  {editingId !== null
                    ? 'Update the employee details.'
                    : 'Enter the employee details below.'}
                </p>
              </div>
              <span className="form-icon" aria-hidden="true">＋</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Ahmad Zubir"
                  value={form.name}
                  onChange={handleInputChange}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  placeholder="e.g. Technology"
                  value={form.department}
                  onChange={handleInputChange}
                  maxLength={100}
                  required
                />
              </div>

              <button className="primary-button" type="submit" disabled={saving}>
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Save changes'
                    : 'Create employee'}
              </button>

              {editingId !== null && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel editing
                </button>
              )}
            </form>

            <div className="form-note">
              <span className="note-symbol">i</span>
              <p>
                Changes are sent to the backend API and saved in the database.
              </p>
            </div>
          </aside>
        </section>

        <footer className="page-footer">
          <span>PeopleDesk · Employee Management</span>
          <span>React · Spring Boot · MySQL</span>
        </footer>
      </section>
    </main>
  )
}

export default App
