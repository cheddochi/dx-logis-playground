import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  listAxProjects,
  createAxProject,
  updateAxProject,
  deleteAxProject,
  uploadHtmlProject,
  API_BASE,
} from '../api/axProjectsClient'
import '../styles/ax-main.css'

const emptyForm = { name: '', slug: '', description: '', developer: '' }

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsText(file, 'utf-8')
  })
}

const GUIDE_STEPS = [
  {
    step: '1',
    title: '과제 정보 등록',
    color: '#1bc6c6',
    badge: '필수',
    desc: '코딩 없이 UI에서 클릭만으로 등록합니다.',
    items: [
      { type: 'normal', text: '"＋ 과제 등록" 버튼 클릭 → 과제명 입력' },
      { type: 'tip',    text: '과제명을 입력하면 슬러그(URL 주소)가 자동으로 만들어져요' },
      { type: 'normal', text: '저장하면 /ax/{슬러그} 주소와 기본 상세 페이지가 즉시 생성됩니다' },
      { type: 'tip',    text: 'React 앱은 vite-plugin-singlefile로 빌드한 단일 index.html을 함께 첨부하면 GitHub/Jenkins 없이 /ax/{슬러그}에서 바로 그 화면이 보여요 (라우팅은 HashRouter 권장)' },
      { type: 'done',   text: '전용 대시보드가 필요 없다면 여기서 끝! 2·3·4단계 건너뛰기 OK' },
    ],
  },
  {
    step: '2',
    title: 'AI로 페이지 코드 생성',
    color: '#5B8DEF',
    badge: '선택',
    desc: 'Claude나 Cursor에게 페이지를 만들어달라고 하면 됩니다.',
    items: [
      { type: 'normal', text: '_template/index.jsx 파일을 AI 채팅에 첨부하고 이렇게 요청:' },
      { type: 'prompt', text: '"이 템플릿 참고해서 [과제명] 페이지 만들어줘. slug는 [슬러그]야."' },
      { type: 'normal', text: 'AI가 만들어준 코드를 전체 복사해 두세요.' },
    ],
  },
  {
    step: '3',
    title: '사내 GitHub에 파일 올리기',
    color: '#9775FA',
    badge: '선택',
    desc: '사내 GitHub Enterprise에서 파일을 만들고 코드를 붙여넣으면 끝!',
    items: [
      { type: 'normal', text: 'logis-playground-Frontend 리포지터리 → src/ax_projects/ 폴더 진입' },
      { type: 'normal', text: '"Add file" → "Create new file" 클릭' },
      { type: 'tip',    text: '파일명에 {슬러그}/index.jsx 입력 (예: my-project/index.jsx)' },
      { type: 'normal', text: '2단계 코드 붙여넣기 → development 브랜치로 "Commit changes" 클릭' },
    ],
  },
  {
    step: '4',
    title: '라우트 연결 → Jenkins 배포',
    color: '#F59E0B',
    badge: '선택',
    desc: 'App.jsx 수정 후 Jenkins에서 배포를 실행하면 SCP에 반영됩니다.',
    items: [
      { type: 'normal', text: 'logis-playground-Frontend 리포지터리에서 src/App.jsx 파일 열기' },
      { type: 'prompt', text: '"App.jsx에서 [슬러그] 라우트 추가해줘. 주석 가이드 보고 따라해."' },
      { type: 'normal', text: 'development 브랜치로 Commit → Jenkins 접속 → 프론트엔드 인스턴스 선택' },
      { type: 'done',   text: 'Jenkins에서 Deployment 실행 → 빌드 & 배포 완료!' },
    ],
  },
]

