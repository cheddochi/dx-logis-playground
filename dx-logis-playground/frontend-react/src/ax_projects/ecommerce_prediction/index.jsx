import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { computePredictions, fetchSeasonalIndex, fetchAnnualSummary, fetchTradeData } from '../../api/client'
import Dashboard  from '../../components/Dashboard'
import Parameters from '../../components/Parameters'
import Predictions from '../../components/Predictions'
import Report     from '../../components/Report'
import RawData    from '../../components/RawData'

const TABS = [
  { id: 'dashboard',   label: '📊 대시보드' },
  { id: 'parameters',  label: '⚙️ 파라미터 설정' },
  { id: 'predictions', label: '🔮 예측 결과' },
  { id: 'report',      label: '🤖 AI 분석' },
  { id: 'rawdata',     label: '📋 원시 데이터' },
]

const DEFAULT_PARAMS = {
  imp_growth:       2.1,
  exp_growth:       16.5,
  exchange_rate:    0.0,
  exemption_limit:  150,
  monthly_imp_adj:  Array(10).fill(0),
  monthly_exp_adj:  Array(10).fill(0),
  events: [
    { id:'guangjie',   name:'광군제 (11.11)',    month:11, month_idx:8, type:'exp',  spike:15, active:true  },
    { id:'blackfriday',name:'블랙프라이데이',    month:11, month_idx:8, type:'imp',  spike:12, active:true  },
    { id:'primeday',   name:'아마존 프라임데이', month:7,  month_idx:4, type:'exp',  spike:8,  active:false },
    { id:'chuseok',    name:'추석 특수',          month:9,  month_idx:6, type:'imp',  spike:6,  active:false },
    { id:'yearend',    name:'크리스마스·연말',    month:12, month_idx:9, type:'both', spike:5,  active:false },
  ],
}

export default function EcommercePredictionApp() {
  const [activeTab,    setActiveTab]    = useState('dashboard')
  const [params,       setParams]       = useState(DEFAULT_PARAMS)
  const [prediction,   setPrediction]   = useState(null)
  const [seasonalIdx,  setSeasonalIdx]  = useState([])
  const [annualSummary,setAnnualSummary]= useState([])
  const [loading,      setLoading]      = useState(false)

  const runPrediction = useCallback(async (p) => {
    setLoading(true)
    try {
      const result = await computePredictions(p)
      setPrediction(result)
    } catch (e) {
      console.error('Prediction error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { runPrediction(params) }, [])

  useEffect(() => {
    fetchSeasonalIndex().then(setSeasonalIdx).catch(console.error)
    fetchAnnualSummary().then(setAnnualSummary).catch(console.error)
  }, [])

  const handleParamsChange = (newParams) => {
    setParams(newParams)
    runPrediction(newParams)
  }

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <Link to="/" style={{ color: '#58a6ff', textDecoration: 'none', fontSize: '0.85rem', marginRight: '1rem' }}>
            ← AX 과제 목록
          </Link>
          전자상거래 수출입 예측 시스템
          <span>Korea e-Commerce Trade Forecast</span>
        </div>
        <div className="ver-badge">2026 예측 v2.0</div>
      </header>

      <nav className="tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {activeTab === 'dashboard'   && <Dashboard   prediction={prediction} annualSummary={annualSummary} loading={loading} />}
        {activeTab === 'parameters'  && <Parameters  params={params} seasonalIdx={seasonalIdx} onChange={handleParamsChange} />}
        {activeTab === 'predictions' && <Predictions prediction={prediction} loading={loading} />}
        {activeTab === 'report'      && <Report      prediction={prediction} />}
        {activeTab === 'rawdata'     && <RawData />}
      </main>
    </>
  )
}
