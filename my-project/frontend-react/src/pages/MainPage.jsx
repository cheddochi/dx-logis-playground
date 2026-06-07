import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listAxProjects, createAxProject, updateAxProject, deleteAxProject } from '../api/axProjectsClient'
import '../styles/ax-main.css'

const emptyForm = { name: '', slug: '', description: '', developer: '' }

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function MainPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    listAxProjects()
      .then(setProjects)
      .catch(() => setError('목록을 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditTarget(p)
    setForm({ name: p.name, slug: p.slug, description: p.description || '', developer: p.developer || '' })
    setError('')
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setError('') }

  const handleNameChange = (e) => {
    const name = e.target.value
    setForm(f => ({ ...f, name, slug: editTarget ? f.slug : toSlug(name) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) { setError('과제명과 슬러그는 필수입니다.'); return }
    setSaving(true)
    try {
      if (editTarget) {
        await updateAxProject(editTarget.id, form)
      } else {
        await createAxProject(form)
      }
      closeModal()
      load()
    } catch (err) {
      setError(err.response?.data?.detail || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`"${p.name}" 과제를 삭제하시겠습니까?`)) return
    try {
      await deleteAxProject(p.id)
      load()
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  const fmt = (iso) => iso ? new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '-'

  return (
    <div className="ax-container">
      <header className="ax-header">
        <div className="ax-header-title">
          <span className="ax-badge">AX</span>
          AX 과제 관리 시스템
        </div>
        <button className="ax-btn-primary" onClick={openCreate}>+ 과제 등록</button>
      </header>

      {error && <div className="ax-error">{error}</div>}

      {loading ? (
        <div className="ax-loading">불러오는 중...</div>
      ) : (
        <div className="ax-table-wrap">
          <table className="ax-table">
            <thead>
              <tr>
                <th>과제명</th>
                <th>과제설명</th>
                <th>개발자</th>
                <th>등록일시</th>
                <th>업데이트일시</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#8b949e' }}>등록된 과제가 없습니다.</td></tr>
              ) : projects.map(p => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/ax/${p.slug}`} className="ax-link">{p.name}</Link>
                  </td>
                  <td className="ax-desc">{p.description || '-'}</td>
                  <td>{p.developer || '-'}</td>
                  <td>{fmt(p.created_at)}</td>
                  <td>{fmt(p.updated_at)}</td>
                  <td className="ax-actions">
                    <button className="ax-btn-sm" onClick={() => openEdit(p)}>수정</button>
                    <button className="ax-btn-sm ax-btn-danger" onClick={() => handleDelete(p)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="ax-modal-overlay" onClick={closeModal}>
          <div className="ax-modal" onClick={e => e.stopPropagation()}>
            <h2>{editTarget ? '과제 수정' : '과제 등록'}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                과제명 *
                <input value={form.name} onChange={handleNameChange} placeholder="전자상거래 수출입 예측 시스템" required />
              </label>
              <label>
                슬러그 * <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>(URL 경로: /ax/슬러그)</span>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="ecommerce-prediction" required />
              </label>
              <label>
                과제설명
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="과제에 대한 간단한 설명" />
              </label>
              <label>
                개발자
                <input value={form.developer} onChange={e => setForm(f => ({ ...f, developer: e.target.value }))} placeholder="홍길동" />
              </label>
              {error && <div className="ax-error">{error}</div>}
              <div className="ax-modal-footer">
                <button type="button" className="ax-btn-sm" onClick={closeModal}>취소</button>
                <button type="submit" className="ax-btn-primary" disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