export default function MainPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('advanced')
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [htmlFile, setHtmlFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)
  const fileInputRef = useRef(null)

  const load = () => {
    setLoading(true)
    listAxProjects()
      .then(setProjects)
      .catch(() => setError('목록을 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = (mode) => {
    setEditTarget(null)
    setModalMode(mode)
    setForm(emptyForm)
    setHtmlFile(null)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditTarget(p)
    setModalMode(p.task_type || 'advanced')
    setForm({ name: p.name, slug: p.slug, description: p.description || '', developer: p.developer || '' })
    setHtmlFile(null)
    setError('')
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setError('') }

  const handleNameChange = (e) => {
    const name = e.target.value
    setForm(f => ({ ...f, name, slug: editTarget ? f.slug : toSlug(name) }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.html')) {
      setError('HTML(.html) 파일만 업로드 가능합니다.')
      e.target.value = ''
      return
    }
    setError('')
    setHtmlFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (editTarget) {
      if (!form.name.trim() || !form.slug.trim()) { setError('과제명과 슬러그는 필수입니다.'); return }
      setSaving(true)
      try {
        await updateAxProject(editTarget.id, { name: form.name, slug: form.slug, description: form.description, developer: form.developer })
        closeModal()
        load()
      } catch (err) {
        setError(err.response?.data?.detail || '저장에 실패했습니다.')
      } finally { setSaving(false) }
      return
    }

    if (modalMode === 'advanced') {
      if (!form.name.trim() || !form.slug.trim()) { setError('과제명과 슬러그는 필수입니다.'); return }
      setSaving(true)
      try {
        const payload = { ...form }
        if (htmlFile) {
          payload.html_content = await readFileAsText(htmlFile)
          payload.html_filename = htmlFile.name
        }
        await createAxProject(payload)
        closeModal()
        load()
      } catch (err) {
        const s = err.response?.status
        setError(err.response?.data?.detail || `저장에 실패했습니다. (${s ?? 'Network Error'})`)
      } finally { setSaving(false) }
    } else {
      if (!form.name.trim()) { setError('과제명은 필수입니다.'); return }
      if (!htmlFile) { setError('HTML 파일을 첨부해주세요.'); return }
      setSaving(true)
      try {
        const htmlContent = await readFileAsText(htmlFile)
        await uploadHtmlProject({
          name: form.name,
          html_content: htmlContent,
          html_filename: htmlFile.name,
          developer: form.developer || null,
          description: form.description || null,
        })
        closeModal()
        load()
      } catch (err) {
        const s = err.response?.status
        setError(err.response?.data?.detail || `저장에 실패했습니다. (HTTP ${s ?? 'Network Error'})`)
      } finally { setSaving(false) }
    }
  }

  const handleDelete = async (p) => {
    if (!window.confirm('"' + p.name + '" 과제를 삭제하시겠습니까?')) return
    try {
      await deleteAxProject(p.id)
      load()
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  const fmt = (iso) => iso ? new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '-'
  const isSimple = (p) => p.task_type === 'simple'

  return (
    <div className="ax-container">
      <header className="ax-header">
        <div className="ax-header-title">
          <span className="ax-badge">AX</span>
          AX 과제 관리 시스템
        </div>
        <div className="ax-header-actions">
          <button className="ax-btn-outline" onClick={() => setGuideOpen(o => !o)}>
            {guideOpen ? '✕ 닫기' : '💡 과제 추가 방법'}
          </button>
          <button className="ax-btn-simple" onClick={() => openCreate('simple')}>
            📄 간단 등록
          </button>
          <button className="ax-btn-primary" onClick={() => openCreate('advanced')}>＋ 과제 등록</button>
        </div>
      </header>

      {guideOpen && (
        <div className="ax-guide-panel">
          <div className="ax-guide-header">
            <h3 className="ax-guide-title">새 과제 페이지 추가하는 방법</h3>
            <p className="ax-guide-subtitle">
              <strong>📄 간단 등록</strong>: HTML 파일 한 장을 업로드하면 즉시 과제 페이지가 생성됩니다.<br />
              <strong>＋ 과제 등록 (고급)</strong>: 과제 정보를 등록하고, AI 바이브 코딩으로 만든 React 앱을 HTML 파일로 함께 업로드하면 즉시 페이지가 생성됩니다. 메인 화면과 디자인·내비게이션을 공유해야 한다면 사내 GitHub → Jenkins 배포로 연결하는 2~4단계를 진행하세요.
            </p>
          </div>
          <div className="ax-guide-steps">
            {GUIDE_STEPS.map(s => (
              <div key={s.step} className="ax-guide-step">
                <div className="ax-guide-step-top">
                  <span className="ax-guide-step-num" style={{ background: s.color }}>{s.step}</span>
                  <span className={`ax-guide-badge ${s.badge === '필수' ? 'ax-guide-badge--required' : 'ax-guide-badge--optional'}`}>
                    {s.badge}
                  </span>
                </div>
                <div className="ax-guide-step-title">{s.title}</div>
                <div className="ax-guide-step-desc">{s.desc}</div>
                <ul className="ax-guide-items">
                  {s.items.map((item, i) => (
                    <li key={i} className={`ax-guide-item ax-guide-item--${item.type}`}>
                      {item.type === 'prompt' && <span className="ax-guide-item-label">AI 요청문</span>}
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="ax-guide-footer">
            📁 템플릿 파일: <code>src/ax_projects/_template/index.jsx</code> &nbsp;|&nbsp;
            🔀 라우트 순서: static route를 <code>/ax/:slug</code> 보다 반드시 위에 배치 &nbsp;|&nbsp;
            🌿 대상 브랜치: <code>development</code> → Jenkins Deployment 실행
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
                <th>종류</th>
                <th>과제설명</th>
                <th>개발자</th>
                <th>등록일시</th>
                <th>업데이트일시</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={7} className="ax-table-empty">등록된 과제가 없습니다.</td></tr>
              ) : projects.map(p => (
                <tr key={p.id}>
                  <td>
                    {isSimple(p)
                      ? <Link to={`/ax-html/${p.id}`} className="ax-link">{p.name}</Link>
                      : <Link to={`/ax/${p.slug}`} className="ax-link">{p.name}</Link>
                    }
                  </td>
                  <td>
                    {isSimple(p)
                      ? <span className="ax-type-badge ax-type-badge--simple">간단</span>
                      : <span className="ax-type-badge ax-type-badge--advanced">고급</span>
                    }
                  </td>
                  <td className="ax-desc">{p.description || '-'}</td>
                  <td>{p.developer || '-'}</td>
                  <td>{fmt(p.created_at)}</td>
                  <td>{fmt(p.updated_at)}</td>
                  <td className="ax-actions">
                    {p.html_filename && (
                      <a className="ax-btn-sm" href={`${API_BASE}/ax-projects/${p.id}/html`} target="_blank" rel="noopener noreferrer">
                        새 탭에서 보기
                      </a>
                    )}
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
            <h2>
              {editTarget
                ? '과제 수정'
                : modalMode === 'simple' ? '📄 간단 과제 등록' : '＋ 과제 등록 (고급)'}
            </h2>

            {!editTarget && (
              <div className="ax-mode-tabs">
                <button
                  type="button"
                  className={`ax-mode-tab ${modalMode === 'advanced' ? 'active' : ''}`}
                  onClick={() => { setModalMode('advanced'); setError('') }}
                >
                  고급 등록
                </button>
                <button
                  type="button"
                  className={`ax-mode-tab ${modalMode === 'simple' ? 'active' : ''}`}
                  onClick={() => { setModalMode('simple'); setError('') }}
                >
                  간단 등록
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="ax-form-group">
                <label>과제명 *</label>
                <input value={form.name} onChange={handleNameChange} placeholder="전자상거래 수출입 예측 시스템" required />
              </div>

              {(modalMode === 'advanced' || editTarget?.task_type === 'advanced') && (
                <div className="ax-form-group">
                  <label>슬러그 * <span className="ax-form-hint">URL 경로: /ax/슬러그 (영문·숫자·하이픈만)</span></label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="ecommerce-prediction" required />
                </div>
              )}

              <div className="ax-form-group">
                <label>개발자</label>
                <input value={form.developer} onChange={e => setForm(f => ({ ...f, developer: e.target.value }))} placeholder="홍길동" />
              </div>

              <div className="ax-form-group">
                <label>과제설명</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="과제에 대한 간단한 설명" />
              </div>

              {(modalMode === 'simple' || modalMode === 'advanced') && !editTarget && (
                <div className="ax-form-group">
                  <label>
                    {modalMode === 'simple' ? 'HTML 파일 *' : 'HTML 파일 (선택)'}
                    {modalMode === 'advanced' && (
                      <span className="ax-form-hint">업로드하면 GitHub/Jenkins 배포 없이 /ax/슬러그에서 바로 결과물을 확인할 수 있어요</span>
                    )}
                  </label>
                  <div
                    className={`ax-file-drop ${htmlFile ? 'has-file' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {htmlFile
                      ? <><span className="ax-file-icon">📄</span><span className="ax-file-name">{htmlFile.name}</span></>
                      : <><span className="ax-file-icon">📎</span><span>클릭하여 HTML 파일 선택</span></>
                    }
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".html"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              )}

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
