import { useEffect, useMemo, useState } from 'react'
import './App.css'

// API URL - use environment variable for production, fallback to /api proxy for local dev
const getApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_URL || ''
  if (baseUrl) return `${baseUrl}${path}`
  return path // Use proxy in dev
}

const fallbackCars = [
  {
    id: 1,
    make: 'BMW',
    model: 'Seria 3',
    year: 2022,
    price: 28900,
    mileage: 18000,
    fuel: 'Diesel',
    transmission: 'Automată',
    bodyType: 'Sedan',
    image: 'https://images.unsplash.com/photo-1549399542-7e15f1b79f3f?auto=format&fit=crop&w=1200&q=80',
    featured: true,
  },
  {
    id: 2,
    make: 'Audi',
    model: 'Q5',
    year: 2021,
    price: 33900,
    mileage: 22000,
    fuel: 'Hybrid',
    transmission: 'Automată',
    bodyType: 'SUV',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    featured: true,
  },
  {
    id: 3,
    make: 'Volkswagen',
    model: 'Golf',
    year: 2020,
    price: 17900,
    mileage: 41000,
    fuel: 'Benzină',
    transmission: 'Manuală',
    bodyType: 'Hatchback',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
    featured: false,
  },
  {
    id: 4,
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    price: 42900,
    mileage: 9000,
    fuel: 'Electric',
    transmission: 'Automată',
    bodyType: 'Sedan',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80',
    featured: true,
  },
]

