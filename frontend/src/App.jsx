import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const WaxReceiveDetailPage = lazy(() => import("./pages/WaxReceiveDetailPage"));
const WaxReceiveCreatePage = lazy(() => import("./pages/WaxReceiveCreatePage"));
const WaxReceiveLineCreatePage = lazy(() => import("./pages/WaxReceiveLineCreatePage"));
const WaxReceiveEditPage = lazy(() => import("./pages/WaxReceiveEditPage"));
const WaxReceiveLineEditPage = lazy(() => import("./pages/WaxReceiveLineEditPage"));
const VendorCreatePage = lazy(() => import("./pages/VendorCreatePage"));
const VendorItemCreatePage = lazy(() => import("./pages/VendorItemCreatePage"));
const VendorEditPage = lazy(() => import("./pages/VendorEditPage"));
const VendorItemEditPage = lazy(() => import("./pages/VendorItemEditPage"));
const VendorDetailPage = lazy(() => import("./pages/VendorDetailPage"));
const IssueMasterCreatePage = lazy(() => import("./pages/IssueMasterCreatePage"));
const IssueMasterEditPage = lazy(() => import("./pages/IssueMasterEditPage"));
const UserCreatePage = lazy(() => import("./pages/UserCreatePage"));

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
            path="/wax-receives/new"
            element={
              <ProtectedRoute>
                <WaxReceiveCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wax-receives/:id/edit"
            element={
              <ProtectedRoute>
                <WaxReceiveEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wax-receives/:id/lines/new"
            element={
              <ProtectedRoute>
                <WaxReceiveLineCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wax-receives/:id/lines/:lineId/edit"
            element={
              <ProtectedRoute>
                <WaxReceiveLineEditPage />
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
            path="/vendors/new"
            element={
              <ProtectedRoute>
                <VendorCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/:id/edit"
            element={
              <ProtectedRoute>
                <VendorEditPage />
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
          <Route
            path="/vendors/:id/items/new"
            element={
              <ProtectedRoute>
                <VendorItemCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/:id/items/:itemId/edit"
            element={
              <ProtectedRoute>
                <VendorItemEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/issue-masters/new"
            element={
              <ProtectedRoute>
                <IssueMasterCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/issue-masters/:id/edit"
            element={
              <ProtectedRoute>
                <IssueMasterEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/new"
            element={
              <ProtectedRoute>
                <UserCreatePage />
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
