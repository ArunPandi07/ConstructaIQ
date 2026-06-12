import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { LoadingProvider } from "./context/LoadingContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import AIInsights from "./pages/AIInsights";
import { isBackendProjectId } from "./services/projectApi";

function IntelligenceRedirect() {
  const { activeProjectId } = useAppContext();
  if (isBackendProjectId(activeProjectId)) {
    return <Navigate to={`/projects/${activeProjectId}`} replace />;
  }
  return <Navigate to="/projects" replace />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <LoadingProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetails />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/intelligence" element={<IntelligenceRedirect />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </LoadingProvider>
      </BrowserRouter>
    </AppProvider>
  );
}
