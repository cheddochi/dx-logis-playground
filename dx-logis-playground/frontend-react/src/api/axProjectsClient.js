import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' })

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export const listAxProjects = () => api.get('/ax-projects/').then(r => r.data)
export const getAxProject = (id) => api.get(`/ax-projects/${id}`).then(r => r.data)
export const createAxProject = (body) => api.post('/ax-projects/', body).then(r => r.data)
export const uploadHtmlProject = (formData) =>
  api.post('/ax-projects/upload-html', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
export const updateAxProject = (id, body) => api.put(`/ax-projects/${id}`, body).then(r => r.data)
export const deleteAxProject = (id) => api.delete(`/ax-projects/${id}`).then(r => r.data)
