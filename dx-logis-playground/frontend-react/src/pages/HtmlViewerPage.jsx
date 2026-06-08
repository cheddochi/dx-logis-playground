import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAxProject, API_BASE } from '../api/axProjectsClient'

export default function HtmlViewerPage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)

  useEffect(() => {
    getAxProject(id).catch(() => null).then(setProject)
  }, [id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '0 24px', height: '52px', flexShrink: 0,
        borderBottom: '1px solid #f0f0f0', background: '#fff',
      }}>
        <Link to="/" style={{ color: '#1bc6c6', fontWeight: 600, textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap' }}>
          ← 목록으로
        </Link>
        <span style={{ width: '1px', height: '16px', background: '#e8e8e8' }} />
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '2px 8px', borderRadius: '20px', background: '#f0e8ff',
          color: '#7c3aed', fontSize: '11px', fontWeight: 700, flexShrink: 0,
        }}>간단</span>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project ? project.name : ''}
        </span>
        {project?.html_filename && (
          <span style={{ fontSize: '12px', color: '#bbb', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {project.html_filename}
          </span>
        )}
      </div>
      <iframe
        src={`${API_BASE}/ax-projects/${id}/html`}
        style={{ flex: 1, width: '100%', border: 'none' }}
        title={project?.name || 'HTML 과제 페이지'}
      />
    </div>
  )
}
