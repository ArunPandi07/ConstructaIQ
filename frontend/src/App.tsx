import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { LoadingProvider } from "./context/LoadingContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { Login } from "./pages/Login";
import { isBackendProjectId } from "./services/projectApi";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
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
          <LoadingProvider>
          <Suspense fallback={null}>
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
          </Suspense>
          </LoadingProvider>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
