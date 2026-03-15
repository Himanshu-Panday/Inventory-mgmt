import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const WaxReceiveDetailPage = lazy(() => import("./pages/WaxReceiveDetailPage"));
const VendorDetailPage = lazy(() => import("./pages/VendorDetailPage"));

function App() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="page-shell">
            <div className="loader-card">
              <span className="loader-spinner" />
              <div className="loader-lines">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wax-receives/:id"
            element={
              <ProtectedRoute>
                <WaxReceiveDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/:id"
            element={
              <ProtectedRoute>
                <VendorDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
