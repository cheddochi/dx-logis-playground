import { Routes, Route, Navigate } from 'react-router-dom'
import MainPage from './pages/MainPage'
import AxProjectPage from './pages/AxProjectPage'
import HtmlViewerPage from './pages/HtmlViewerPage'

// ── AX 과제별 커스텀 앱 import ──────────────────────────────────────
// 신규 과제의 커스텀 페이지가 필요할 때만 추가 (없으면 기본 AxProjectPage로 표시)
// 1) src/ax_projects/{slug}/index.jsx 생성
// 2) 아래에 import 추가 (slug는 DB에 등록한 값과 일치해야 함)
import EcommercePredictionApp from './ax_projects/ecommerce_prediction'
// import MyNewProjectApp from './ax_projects/my-new-project'   ← 신규 과제 추가 예시
// ────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />

      {/* ── AX 과제별 커스텀 라우트 ─────────────────────────────────────
          주의: static route는 반드시 /ax/:slug(동적 라우트) 보다 위에 위치해야 함
          신규 과제 추가 시 아래 블록 안에 Route 추가                          */}
      <Route path="/ax/ecommerce-prediction/*" element={<EcommercePredictionApp />} />
      {/* <Route path="/ax/my-new-project/*" element={<MyNewProjectApp />} /> */}
      {/* ────────────────────────────────────────────────────────────────── */}

      {/* 간단 등록 HTML 뷰어 */}
      <Route path="/ax-html/:id" element={<HtmlViewerPage />} />

      {/* 커스텀 페이지 없는 과제는 기본 상세 페이지(AxProjectPage)로 자동 fallback */}
      <Route path="/ax/:slug" element={<AxProjectPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
