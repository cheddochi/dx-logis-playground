import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const fmt100m = n => Math.round(n / 1e5).toLocaleString('ko-KR')

function YoyCell({ val }) {
  const up = val >= 0
  return <span style={{color: up ? 'var(--green)' : 'var(--red)'}}>
    {up ? '▲' : '▼'}{Math.abs(val).toFixed(1)}%
  </span>
}

export default function Predictions({ prediction, loading }) {
  if (loading) return <div className="loading-box"><div className="spinner" /><p style={{marginTop:12}}>예측 계산 중...</p></div>
  if (!prediction) return <div className="loading-box"><p>파라미터 설정 후 예측이 계산됩니다.</p></div>

  const { predictions, params, imp_total, exp_total, imp_total_yoy, exp_total_yoy } = prediction
  const activeEvs = params.events.filter(e => e.active)

  const chartData = predictions.map(p => ({
    name: `${p.month}월`,
    '2025 수입': Math.round(p.imp_base / 1e5),
    '2026 수입 예측': Math.round(p.imp / 1e5),
    '2025 수출': Math.round(p.exp_base / 1e5),
    '2026 수출 예측': Math.round(p.exp / 1e5),
  }))

  return (
    <>
      {/* 파라미터 요약 */}
      <div className="param-summary">
        <span style={{fontSize:11,color:'var(--t3)',marginRight:4}}>적용 파라미터:</span>
        <span className="ps-tag imp">수입 {params.imp_growth>=0?'+':''}{params.imp_growth}%</span>
        <span className="ps-tag exp">수출 {params.exp_growth>=0?'+':''}{params.exp_growth}%</span>
        <span className="ps-tag ex">환율 {params.exchange_rate>=0?'+':''}{params.exchange_rate}%</span>
        <span className="ps-tag neu">면세 {params.exemption_limit===0?'폐지':'$'+params.exemption_limit}</span>
        {activeEvs.map(e=>(
          <span key={e.id} className="ps-tag ev">{e.name} +{e.spike}%</span>
        ))}
      </div>

      {/* 예측 차트 */}
      <div className="card">
        <div className="card-title">2026년 3~12월 예측 vs 2025 실적</div>
        <div className="card-sub">막대 높이: 억원 단위</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{top:5,right:10,bottom:5,left:10}}>
            <XAxis dataKey="name" tick={{fontSize:11}} />
            <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v}억`} />
            <Tooltip formatter={(v,n)=>[`${v.toLocaleString()}억원`, n]} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Bar dataKey="2025 수입"      fill="rgba(26,111,196,0.35)" radius={[2,2,0,0]} />
            <Bar dataKey="2026 수입 예측" fill="rgba(232,160,32,0.9)"  radius={[2,2,0,0]} />
            <Bar dataKey="2025 수출"      fill="rgba(15,110,86,0.35)"  radius={[2,2,0,0]} />
            <Bar dataKey="2026 수출 예측" fill="rgba(160,32,160,0.8)"  radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 예측 테이블 */}
      <div className="two-col">
        <div className="card">
          <div className="card-title" style={{marginBottom:12}}>수입 예측 (2026년 3~12월)</div>
          <table className="data-table">
            <thead><tr><th>월</th><th>예측 금액 (억원)</th><th>예측 건수</th><th>vs 2025</th></tr></thead>
            <tbody>
              {predictions.map(p=>(
                <tr key={p.month} className="pred-row">
                  <td>{p.month}월</td>
                  <td>{fmt100m(p.imp)}</td>
                  <td>{p.imp_cnt.toLocaleString()}</td>
                  <td><YoyCell val={p.imp_yoy} /></td>
                </tr>
              ))}
              <tr className="total-row">
                <td>합계</td>
                <td>{fmt100m(imp_total)}</td>
                <td>-</td>
                <td><YoyCell val={imp_total_yoy} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title" style={{marginBottom:12}}>수출 예측 (2026년 3~12월)</div>
          <table className="data-table">
            <thead><tr><th>월</th><th>예측 금액 (억원)</th><th>예측 건수</th><th>vs 2025</th></tr></thead>
            <tbody>
              {predictions.map(p=>(
                <tr key={p.month} className="pred-row">
                  <td>{p.month}월</td>
                  <td>{fmt100m(p.exp)}</td>
                  <td>{p.exp_cnt.toLocaleString()}</td>
                  <td><YoyCell val={p.exp_yoy} /></td>
                </tr>
              ))}
              <tr className="total-row">
                <td>합계</td>
                <td>{fmt100m(exp_total)}</td>
                <td>-</td>
                <td><YoyCell val={exp_total_yoy} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
