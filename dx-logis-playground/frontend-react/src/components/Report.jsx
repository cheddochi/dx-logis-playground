import { useState } from 'react'
import { generateLocalReport, generateAiReport } from '../api/client'

const fmt100m = n => n.toLocaleString('ko-KR')

export default function Report({ prediction }) {
  const [apiKey,  setApiKey]  = useState('')
  const [keySaved,setKeySaved]= useState(false)
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleLocalReport = async () => {
    if (!prediction) return
    setLoading(true); setError(''); setReport(null)
    try {
      const r = await generateLocalReport(prediction)
      setReport({ type: 'local', data: r })
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally { setLoading(false) }
  }

  const handleAiReport = async () => {
    if (!prediction || !apiKey) { setError('API 키를 먼저 저장해주세요.'); return }
    setLoading(true); setError(''); setReport(null)
    try {
      const r = await generateAiReport(prediction, apiKey)
      setReport({ type: 'ai', data: r })
    } catch (e) {
      const msg = e.response?.data?.detail || e.message
      const isBilling = msg.includes('credit balance')
      setError(msg + (isBilling ? ' → console.anthropic.com/settings/billing 에서 충전하세요.' : ''))
    } finally { setLoading(false) }
  }

  const SECTION_TITLES = {
    summary: '1. 종합 예측 요약', import_analysis: '2. 수입 동향 분석',
    export_analysis: '3. 수출 동향 분석', risk: '4. 리스크 및 업사이드 요인',
    implications: '5. 시사점 및 정책 제언',
  }

  return (
    <>
      {/* API Key */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card-title" style={{marginBottom:4}}>🔑 Anthropic API 키 설정 (AI 보고서 전용)</div>
        <p className="card-sub">키는 이 브라우저 세션에서만 사용되며 서버로 전달되어 Claude API 호출에 사용됩니다.</p>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <input type="password" className="api-key-input" value={apiKey}
            onChange={e=>{ setApiKey(e.target.value); setKeySaved(false) }}
            placeholder="sk-ant-api03-..." />
          <button className="btn-primary" style={{padding:'8px 18px'}}
            onClick={()=>{ if(apiKey.startsWith('sk-ant-')){ setKeySaved(true) } else setError('sk-ant- 로 시작하는 키를 입력해주세요.') }}>
            저장
          </button>
        </div>
        {keySaved && <p style={{marginTop:6,fontSize:12,color:'var(--green)'}}>✅ API 키 저장 완료</p>}
        {!keySaved && apiKey && <p style={{marginTop:6,fontSize:12,color:'var(--red)'}}>올바른 형식이 아닙니다.</p>}
        <p style={{marginTop:6,fontSize:11,color:'var(--t3)'}}>
          키 발급: <a href="https://console.anthropic.com/" target="_blank" style={{color:'var(--imp)'}}>console.anthropic.com</a>
          &nbsp;| 크레딧 충전: <a href="https://console.anthropic.com/settings/billing" target="_blank" style={{color:'var(--imp)'}}>billing 페이지</a>
        </p>
      </div>

      {/* Buttons */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <button className="btn-primary" onClick={handleLocalReport} disabled={!prediction||loading}>
          📄 로컬 보고서 생성 (API 키 불필요)
        </button>
        <button className="btn-outline" onClick={handleAiReport} disabled={!prediction||loading||!keySaved}>
          🤖 AI 보고서 생성 (API 키 필요)
        </button>
      </div>

      {/* Loading */}
      {loading && <div className="loading-box"><div className="spinner" /><p style={{marginTop:10}}>보고서 생성 중...</p></div>}

      {/* Error */}
      {error && !loading && (
        <div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:8,padding:'12px 16px',marginBottom:14,fontSize:13,color:'var(--red)'}}>
          ⚠️ {error}
        </div>
      )}

      {/* Local Report */}
      {report?.type === 'local' && (
        <div className="report-output">
          <div style={{fontSize:11,color:'var(--t3)',marginBottom:16}}>
            로컬 자동 생성 보고서 | {new Date().toLocaleString('ko-KR')}
          </div>
          {Object.entries(SECTION_TITLES).map(([key, title]) => (
            <div key={key}>
              <div className="report-section-title">{title}</div>
              <p>{report.data.sections?.[key]}</p>
            </div>
          ))}
          <div className="report-section-title">6. 월별 예측 상세</div>
          <table className="data-table" style={{marginTop:8}}>
            <thead>
              <tr><th>월</th><th>수입 예측 (억원)</th><th>수출 예측 (억원)</th><th>수입 YoY</th><th>수출 YoY</th></tr>
            </thead>
            <tbody>
              {(report.data.table||[]).map(r=>(
                <tr key={r.month} className="pred-row">
                  <td>{r.month}월</td>
                  <td>{r.imp_100m.toLocaleString()}</td>
                  <td>{r.exp_100m.toLocaleString()}</td>
                  <td><span style={{color:r.imp_yoy>=0?'var(--green)':'var(--red)'}}>{r.imp_yoy>=0?'▲':'▼'}{Math.abs(r.imp_yoy).toFixed(1)}%</span></td>
                  <td><span style={{color:r.exp_yoy>=0?'var(--green)':'var(--red)'}}>{r.exp_yoy>=0?'▲':'▼'}{Math.abs(r.exp_yoy).toFixed(1)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Report */}
      {report?.type === 'ai' && (
        <div className="report-output">
          <div style={{fontSize:11,color:'var(--t3)',marginBottom:16}}>
            Claude AI 생성 보고서 | {new Date().toLocaleString('ko-KR')}
          </div>
          {(report.data.text||'').split('\n').map((line, i) => {
            if (line.startsWith('### ')) return <div key={i} className="report-section-title">{line.replace('### ','')}</div>
            if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{fontWeight:700}}>{line.replace(/\*\*/g,'')}</p>
            return line.trim() ? <p key={i}>{line}</p> : <br key={i} />
          })}
        </div>
      )}
    </>
  )
}
