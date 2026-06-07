import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listAxProjects, createAxProject, updateAxProject, deleteAxProject } from '../api/axProjectsClient'
import '../styles/ax-main.css'

const emptyForm = { name: '', slug: '', description: '', developer: '' }
const ICONS = ['🤖', '📊', '🔮', '🧠', '⚡', '🎯', '💡', '🚀', '📈', '🛰️']

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fmt(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
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
      .catch(() => setError('프로젝트 불러오기에 실패했습니다.'))
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
    if (!form.name.trim()) { setError('과제명을 입력하세요.'); return }
    if (!form.slug.trim()) { setError('슬러그를 입력하세요.'); return }
    setSaving(true)
    setError('')
    try {
      if (editTarget) {
        await updateAxProject(editTarget.id, form)
      } else {
        await createAxProject(form)
      }
      closeModal()
      load()
    } catch (err) {
      setError(err.message || '저장에 실패했습니다.')
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
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="ax-wrap">
      <header className="ax-gnb">
        <a href="/" className="ax-gnb-logo">
          <span className="ax-gnb-badge">AX</span>
          AI Transformation
        </a>
        <div className="ax-gnb-spacer" />
        <button className="ax-gnb-btn" onClick={openCreate}>+ 과제 등록</button>
      </header>

      <div className="ax-body">
        <aside className="ax-sidebar">
          <div className="ax-sidebar-title">AX 과제</div>
          <ul className="ax-sidebar-nav">
            {projects.map((p) => (
              <li key={p.id}>
                <Link to={`/ax/${p.slug}`}>{p.name}</Link>
              </li>
            ))}
          </ul>
        </aside>

        <main className="ax-main">
          <div className="ax-page-head">
            <h1>AX 과제 관리<span className="ax-count-badge">{projects.length}개</span></h1>
            <p>AI Transformation 과제를 등록하고 관리합니다.</p>
          </div>

          {loading && <p className="ax-loading">불러오는 중...</p>}

          {!loading && (
            <div className="ax-grid">
              {projects.map((p, i) => (
                <div className="ax-card" key={p.id}>
                  <div className="ax-card-icon">{ICONS[i % ICONS.length]}</div>
                  <Link to={`/ax/${p.slug}`} className="ax-card-name">{p.name}</Link>
                  <p className="ax-card-desc">{p.description || '과제 설명이 없습니다.'}</p>
                  <div className="ax-card-meta">
                    <span className="ax-card-developer">{p.developer || '-'}</span>
                    <span className="ax-card-date">{fmt(p.created_at)}</span>
                  </div>
                  <div className="ax-card-actions">
                    <button className="ax-btn-sm" onClick={() => openEdit(p)}>수정</button>
                    <button className="ax-btn-sm danger" onClick={() => handleDelete(p)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {modalOpen && (
        <div className="ax-modal-overlay" onClick={closeModal}>
          <div className="ax-modal" onClick={e => e.stopPropagation()}>
            <div className="ax-modal-header">
              <h2>{editTarget ? '과제 수정' : '과제 등록'}</h2>
              <button className="ax-modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ax-form-group">
                <label>과제명 *</label>
                <input type="text" value={form.name} onChange={handleNameChange} placeholder="예: 이커머스 수요 예측" required />
              </div>
              <div className="ax-form-group">
                <label>슬러그 *</label>
                <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="예: ecommerce-prediction" required />
              </div>
              <div className="ax-form-group">
                <label>설명</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="과제에 대한 간략한 설명" rows={3} />
              </div>
              <div className="ax-form-group">
                <label>담당자</label>
                <input type="text" value={form.developer} onChange={e => setForm(f => ({ ...f, developer: e.target.value }))} placeholder="예: 홍길동" />
              </div>
              {error && <p className="ax-error">{error}</p>}
              <div className="ax-modal-footer">
                <button type="button" className="ax-btn-cancel" onClick={closeModal}>취소</button>
                <button type="submit" className="ax-btn-save" disabled={saving}>
                  {saving ? '저장 중...' : (editTarget ? '수정 완료' : '등록')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
