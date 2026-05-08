import { useState } from 'react'
import { saveParams, listSavedParams, loadSavedParams } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const EXEMPTION_OPTS = [
  { val: 100, label: '$100 강화' },
  { val: 150, label: '$150 현행' },
  { val: 200, label: '$200 완화' },
  { val: 300, label: '$300 대폭완화' },
  { val: 0,   label: '폐지' },
]
const EXEMPTION_NOTE = {
  100: '수입 건수 약 -12% 감소 (추정)', 150: '현행 기준 유지',
  200: '수입 건수 약 +8% 증가 (추정)', 300: '수입 건수 약 +18% 증가 (추정)',
  0: '수입 건수 약 +30% 증가 (추정, 폐지)',
}
const MONTH_LABELS = ['3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const IMP_SEASONAL = [0.9965,0.9337,1.0659,0.9962,0.9898,0.9423,0.9886,0.9512,0.9865,1.019,1.0722,1.0583]
const EXP_SEASONAL = [0.7669,0.8482,0.9629,1.0009,0.9925,0.9964,0.9882,1.1009,1.2479,1.0171,1.0274,1.0507]
const ALL_MONTHS   = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const seasonalChartData = ALL_MONTHS.map((m, i) => ({
  month: m, imp: IMP_SEASONAL[i], exp: EXP_SEASONAL[i],
}))

export default function Parameters({ params, seasonalIdx, onChange }) {
  const [saveName,    setSaveName]    = useState('')
  const [savedList,   setSavedList]   = useState([])
  const [showSaved,   setShowSaved]   = useState(false)

  const update = (patch) => onChange({ ...params, ...patch })

  const updateMonthAdj = (type, idx, val) => {
    const key = type === 'imp' ? 'monthly_imp_adj' : 'monthly_exp_adj'
    const arr  = [...params[key]]
    arr[idx]   = Number(val)
    update({ [key]: arr })
  }

  const updateEvent = (id, patch) => {
    const events = params.events.map(e => e.id === id ? { ...e, ...patch } : e)
    update({ events })
  }

  const handleSave = async () => {
    if (!saveName.trim()) return
    await saveParams({ param_name: saveName, params })
    setSaveName('')
    alert(`"${saveName}" 파라미터가 저장되었습니다.`)
  }

  const handleShowSaved = async () => {
    const list = await listSavedParams()
    setSavedList(list)
    setShowSaved(true)
  }

  const handleLoad = async (id) => {
    const saved = await loadSavedParams(id)
    onChange({
      imp_growth:      Number(saved.imp_growth),
      exp_growth:      Number(saved.exp_growth),
      exchange_rate:   Number(saved.exchange_rate),
      exemption_limit: saved.exemption_limit,
      monthly_imp_adj: saved.monthly_imp_adj.map(Number),
      monthly_exp_adj: saved.monthly_exp_adj.map(Number),
      events:          saved.events,
    })
    setShowSaved(false)
  }

  return (
    <>
      {/* 저장/불러오기 */}
      <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
        <input value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="파라미터 이름..."
          style={{padding:'7px 12px',border:'1px solid var(--border)',borderRadius:7,fontSize:13,width:200}} />
        <button className="btn-primary" onClick={handleSave}>💾 저장</button>
        <button className="btn-outline" onClick={handleShowSaved}>📂 불러오기</button>
      </div>

      {showSaved && (
        <div className="card" style={{marginBottom:14}}>
          <div className="card-title" style={{marginBottom:8}}>저장된 파라미터</div>
          {savedList.length === 0
            ? <p style={{color:'var(--t3)',fontSize:12}}>저장된 파라미터가 없습니다.</p>
            : <table className="data-table"><thead><tr><th>이름</th><th>수입</th><th>수출</th><th>저장일</th><th></th></tr></thead>
                <tbody>{savedList.map(s=>(
                  <tr key={s.id}>
                    <td>{s.param_name}</td>
                    <td>{+s.imp_growth>=0?'+':''}{s.imp_growth}%</td>
                    <td>{+s.exp_growth>=0?'+':''}{s.exp_growth}%</td>
                    <td>{new Date(s.created_at).toLocaleDateString('ko-KR')}</td>
                    <td><button className="btn-primary" style={{padding:'4px 10px',fontSize:11}} onClick={()=>handleLoad(s.id)}>적용</button></td>
                  </tr>
                ))}</tbody>
              </table>
          }
        </div>
      )}

      {/* 1. 기본 성장률 */}
      <div className="param-block">
        <div className="param-block-hd"><h3>📈 기본 성장률 (YoY)</h3></div>
        <div className="param-block-body">
          <div className="sl-row">
            <span className="sl-label">수입 YoY 성장률</span>
            <input type="range" min="-20" max="30" step="0.5" value={params.imp_growth}
              onChange={e=>update({imp_growth:+e.target.value})} />
            <span className="sl-val imp">{params.imp_growth>=0?'+':''}{params.imp_growth}%</span>
          </div>
          <div className="sl-hint">2022-25 추세(40%): -17.4% | 2026 Jan-Feb 실측(60%): +15.0% → 블렌드 +2.1%</div>
          <div className="sl-row">
            <span className="sl-label">수출 YoY 성장률</span>
            <input type="range" min="-20" max="60" step="0.5" value={params.exp_growth}
              onChange={e=>update({exp_growth:+e.target.value})} />
            <span className="sl-val exp">{params.exp_growth>=0?'+':''}{params.exp_growth}%</span>
          </div>
          <div className="sl-hint">2022-25 추세(40%): -4.5% | 2026 Jan-Feb 실측(60%): +30.6% → 블렌드 +16.5%</div>
        </div>
      </div>

      {/* 2. 환율 & 면세 한도 */}
      <div className="param-block">
        <div className="param-block-hd"><h3>💱 환율 & 면세 한도 시나리오</h3></div>
        <div className="param-block-body">
          <div style={{marginBottom:18}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>환율 변동 (원/달러 ±%)</div>
            <div className="sl-row">
              <span className="sl-label">원/달러 변동</span>
              <input type="range" min="-15" max="20" step="0.5" value={params.exchange_rate}
                onChange={e=>update({exchange_rate:+e.target.value})} />
              <span className="sl-val ex">{params.exchange_rate>=0?'+':''}{params.exchange_rate}%</span>
            </div>
            <div className="sl-hint">달러 강세(+) → 수입 금액 증가 | 조정 후: {Math.round(1350*(1+params.exchange_rate/100)).toLocaleString()}원</div>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:8}}>면세 한도 시나리오</div>
            <div className="pill-group">
              {EXEMPTION_OPTS.map(o=>(
                <button key={o.val} className={`spill${params.exemption_limit===o.val?' active':''}`}
                  onClick={()=>update({exemption_limit:o.val})}>
                  {o.label}
                </button>
              ))}
            </div>
            <p className="spill-note">📦 {EXEMPTION_NOTE[params.exemption_limit]}</p>
          </div>
        </div>
      </div>

      {/* 3. 계절지수 & 월별 보정 */}
      <div className="param-block">
        <div className="param-block-hd"><h3>📅 계절지수 & 월별 보정</h3></div>
        <div className="param-block-body">
          <p style={{fontSize:11,color:'var(--t3)',marginBottom:8}}>2022-2025 평균 계절지수 참고 (1.0 = 연간 평균)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={seasonalChartData} margin={{top:0,right:10,bottom:0,left:0}}>
              <XAxis dataKey="month" tick={{fontSize:9}} />
              <YAxis domain={[0.65,1.35]} tick={{fontSize:9}} tickFormatter={v=>v.toFixed(2)} />
              <Tooltip formatter={v=>[v.toFixed(4)]} />
              <ReferenceLine y={1} stroke="#aaa" strokeDasharray="3 3" />
              <Bar dataKey="imp" name="수입 계절지수" fill="#1a6fc4" radius={[2,2,0,0]} />
              <Bar dataKey="exp" name="수출 계절지수" fill="#0f6e56" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>

          <p style={{fontSize:11,fontWeight:600,color:'var(--t2)',margin:'14px 0 6px'}}>
            월별 추가 보정 (%) — YoY 예측에 추가 가감
          </p>
          <div className="madj-wrap">
            <table className="madj-table">
              <thead><tr><th></th>{MONTH_LABELS.map(m=><th key={m}>{m}</th>)}</tr></thead>
              <tbody>
                {['imp','exp'].map(type=>(
                  <tr key={type}>
                    <td>{type==='imp'?'수입(%)':'수출(%)'}</td>
                    {(type==='imp'?params.monthly_imp_adj:params.monthly_exp_adj).map((v,i)=>(
                      <td key={i}>
                        <input type="number" className={`adj-inp${v>0?' pos':v<0?' neg':''}`}
                          value={v} min="-20" max="30" step="1"
                          onChange={e=>updateMonthAdj(type,i,e.target.value)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. 쇼핑 이벤트 */}
      <div className="param-block">
        <div className="param-block-hd"><h3>🛍️ 쇼핑 이벤트 효과 보정</h3></div>
        <div className="param-block-body">
          <p style={{fontSize:11,color:'var(--t3)',marginBottom:10}}>이벤트 효과는 YoY + 월별 보정에 추가 반영됩니다.</p>
          <div className="events-grid">
            {params.events.map(ev=>(
              <div key={ev.id} className={`ev-card${ev.active?' on':''}`}>
                <div className="ev-hd">
                  <input type="checkbox" style={{width:14,height:14,accentColor:'var(--imp)',cursor:'pointer'}}
                    checked={ev.active} onChange={e=>updateEvent(ev.id,{active:e.target.checked})} />
                  <span className="ev-name">{ev.name}</span>
                  <span className="ev-mo">{ev.month}월</span>
                  <span className={`ev-type ${ev.type}`}>
                    {ev.type==='imp'?'수입':ev.type==='exp'?'수출':'수입+수출'}
                  </span>
                </div>
                <div className="ev-body">
                  <span>효과:</span>
                  <input type="number" className="ev-inp" value={ev.spike} min="1" max="50"
                    onChange={e=>updateEvent(ev.id,{spike:+e.target.value})} />
                  <span>% 증가</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
