/**
 * API Service - Centralized HTTP client for FuelIoT Backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiService {
  constructor() {
    this.baseURL = API_URL
  }

  get token() {
    return localStorage.getItem('token')
  }

  get headers() {
    const h = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (this.token) {
      h['Authorization'] = `Bearer ${this.token}`
    }
    return h
  }

  async request(method, path, body = null, options = {}) {
    const url = path.startsWith('http') ? path : `${this.baseURL}${path}`

    const fetchOptions = {
      method,
      headers: this.headers,
      ...options,
    }

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, fetchOptions)

      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw new Error('Session expirée')
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null
      }

      const data = await response.json()

      // Handle error responses
      if (!response.ok) {
        const error = new Error(data.message || 'Une erreur est survenue')
        error.status = response.status
        error.errors = data.errors || {}
        throw error
      }

      return data
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion.')
      }
      throw error
    }
  }

  // HTTP Methods
  get(path, options) {
    return this.request('GET', path, null, options)
  }

  post(path, body, options) {
    return this.request('POST', path, body, options)
  }

  put(path, body, options) {
    return this.request('PUT', path, body, options)
  }

  patch(path, body, options) {
    return this.request('PATCH', path, body, options)
  }

  delete(path, options) {
    return this.request('DELETE', path, null, options)
  }
}

// Singleton instance
export const api = new ApiService()

// Auth API
export const authApi = {
  login: (email, password) => api.post('/v1/auth/login', { email, password }),
  register: (data) => api.post('/v1/auth/register', data),
  logout: () => api.post('/v1/auth/logout'),
  me: () => api.get('/v1/auth/me'),
}

// Stations API
export const stationsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/v1/stations${query ? '?' + query : ''}`)
  },
  getOne: (id) => api.get(`/v1/stations/${id}`),
  create: (data) => api.post('/v1/stations', data),
  update: (id, data) => api.put(`/v1/stations/${id}`, data),
  delete: (id) => api.delete(`/v1/stations/${id}`),
}

// Tanks API
export const tanksApi = {
  getByStation: (stationId) => api.get(`/v1/stations/${stationId}/tanks`),
  getOne: (id) => api.get(`/v1/tanks/${id}`),
  create: (stationId, data) => api.post(`/v1/stations/${stationId}/tanks`, data),
  update: (id, data) => api.put(`/v1/tanks/${id}`, data),
  delete: (id) => api.delete(`/v1/tanks/${id}`),
}

// Alerts API
export const alertsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/v1/alerts${query ? '?' + query : ''}`)
  },
  getOne: (id) => api.get(`/v1/alerts/${id}`),
  resolve: (id, notes) => api.put(`/v1/alerts/${id}/resolve`, { resolution_notes: notes }),
  delete: (id) => api.delete(`/v1/alerts/${id}`),
}

// Deliveries API
export const deliveriesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/v1/deliveries${query ? '?' + query : ''}`)
  },
  getOne: (id) => api.get(`/v1/deliveries/${id}`),
  create: (data) => api.post('/v1/deliveries', data),
  update: (id, data) => api.put(`/v1/deliveries/${id}`, data),
  delete: (id) => api.delete(`/v1/deliveries/${id}`),
  validate: (id) => api.put(`/v1/deliveries/${id}/validate`),
}

// Users API
export const usersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/v1/users${query ? '?' + query : ''}`)
  },
  getOne: (id) => api.get(`/v1/users/${id}`),
  create: (data) => api.post('/v1/users', data),
  update: (id, data) => api.put(`/v1/users/${id}`, data),
  delete: (id) => api.delete(`/v1/users/${id}`),
}

// Reports API
export const reportsApi = {
  consumption: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/v1/reports/consumption${query ? '?' + query : ''}`)
  },
  performance: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/v1/reports/performance${query ? '?' + query : ''}`)
  },
  peakHours: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/v1/reports/peak-hours${query ? '?' + query : ''}`)
  },
  fuelDistribution: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/v1/reports/fuel-distribution${query ? '?' + query : ''}`)
  },
  export: (data) => api.post('/v1/reports/export', data),
}

export default api
