import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
<<<<<<< HEAD
import { LoadingProvider } from "./context/LoadingContext";
=======
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import AIInsights from "./pages/AIInsights";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
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
<<<<<<< HEAD
    <AppProvider>
      <BrowserRouter>
        <LoadingProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
=======
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute element={<Layout />} />}>
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetails />} />
              <Route path="/ai-insights" element={<AIInsights />} />
<<<<<<< HEAD
              <Route path="/intelligence" element={<IntelligenceRedirect />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </LoadingProvider>
      </BrowserRouter>
    </AppProvider>
=======
              <Route path="/profile" element={<Profile />} />
              <Route path="/intelligence" element={<IntelligenceRedirect />} />
              {/* <Route path="settings" element={<Settings />} /> */}
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d
  );
}
