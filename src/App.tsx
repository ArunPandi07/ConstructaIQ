import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ProjectUpload from './pages/ProjectUpload'
import ProjectIntelligence from './pages/ProjectIntelligence'
import RiskIntelligence from './pages/RiskIntelligence'
import RecoveryCenter from './pages/RecoveryCenter'
import ChangeImpact from './pages/ChangeImpact'
import AgentInsights from './pages/AgentInsights'
import './index.css'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="upload"       element={<ProjectUpload />} />
            <Route path="intelligence" element={<ProjectIntelligence />} />
            <Route path="risk"         element={<RiskIntelligence />} />
            <Route path="recovery"     element={<RecoveryCenter />} />
            <Route path="change-impact"element={<ChangeImpact />} />
            <Route path="agents"       element={<AgentInsights />} />
          </Route>
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
