import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import AIInsights from "./pages/AIInsights";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { isBackendProjectId } from "./services/projectApi";
// import Settings from "./pages/Settings";

function IntelligenceRedirect() {
  const { activeProjectId } = useAppContext();
  if (isBackendProjectId(activeProjectId)) {
    return <Navigate to={`/projects/${activeProjectId}`} replace />;
  }
  return <Navigate to="/projects" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute element={<Layout />} />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetails />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/intelligence" element={<IntelligenceRedirect />} />
              {/* <Route path="settings" element={<Settings />} /> */}
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
