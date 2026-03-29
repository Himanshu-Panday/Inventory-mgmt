import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  createUserRequest,
  listMasterOptionsRequest,
} from "../api/auth";

const MASTER_TABS = [
  { key: "vendor_master", label: "Vendor-Master" },
  { key: "item_master", label: "Item-Master" },
  { key: "size_master", label: "Size-Master" },
  { key: "wax_receive", label: "Wax-Receive" },
  { key: "issue_master", label: "Issue-Master" },
  { key: "stock_management", label: "StockManagement" },
];

const defaultForm = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  is_active: true,
};

const buildPermissionRows = (masters) =>
  masters.map((master) => ({
    master_name: master.master_name,
    label: master.label,
    can_read: false,
    can_create_update: false,
    can_delete: false,
  }));

const UserCreatePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [permissionRows, setPermissionRows] = useState([]);
  const [formError, setFormError] = useState("");

  const permissionMap = useMemo(() => {
    const map = new Map();
    (user?.master_permissions || []).forEach((permission) => {
      map.set(permission.master_name, permission);
    });
    return map;
  }, [user]);

  const navItems = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") {
      return [...MASTER_TABS.map((item) => item.label), "User Management", "Deleted Records"];
    }
    return MASTER_TABS.filter((tab) => permissionMap.get(tab.key)?.can_read).map(
      (tab) => tab.label,
    );
  }, [permissionMap, user]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    listMasterOptionsRequest()
      .then((mastersData) => {
        if (!isMounted) return;
        setMasters(mastersData);
        setPermissionRows(buildPermissionRows(mastersData));
      })
      .catch(() => {
        if (!isMounted) return;
        setMasters([]);
        setPermissionRows([]);
        setFormError("Failed to load master permissions.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const setPermissionValue = (masterName, key, value) => {
    setPermissionRows((prev) =>
      prev.map((permission) => {
        if (permission.master_name !== masterName) return permission;
        if (key === "can_read" && !value) {
          return { ...permission, can_read: false, can_create_update: false, can_delete: false };
        }
        if (key === "can_create_update" && value) {
          return { ...permission, can_create_update: true, can_read: true };
        }
        if (key === "can_delete" && value) {
          return { ...permission, can_delete: true, can_read: true };
        }
        return { ...permission, [key]: value };
      }),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.email || !form.password) {
      setFormError("Email and password are required.");
      return;
    }

    setSaving(true);
    try {
      const permissionPayload = permissionRows.map((permission) => ({
        master_name: permission.master_name,
        can_read: permission.can_read,
        can_create_update: permission.can_create_update,
        can_delete: permission.can_delete,
      }));

      await createUserRequest({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        is_active: form.is_active,
        master_permissions: permissionPayload,
        role: "user",
      });

      navigate("/", { replace: true });
    } catch (requestError) {
      const data = requestError?.response?.data;
      const apiMessage =
        data?.detail ||
        data?.email?.[0] ||
        data?.password?.[0] ||
        data?.master_permissions?.[0]?.master_name?.[0] ||
        data?.master_permissions?.[0]?.non_field_errors?.[0] ||
        data?.non_field_errors?.[0] ||
        "Unable to save user.";
      setFormError(apiMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">Modules</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              type="button"
              key={item}
              className={`nav-item ${item === "User Management" ? "active" : ""}`}
              onClick={() => {
                dispatch(setActiveTab(item));
                navigate("/");
                setSidebarOpen(false);
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <div
        className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <section className="dashboard-main">
        <header className="topbar">
          <button
            type="button"
            className="hamburger"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="topbar-logo">
            <img src={rudraLogo} alt="Rudra Jewels" />
          </div>

          <div className="profile-wrap">
            <button
              type="button"
              className="profile-btn"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-label="Profile"
            />

            {profileOpen && (
              <div className="profile-card">
                <h2>
                  {`${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                    user?.email ||
                    "Profile"}
                </h2>
                <p>Login successful. Welcome to inventory management.</p>
                <div className="meta">
                  <span>Email: {user?.email}</span>
                  <span>Role: {user?.role}</span>
                </div>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </header>

        <div className="content-card">
          <div className="section-head">
            <div>
              <h2>Create User</h2>
              <p>Create a new normal user and assign master permissions.</p>
            </div>
            <div className="action-group">
              <button type="button" className="small-btn" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading master permissions...</p>
          ) : (
            <form className="form" onSubmit={handleSubmit}>
              <label htmlFor="user-email">Email</label>
              <input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />

              <label htmlFor="user-password">Password</label>
              <input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />

              <label htmlFor="user-first">First Name</label>
              <input
                id="user-first"
                type="text"
                value={form.first_name}
                onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
              />

              <label htmlFor="user-last">Last Name</label>
              <input
                id="user-last"
                type="text"
                value={form.last_name}
                onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
              />

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
                Active User
              </label>

              <div className="permission-grid">
                <h4>Master Permissions</h4>
                {permissionRows.map((permission) => (
                  <div key={permission.master_name} className="permission-row">
                    <span>{permission.label}</span>
                    <button
                      type="button"
                      className={`perm-icon ${permission.can_read ? "active" : ""}`}
                      title="Read"
                      onClick={() =>
                        setPermissionValue(permission.master_name, "can_read", !permission.can_read)
                      }
                    >
                      R
                    </button>
                    <button
                      type="button"
                      className={`perm-icon ${permission.can_create_update ? "active" : ""}`}
                      title="Create/Update"
                      onClick={() =>
                        setPermissionValue(
                          permission.master_name,
                          "can_create_update",
                          !permission.can_create_update,
                        )
                      }
                    >
                      CU
                    </button>
                    <button
                      type="button"
                      className={`perm-icon ${permission.can_delete ? "active" : ""}`}
                      title="Delete"
                      onClick={() =>
                        setPermissionValue(permission.master_name, "can_delete", !permission.can_delete)
                      }
                    >
                      D
                    </button>
                  </div>
                ))}
              </div>

              {formError && <p className="error">{formError}</p>}

              <div className="modal-actions">
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserCreatePage;
