import { Route, Routes } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/Auth/loginPage'
import RegistroPage from './pages/Auth/registroPage'
import Dashboard from './pages/dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
    </Routes>
  )
}

export default App
