import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/Auth/loginPage'
import RegistroPage from './pages/Auth/registroPage'
import Dashboard from './pages/dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace/>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App
