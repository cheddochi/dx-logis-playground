import { Routes, Route, Navigate } from 'react-router-dom'
import MainPage from './pages/MainPage'
import AxProjectPage from './pages/AxProjectPage'
import EcommercePredictionApp from './ax_projects/ecommerce_prediction'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/ax/ecommerce-prediction/*" element={<EcommercePredictionApp />} />
      <Route path="/ax/:slug" element={<AxProjectPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
