import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { LoadingProvider } from "./context/LoadingContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import FloatingChatBot from "./components/FloatingChatBot";
import { isBackendProjectId } from "./services/projectApi";
import { RingSpinner } from "./components/Loader";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Catalogs = lazy(() => import("./pages/Catalogs"));
const Demo3DPage = lazy(() => import("./pages/Demo3DPage"));
import Settings from "./pages/Settings";

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
            <WebSocketProvider>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-stone-100">
                    <RingSpinner size={56} />
                  </div>
                }
              >
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/demo3d" element={<Demo3DPage />} />
                  <Route path="/" element={<ProtectedRoute element={<><Layout /><FloatingChatBot /></>} />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:projectId" element={<ProjectDetails />} />
                    <Route path="/ai-insights" element={<AIInsights />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/intelligence" element={<IntelligenceRedirect />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/catalogs" element={<Catalogs />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </WebSocketProvider>
          </LoadingProvider>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
