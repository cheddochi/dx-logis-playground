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

// 신규 과제 등록 가이드 단계 정의
const GUIDE_STEPS = [
  {
    step: '1',
    title: 'DB에 과제 등록',
    color: '#1bc6c6',
    desc: '이 페이지의 "＋ 과제 등록" 버튼으로 과제를 추가합니다.',
    detail: [
      '과제명: 사람이 읽는 이름 (예: 전자상거래 수출입 예측 시스템)',
      'slug: URL에 사용되는 식별자 — 영문 소문자·숫자·하이픈(-) 만 가능 (예: ecommerce-prediction)',
      '슬러그를 기준으로 /ax/{slug} URL이 자동 생성됩니다.',
      '기본 상세 페이지로 충분하면 Step 2·3은 생략해도 됩니다.',
    ],
  },
  {
    step: '2',
    title: 'FE 커스텀 페이지 추가 (선택)',
    color: '#4a9eff',
    desc: '대시보드·차트 등 전용 UI가 필요할 때만 진행합니다.',
    detail: [
      '① src/ax_projects/_template/index.jsx를 복사해서',
      '   src/ax_projects/{slug}/index.jsx 로 저장',
      '② App.jsx 상단 import 블록에 추가:',
      '   import MyApp from \'./ax_projects/{slug}\'',
      '③ App.jsx 라우트 블록에 추가 (주석 안내 참고):',
      '   <Route path="/ax/{slug}/*" element={<MyApp />} />',
    ],
    code: true,
  },
  {
    step: '3',
    title: 'BE API 추가 (선택)',
    color: '#f6c90e',
    desc: '과제 전용 백엔드 API가 필요할 때만 진행합니다.',
    detail: [
      '① backend/routers/ 에 {slug}_router.py 생성',
      '   → 기존 ax_projects_router.py 참고하여 작성',
      '② backend/main.py 에 router 등록:',
      '   from routers.{slug}_router import router as {slug}_router',
      '   app.include_router({slug}_router, prefix="/api/{slug}", tags=["{slug}"])',
    ],
    code: true,
  },
]

export default function MainPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)

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
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="ax-btn-guide"
            onClick={() => setGuideOpen(o => !o)}
            title="신규 과제 등록 방법"
          >
            {guideOpen ? '✕ 가이드 닫기' : '📖 개발자 가이드'}
          </button>
          <button className="ax-btn-primary" onClick={openCreate}>＋ 과제 등록</button>
        </div>
      </header>

      {/* ── 개발자 가이드 패널 ── */}
      {guideOpen && (
        <div className="ax-guide-panel">
          <h3 className="ax-guide-title">신규 AX 과제 등록 방법</h3>
          <p className="ax-guide-subtitle">
            과제를 DB에 등록하면 목록과 기본 상세 페이지가 자동으로 생성됩니다.<br />
            전용 대시보드·API가 필요할 때만 Step 2·3을 진행하세요.
          </p>
          <div className="ax-guide-steps">
            {GUIDE_STEPS.map(s => (
              <div key={s.step} className="ax-guide-step">
                <div className="ax-guide-step-header">
                  <span className="ax-guide-step-num" style={{ background: s.color }}>{s.step}</span>
                  <div>
                    <div className="ax-guide-step-title">{s.title}</div>
                    <div className="ax-guide-step-desc">{s.desc}</div>
                  </div>
                </div>
                <ul className={s.code ? 'ax-guide-code' : 'ax-guide-list'}>
                  {s.detail.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="ax-guide-footer">
            💡 <strong>slug 규칙:</strong> 영문 소문자·숫자·하이픈(-) 만 사용 &nbsp;|&nbsp;
            📁 <strong>템플릿:</strong> <code>src/ax_projects/_template/index.jsx</code> 복사 후 사용 &nbsp;|&nbsp;
            🔀 <strong>라우트 순서:</strong> static route를 /ax/:slug 보다 반드시 위에 배치
          </div>
        </div>
      )}

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
