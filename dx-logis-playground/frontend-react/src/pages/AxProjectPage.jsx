import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { listAxProjects } from '../api/axProjectsClient'
import '../styles/ax-main.css'

function fmt(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const ICONS = ['🤖', '📊', '🔮', '🧠', '⚡', '🎯', '💡', '🚀', '📈', '🛰️']

export default function AxProjectPage() {
  const { slug } = useParams()
  const [project, setProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listAxProjects()
      .then(list => {
        setProjects(list)
        const found = list.find(p => p.slug === slug)
        if (found) setProject(found)
        else setError('과제를 찾을 수 없습니다.')
      })
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [slug])

  const idx = projects.findIndex(p => p.slug === slug)

  return (
    <div className="ax-wrap">
      <header className="ax-gnb">
        <a href="/" className="ax-gnb-logo">
          <span className="ax-gnb-badge">AX</span>
          AI Transformation
        </a>
        <div className="ax-gnb-spacer" />
        <Link to="/" className="ax-gnb-btn" style={{ textDecoration: 'none' }}>← 목록으로</Link>
      </header>

      <div className="ax-body">
        <aside className="ax-sidebar">
          <div className="ax-sidebar-title">AX 과제</div>
          <ul className="ax-sidebar-nav">
            {projects.map(p => (
              <li key={p.id}>
                <Link to={`/ax/${p.slug}`} className={p.slug === slug ? 'active' : ''}>{p.name}</Link>
              </li>
            ))}
          </ul>
        </aside>

        <main className="ax-main">
          {loading && <p className="ax-loading">불러오는 중...</p>}
          {error && <p className="ax-error" style={{ color: '#e53e3e' }}>{error} <Link to="/">목록으로 돌아가기</Link></p>}

          {project && (
            <>
              <div className="ax-page-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                  <span style={{ fontSize: 40 }}>{ICONS[idx % ICONS.length]}</span>
                  <h1 style={{ margin: 0 }}>{project.name}</h1>
                </div>
                <p>{project.description || '과제 설명이 없습니다.'}</p>
              </div>

              <div className="ax-card" style={{ maxWidth: 480, marginTop: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#999', width: 60 }}>담당자</span>
                    <span className="ax-card-developer">{project.developer || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#999', width: 60 }}>슬러그</span>
                    <code style={{ color: '#555', fontSize: 13 }}>{project.slug}</code>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#999', width: 60 }}>등록일</span>
                    <span style={{ color: '#555' }}>{fmt(project.created_at)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
