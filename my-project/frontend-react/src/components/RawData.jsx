import { useEffect, useState } from 'react'
import { fetchTradeData } from '../api/client'

const fmt = n => n?.toLocaleString('ko-KR') ?? '-'

export default function RawData() {
  const [data,   setData]   = useState([])
  const [filter, setFilter] = useState({ year: '', type: '' })
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filter.year) params.year = filter.year
    if (filter.type) params.trade_type = filter.type
    fetchTradeData(params)
      .then(setData)
      .finally(() => setLoading(false))
  }, [filter])

  const imports = data.filter(r => r.trade_type === 'import')
  const exports = data.filter(r => r.trade_type === 'export')

  return (
    <>
      {/* 필터 */}
      <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
        <select value={filter.year} onChange={e=>setFilter(f=>({...f,year:e.target.value}))}
          style={{padding:'7px 12px',border:'1px solid var(--border)',borderRadius:7,fontSize:13}}>
          <option value="">전체 연도</option>
          {Array.from({length:13},(_,i)=>2014+i).map(y=><option key={y}>{y}</option>)}
        </select>
        <select value={filter.type} onChange={e=>setFilter(f=>({...f,type:e.target.value}))}
          style={{padding:'7px 12px',border:'1px solid var(--border)',borderRadius:7,fontSize:13}}>
          <option value="">수입+수출</option>
          <option value="import">수입</option>
          <option value="export">수출</option>
        </select>
        {loading && <span style={{fontSize:12,color:'var(--t3)'}}>로딩 중...</span>}
        <span style={{fontSize:12,color:'var(--t3)',marginLeft:'auto'}}>
          총 {data.length}건
        </span>
      </div>

      {(filter.type === '' || filter.type === 'import') && (
        <div className="card">
          <div className="card-title" style={{marginBottom:12}}>
            전자상거래 수입 데이터 ({imports.length}건)
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>연도</th><th>월</th>
                  <th>수입 금액 (천원)</th><th>수입 건수</th>
                  <th>전체 수입 금액 (원)</th><th>전체 수입 건수</th>
                </tr>
              </thead>
              <tbody>
                {imports.map(r=>(
                  <tr key={r.id} style={r.year===2026?{background:'#fffde7'}:{}}>
                    <td>{r.year}</td><td>{r.month}월</td>
                    <td>{fmt(r.amount)}</td>
                    <td>{fmt(r.transaction_count)}</td>
                    <td>{fmt(r.total_amount)}</td>
                    <td>{fmt(r.total_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(filter.type === '' || filter.type === 'export') && (
        <div className="card">
          <div className="card-title" style={{marginBottom:12}}>
            전자상거래 수출 데이터 ({exports.length}건)
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>연도</th><th>월</th>
                  <th>수출 금액 (천원)</th><th>수출 건수</th>
                  <th>전체 수출 금액 (원)</th><th>전체 수출 건수</th>
                </tr>
              </thead>
              <tbody>
                {exports.map(r=>(
                  <tr key={r.id} style={r.year===2026?{background:'#e8f5ee'}:{}}>
                    <td>{r.year}</td><td>{r.month}월</td>
                    <td>{fmt(r.amount)}</td>
                    <td>{fmt(r.transaction_count)}</td>
                    <td>{fmt(r.total_amount)}</td>
                    <td>{fmt(r.total_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
