import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Presentacion from './core/components/Presentacion/presentacion'
import LoginPage from './pages/Auth/loginPage'
import RegistroPage from './pages/Auth/registroPage'
import ForgotPasswordPage from './pages/Auth/forgotPasswordPage'
import NewPasswordPage from './pages/Auth/newPasswordPage'
import Dashboard from './pages/dashboard'
import LogrosPage from './pages/LogrosPage'
import RankingPage from './pages/RankingPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Presentacion />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/new-password" element={<NewPasswordPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/logros" element={<LogrosPage />} />
      <Route path="/ranking" element={<RankingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
