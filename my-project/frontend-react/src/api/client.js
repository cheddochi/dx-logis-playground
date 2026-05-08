import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ── Trade Data ──────────────────────────────────────────────
export const fetchTradeData = (params = {}) =>
  api.get('/trade/', { params }).then(r => r.data)

export const fetchAnnualSummary = () =>
  api.get('/trade/summary').then(r => r.data)

export const fetchSeasonalIndex = () =>
  api.get('/trade/seasonal-index').then(r => r.data)

// ── Predictions ─────────────────────────────────────────────
export const computePredictions = (body) =>
  api.post('/predictions/compute', body).then(r => r.data)

export const saveParams = (body) =>
  api.post('/predictions/save', body).then(r => r.data)

export const listSavedParams = () =>
  api.get('/predictions/saved').then(r => r.data)

export const loadSavedParams = (id) =>
  api.get(`/predictions/saved/${id}`).then(r => r.data)

// ── Reports ─────────────────────────────────────────────────
export const generateLocalReport = (prediction) =>
  api.post('/reports/local', { prediction }).then(r => r.data)

export const generateAiReport = (prediction, apiKey) =>
  api.post('/reports/ai', { prediction, api_key: apiKey }).then(r => r.data)
