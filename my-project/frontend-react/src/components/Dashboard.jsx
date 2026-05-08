import { useEffect, useState } from 'react'
import { fetchTradeData } from '../api/client'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const fmt100m = n => Math.round(n / 1e5).toLocaleString('ko-KR')
const fmtTr   = n => (n / 1e9).toFixed(2)

function KpiCard({ label, value, change, changeUp }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {change && <div className={`kpi-change ${changeUp ? 'up' : 'down'}`}>{change}</div>}
    </div>
  )
}

export default function Dashboard({ prediction, annualSummary, loading }) {
  const [trendData, setTrendData] = useState([])

  useEffect(() => {
    fetchTradeData().then(rows => {
      const map = {}
      rows.forEach(r => {
        const key = `${r.year}.${String(r.month).padStart(2,'0')}`
        if (!map[key]) map[key] = { label: `${r.year}.${r.month}`, year: r.year, month: r.month }
        if (r.trade_type === 'import') map[key].imp = Math.round(r.amount / 1e5)
        if (r.trade_type === 'export') map[key].exp = Math.round(r.amount / 1e5)
      })
      setTrendData(Object.values(map).sort((a,b) => a.year-b.year || a.month-b.month))
    }).catch(console.error)
  }, [])

  // 추이 차트에 예측 데이터 연결
  const chartData = [...trendData]
  if (prediction) {
    prediction.predictions.forEach(p => {
      chartData.push({
        label: `2026.${p.month}`,
        year: 2026, month: p.month,
        imp_pred: Math.round(p.imp / 1e5),
        exp_pred: Math.round(p.exp / 1e5),
      })
    })
  }

  // 연도별 합계 차트 데이터
  const yearMap = {}
  annualSummary.forEach(r => {
    if (!yearMap[r.year]) yearMap[r.year] = { year: r.year }
    if (r.trade_type === 'import') yearMap[r.year].imp = +(r.total_amount / 1e9).toFixed(2)
    if (r.trade_type === 'export') yearMap[r.year].exp = +(r.total_amount / 1e9).toFixed(2)
  })
  const yearData = Object.values(yearMap).sort((a,b) => a.year - b.year)

  const imp_total = prediction?.imp_total ?? 0
  const exp_total = prediction?.exp_total ?? 0
  const imp_yoy   = prediction?.imp_total_yoy ?? 0
  const exp_yoy   = prediction?.exp_total_yoy ?? 0

  return (
    <>
      <div className="kpi-row">
        <KpiCard label="2026.2 수입 (실측)" value="2,319억원" change="▲ YoY +24.7%" changeUp />
        <KpiCard label="2026.2 수출 (실측)" value="1,403억원" change="▲ YoY +25.9%" changeUp />
        <KpiCard
          label="수입 예측 합계 (3~12월)"
          value={loading ? '…' : `${fmtTr(imp_total)}조원`}
          change={loading ? null : `${imp_yoy >= 0 ? '▲' : '▼'} YoY ${imp_yoy >= 0 ? '+' : ''}${imp_yoy}%`}
          changeUp={imp_yoy >= 0}
        />
        <KpiCard
          label="수출 예측 합계 (3~12월)"
          value={loading ? '…' : `${fmtTr(exp_total)}조원`}
          change={loading ? null : `${exp_yoy >= 0 ? '▲' : '▼'} YoY ${exp_yoy >= 0 ? '+' : ''}${exp_yoy}%`}
          changeUp={exp_yoy >= 0}
        />
      </div>

      <div className="card">
        <div className="card-title">전자상거래 수출입 추이 (2022–2026)</div>
        <div className="card-sub">실선: 실적 | 점선: 2026 예측</div>
        <div className="legend-row">
          <span><span className="legend-dot" style={{background:'#1a6fc4'}} />수입 실적</span>
          <span><span className="legend-dot" style={{background:'#0f6e56'}} />수출 실적</span>
          <span><span className="legend-dot" style={{background:'#e8a020'}} />수입 예측</span>
          <span><span className="legend-dot" style={{background:'#a020a0'}} />수출 예측</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{top:5,right:10,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{fontSize:9}} interval={5} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v}억`} />
            <Tooltip formatter={(v,n)=>[`${v.toLocaleString()}억원`, n]} />
            <Line dataKey="imp" name="수입 실적" stroke="#1a6fc4" dot={false} strokeWidth={2} connectNulls />
            <Line dataKey="exp" name="수출 실적" stroke="#0f6e56" dot={false} strokeWidth={2} connectNulls />
            <Line dataKey="imp_pred" name="수입 예측" stroke="#e8a020" dot={false} strokeWidth={2} strokeDasharray="5 3" connectNulls />
            <Line dataKey="exp_pred" name="수출 예측" stroke="#a020a0" dot={false} strokeWidth={2} strokeDasharray="5 3" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title" style={{marginBottom:12}}>연도별 수입 합계 (조원)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearData}>
              <XAxis dataKey="year" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v}조`} />
              <Tooltip formatter={v=>[`${v}조원`,'수입']} />
              <Bar dataKey="imp" name="수입" fill="#1a6fc4" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title" style={{marginBottom:12}}>연도별 수출 합계 (조원)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearData}>
              <XAxis dataKey="year" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v}조`} />
              <Tooltip formatter={v=>[`${v}조원`,'수출']} />
              <Bar dataKey="exp" name="수출" fill="#0f6e56" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
