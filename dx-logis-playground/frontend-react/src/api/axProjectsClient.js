import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' })

export const listAxProjects = () => api.get('/ax-projects/').then(r => r.data)
export const createAxProject = (body) => api.post('/ax-projects/', body).then(r => r.data)
export const updateAxProject = (id, body) => api.put(`/ax-projects/${id}`, body).then(r => r.data)
export const deleteAxProject = (id) => api.delete(`/ax-projects/${id}`).then(r => r.data)