function App() {
  const [status, setStatus] = useState('Încărcare...')
  const [cars, setCars] = useState([])
  const [query, setQuery] = useState('')
  const [fuel, setFuel] = useState('all')
  const [bodyType, setBodyType] = useState('all')
  const [mode, setMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem('veocars_token') || '')
  const [currentUser, setCurrentUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [adminMessage, setAdminMessage] = useState('')
  const [loadingAdmin, setLoadingAdmin] = useState(false)
  const [adminForm, setAdminForm] = useState({
    make: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    fuel: 'Benzină',
    transmission: 'Automată',
    bodyType: 'Sedan',
    image: '',
    featured: false,
  })
  const [editingCarId, setEditingCarId] = useState(null)
  const [selectedCarForView, setSelectedCarForView] = useState(null)

  useEffect(() => {
    fetch(getApiUrl('/api/health'))
      .then(res => res.json())
      .then(data => setStatus(data.message))
      .catch(() => setStatus('Eroare conectare'))

    fetch(getApiUrl('/api/cars'))
      .then((res) => res.json())
      .then((data) => setCars(data.items || fallbackCars))
      .catch(() => setCars(fallbackCars))

    if (token) {
      fetch(getApiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setCurrentUser(data.user || null))
        .catch(() => {
          setToken('')
          localStorage.removeItem('veocars_token')
        })
    }
  }, [token])

  const visibleCars = useMemo(() => {
    return cars.filter((car) => {
      const search = `${car.make} ${car.model} ${car.year}`.toLowerCase()
      const matchesQuery = !query || search.includes(query.toLowerCase())
      const matchesFuel = fuel === 'all' || car.fuel.toLowerCase() === fuel.toLowerCase()
      const matchesBodyType = bodyType === 'all' || car.bodyType.toLowerCase() === bodyType.toLowerCase()

      return matchesQuery && matchesFuel && matchesBodyType
    })
  }, [cars, query, fuel, bodyType])

  const featuredCars = visibleCars.filter((car) => car.featured)

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setLoadingAuth(true)
    setAuthError('')
    setAuthMessage('')

    try {
      const response = await fetch(getApiUrl(`/api/auth/${mode}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Autentificare eșuată')
      }

      localStorage.setItem('veocars_token', data.token)
      setToken(data.token)
      setCurrentUser(data.user)
      setAuthMessage(mode === 'login' ? 'Te-ai autentificat cu succes.' : 'Cont creat cu succes.')
      setForm({ name: '', email: '', password: '' })
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setLoadingAuth(false)
    }
  }

  const resetAdminForm = () => {
    setAdminForm({
      make: '',
      model: '',
      year: '',
      price: '',
      mileage: '',
      fuel: 'Benzină',
      transmission: 'Automată',
      bodyType: 'Sedan',
      image: '',
      featured: false,
    })
  }

  const handleStartEdit = (car) => {
    setEditingCarId(car._id)
    setAdminForm({
      make: car.make,
      model: car.model,
      year: String(car.year),
      price: String(car.price),
      mileage: String(car.mileage),
      fuel: car.fuel,
      transmission: car.transmission,
      bodyType: car.bodyType,
      image: car.image,
      featured: car.featured,
    })
  }

  const handleUpdateCar = async (event) => {
    event.preventDefault()
    if (!token || currentUser?.role !== 'admin' || !editingCarId) return

    setLoadingAdmin(true)
    setAdminMessage('')

    try {
      const response = await fetch(getApiUrl(`/api/admin/cars/${editingCarId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...adminForm,
          year: Number(adminForm.year),
          price: Number(adminForm.price),
          mileage: Number(adminForm.mileage),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Nu am putut actualiza mașina')
      }

      setAdminMessage('Mașina a fost actualizată cu succes.')
      setEditingCarId(null)
      const carsResponse = await fetch(getApiUrl('/api/cars'))
      const carsData = await carsResponse.json()
      setCars(carsData.items || fallbackCars)
      resetAdminForm()
    } catch (error) {
      setAdminMessage(error.message)
    } finally {
      setLoadingAdmin(false)
    }
  }

  const handleDeleteCar = async (carId) => {
    if (!token || currentUser?.role !== 'admin') return
    if (!confirm('Ești sigur că vrei să ștergi această mașină?')) return

    try {
      const response = await fetch(getApiUrl(`/api/admin/cars/${carId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Nu am putut șterge mașina')
      }

      setAdminMessage('Mașina a fost ștearsă.')
      const carsResponse = await fetch(getApiUrl('/api/cars'))
      const carsData = await carsResponse.json()
      setCars(carsData.items || fallbackCars)
    } catch (error) {
      setAdminMessage(error.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('veocars_token')
    setToken('')
    setCurrentUser(null)
  }

  const handleAdminChange = (event) => {
    const { name, value, type, checked } = event.target
    setAdminForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleAdminSubmit = async (event) => {
    event.preventDefault()
    if (!token || currentUser?.role !== 'admin') {
      return
    }

    setLoadingAdmin(true)
    setAdminMessage('')

    try {
      const response = await fetch(getApiUrl('/api/admin/cars'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...adminForm,
          year: Number(adminForm.year),
          price: Number(adminForm.price),
          mileage: Number(adminForm.mileage),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Nu am putut salva mașina')
      }

      setAdminMessage('Mașina a fost adăugată cu succes.')
      setAdminForm({
        make: '',
        model: '',
        year: '',
        price: '',
        mileage: '',
        fuel: 'Benzină',
        transmission: 'Automată',
        bodyType: 'Sedan',
        image: '',
        featured: false,
      })

      const carsResponse = await fetch(getApiUrl('/api/cars'))
      const carsData = await carsResponse.json()
      setCars(carsData.items || fallbackCars)
    } catch (error) {
      setAdminMessage(error.message)
    } finally {
      setLoadingAdmin(false)
    }
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero__content">
          <img src="/assets/wheels-rims-veo-banner.jpg" alt="Wheels Rims Veo" className="hero__logo" />
          <p className="eyebrow">Wheels Rims Veo</p>
          <h1>Wheels Rims Veo — găsești mașina potrivită rapid.</h1>
          <p className="hero__text">
            Explorează modele atent selectate, compară opțiuni și pregătește-te pentru un flux complet cu conturi de utilizator și panou de administrare.
          </p>

          <div className="hero__stats">
            <div>
              <strong>{cars.length}</strong>
              <span>mașini în ofertă</span>
            </div>
            <div>
              <strong>{featuredCars.length}</strong>
              <span>recomandate</span>
            </div>
            <div>
              <strong>{status === 'Server rula cu succes' ? 'Online' : 'Demo'}</strong>
              <span>status platformă</span>
            </div>
          </div>
        </div>

        <aside className="hero__panel">
          {currentUser ? (
            <>
              <p className="auth-chip">Salut, {currentUser.name}</p>
              <h2>Cont conectat</h2>
              <p className="auth-note">Rol: {currentUser.role}</p>
              <button className="auth-button" type="button" onClick={handleLogout}>Delogare</button>
            </>
          ) : (
            <>
              <div className="auth-switcher">
                <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
                <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                {mode === 'register' && (
                  <label>
                    Nume
                    <input name="name" type="text" value={form.name} onChange={handleInputChange} placeholder="Ex: Andrei Pop" />
                  </label>
                )}
                <label>
                  Email
                  <input name="email" type="email" value={form.email} onChange={handleInputChange} placeholder="email@exemplu.ro" />
                </label>
                <label>
                  Parolă
                  <input name="password" type="password" value={form.password} onChange={handleInputChange} placeholder="********" />
                </label>

                {authError && <p className="auth-error">{authError}</p>}
                {authMessage && <p className="auth-success">{authMessage}</p>}

                <button className="auth-button" type="submit" disabled={loadingAuth}>
                  {loadingAuth ? 'Se procesează...' : mode === 'login' ? 'Intră în cont' : 'Creează cont'}
                </button>
              </form>
            </>
          )}

          <div className="filter-card">
            <h3>Filtre rapide</h3>
            <label>
              Caută model sau an
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="BMW, 2023, SUV..."
              />
            </label>
            <label>
              Carburant
              <select value={fuel} onChange={(event) => setFuel(event.target.value)}>
                <option value="all">Toate</option>
                <option value="benzină">Benzină</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </label>
            <label>
              Caroserie
              <select value={bodyType} onChange={(event) => setBodyType(event.target.value)}>
                <option value="all">Toate</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
              </select>
            </label>
          </div>
        </aside>
      </header>

      <main className="content">
        <section className="section-heading">
          <div>
            <p className="eyebrow">Stoc actual</p>
            <h2>Mașini disponibile acum</h2>
          </div>
          <p>{visibleCars.length} rezultate găsite</p>
        </section>

        <section className="cars-grid">
          {visibleCars.map((car) => (
            <article className="car-card" key={car.id || car._id}>
              <img src={car.image} alt={`${car.make} ${car.model}`} />
              <div className="car-card__body">
                <div className="car-card__top">
                  <div>
                    <h3>
                      <button
                        type="button"
                        className="car-card__link"
                        onClick={() => setSelectedCarForView(car)}
                      >
                        {car.make} {car.model}
                      </button>
                    </h3>
                    <p>{car.year} · {car.bodyType}</p>
                  </div>
                  <strong>{car.price.toLocaleString('ro-RO')} €</strong>
                </div>
                <div className="car-meta">
                  <span>{car.fuel}</span>
                  <span>{car.transmission}</span>
                  <span>{car.mileage.toLocaleString('ro-RO')} km</span>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="info-band">
          <article>
            <h3>Autentificare și conturi</h3>
            <p>JWT, login, register și stocarea tokenului în browser sunt deja funcționale.</p>
          </article>
          <article>
            <h3>Administrare simplă</h3>
            <p>Panou pentru adăugare, editare și ștergere mașini din stoc.</p>
          </article>
          <article>
            <h3>Filtrare rapidă</h3>
            <p>Filtre pe model, combustibil, caroserie și an de fabricație.</p>
          </article>
        </section>

        {currentUser?.role === 'admin' && (
          <section className="admin-panel">
            <div className="section-heading admin-panel__heading">
              <div>
                <p className="eyebrow">Admin</p>
                <h2>Gestionare inventar</h2>
              </div>
              <p>{cars.length} mașini în bază</p>
            </div>

            <div className="admin-panel__grid">
              <form className="admin-form" onSubmit={editingCarId ? handleUpdateCar : handleAdminSubmit}>
                <h3>{editingCarId ? 'Editează mașina' : 'Adaugă mașină'}</h3>
                <div className="admin-form__grid">
                  <label>
                    Marcă
                    <input name="make" value={adminForm.make} onChange={handleAdminChange} placeholder="BMW" required />
                  </label>
                  <label>
                    Model
                    <input name="model" value={adminForm.model} onChange={handleAdminChange} placeholder="X5" required />
                  </label>
                  <label>
                    An
                    <input name="year" type="number" value={adminForm.year} onChange={handleAdminChange} placeholder="2024" required />
                  </label>
                  <label>
                    Preț
                    <input name="price" type="number" value={adminForm.price} onChange={handleAdminChange} placeholder="39900" required />
                  </label>
                  <label>
                    Kilometri
                    <input name="mileage" type="number" value={adminForm.mileage} onChange={handleAdminChange} placeholder="12000" required />
                  </label>
                  <label>
                    Carburant
                    <select name="fuel" value={adminForm.fuel} onChange={handleAdminChange}>
                      <option value="Benzină">Benzină</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </label>
                  <label>
                    Transmisie
                    <select name="transmission" value={adminForm.transmission} onChange={handleAdminChange}>
                      <option value="Automată">Automată</option>
                      <option value="Manuală">Manuală</option>
                    </select>
                  </label>
                  <label>
                    Caroserie
                    <select name="bodyType" value={adminForm.bodyType} onChange={handleAdminChange}>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Hatchback">Hatchback</option>
                    </select>
                  </label>
                  <label className="admin-form__wide">
                    Link imagine
                    <input name="image" value={adminForm.image} onChange={handleAdminChange} placeholder="https://..." required />
                  </label>
                  <label className="admin-form__checkbox">
                    <input name="featured" type="checkbox" checked={adminForm.featured} onChange={handleAdminChange} />
                    Recomandată
                  </label>
                </div>

                {adminMessage && <p className="auth-success">{adminMessage}</p>}
                <div className="admin-form__buttons">
                  <button className="auth-button" type="submit" disabled={loadingAdmin}>
                    {loadingAdmin ? 'Se salvează...' : editingCarId ? 'Actualizează mașina' : 'Salvează mașina'}
                  </button>
                  {editingCarId && (
                    <button
                      type="button"
                      className="auth-button admin-cancel"
                      onClick={() => {
                        setEditingCarId(null)
                        resetAdminForm()
                      }}
                    >
                      Anulează
                    </button>
                  )}
                </div>
              </form>

              <div className="admin-list">
                <h3>Inventar curent</h3>
                <div className="admin-list__items">
                  {cars.map((car) => (
                    <article key={car.id || car._id} className="admin-list__item">
                      <div className="admin-list__info">
                        <strong>{car.make} {car.model}</strong>
                        <span>{car.year} · {car.price.toLocaleString('ro-RO')} €</span>
                        <small>{car.bodyType} · {car.fuel}</small>
                      </div>
                      <div className="admin-list__actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn--edit"
                          onClick={() => handleStartEdit(car)}
                        >
                          Editează
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--delete"
                          onClick={() => handleDeleteCar(car._id)}
                        >
                          Șterge
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {selectedCarForView && (
        <div className="modal-overlay" onClick={() => setSelectedCarForView(null)}>
          <article className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelectedCarForView(null)}>✕</button>
            <img src={selectedCarForView.image} alt={`${selectedCarForView.make} ${selectedCarForView.model}`} className="modal-image" />
            <div className="modal-body">
              <div className="modal-header">
                <div>
                  <h2>{selectedCarForView.make} {selectedCarForView.model}</h2>
                  <p className="modal-year">{selectedCarForView.year}</p>
                </div>
                <strong className="modal-price">{selectedCarForView.price.toLocaleString('ro-RO')} €</strong>
              </div>

              <div className="modal-specs">
                <div className="modal-spec">
                  <strong>Carburant</strong>
                  <span>{selectedCarForView.fuel}</span>
                </div>
                <div className="modal-spec">
                  <strong>Transmisie</strong>
                  <span>{selectedCarForView.transmission}</span>
                </div>
                <div className="modal-spec">
                  <strong>Caroserie</strong>
                  <span>{selectedCarForView.bodyType}</span>
                </div>
                <div className="modal-spec">
                  <strong>Kilometraj</strong>
                  <span>{selectedCarForView.mileage.toLocaleString('ro-RO')} km</span>
                </div>
              </div>

              {selectedCarForView.featured && <p className="modal-featured">⭐ Recomandată</p>}

              <button type="button" className="modal-button" onClick={() => setSelectedCarForView(null)}>
                Închide
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  )
}

export default App
