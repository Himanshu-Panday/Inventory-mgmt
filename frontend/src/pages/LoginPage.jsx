import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form);
      navigate("/", { replace: true });
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail ||
        requestError?.response?.data?.non_field_errors?.[0] ||
        "Login failed. Check your credentials.";
      setError(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-brand">
          <img src={rudraLogo} alt="Rudra Jewels" />
          <div>
            <h1>Inventory Management</h1>
            <p>Track your master records, stock, and production flow in one place.</p>
          </div>
        </div>
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome back</h2>
            <p>Please sign in to continue.</p>
          </div>
          <form onSubmit={onSubmit} className="form">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
            />

            {error && <p className="error">{error}</p>}

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
