import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  createUserRequest,
  getUserRequest,
  listMasterOptionsRequest,
  updateUserRequest,
} from "../api/auth";

const MASTER_TABS = [
  { key: "vendor_master", label: "Vendor-Master" },
  { key: "item_master", label: "Item-Master" },
  { key: "size_master", label: "Size-Master" },
  { key: "wax_receive", label: "Wax-Receive" },
  { key: "issue_master", label: "Issue-Master" },
  { key: "stock_management", label: "StockManagement" },
];

const NAV_ICON_MAP = {
  "Vendor-Master": "vendor",
  "Item-Master": "item",
  "Size-Master": "size",
  "Wax-Receive": "wax",
  "Issue-Master": "issue",
  "StockManagement": "stock",
  "User Management": "user",
  "Deleted Records": "trash",
};

const getNavIcon = (label) => NAV_ICON_MAP[label] || "default";


const defaultForm = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  is_active: true,
};

const buildPermissionRows = (masters, userPermissions = []) => {
  const permissionMap = new Map(
    userPermissions.map((permission) => [permission.master_name, permission]),
  );

  return masters.map((master) => {
    const permission = permissionMap.get(master.master_name);
    return {
      master_name: master.master_name,
      label: master.label,
      can_read: permission?.can_read || false,
      can_create_update: permission?.can_create_update || false,
      can_delete: permission?.can_delete || false,
    };
  });
};

const UserCreatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const isEditing = Boolean(id);

  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      return [...MASTER_TABS.map((item) => item.label), "User Management"];
    }
    return MASTER_TABS.filter((tab) => permissionMap.get(tab.key)?.can_read).map(
      (tab) => tab.label,
    );
  }, [permissionMap, user]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      listMasterOptionsRequest(),
      isEditing ? getUserRequest(id) : Promise.resolve(null),
    ])
      .then(([mastersData, userData]) => {
        if (!isMounted) return;
        setMasters(mastersData);
        if (userData) {
          setForm({
            email: userData.email || "",
            password: "",
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            is_active: userData.is_active,
          });
          setPermissionRows(buildPermissionRows(mastersData, userData.master_permissions || []));
        } else {
          setPermissionRows(buildPermissionRows(mastersData));
        }
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
  }, [id, isEditing]);

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

    setSaving(true);
    try {
      const permissionPayload = permissionRows.map((permission) => ({
        master_name: permission.master_name,
        can_read: permission.can_read,
        can_create_update: permission.can_create_update,
        can_delete: permission.can_delete,
      }));

      if (isEditing) {
        await updateUserRequest({
          id,
          payload: {
            first_name: form.first_name,
            last_name: form.last_name,
            is_active: form.is_active,
            master_permissions: permissionPayload,
          },
        });
      } else {
        if (!form.email || !form.password) {
          setFormError("Email and password are required.");
          setSaving(false);
          return;
        }
        await createUserRequest({
          email: form.email,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name,
          is_active: form.is_active,
          master_permissions: permissionPayload,
          role: "user",
        });
      }

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
        <div className="sidebar-header">
          <span>Modules</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              type="button"
              key={item}
              className={`nav-item ${item === "User Management" ? "active" : ""}`}
              onClick={() => {
                dispatch(setActiveTab(item));
                navigate("/");
              }}
            >
              <span className="nav-icon" data-icon={getNavIcon(item)} aria-hidden="true" />
              <span>{item}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

      <section className="dashboard-main" onClick={() => { setProfileOpen(false); setSidebarOpen(false); }}>
        <header className="topbar">
          <button
            type="button"
            className="hamburger"
            aria-label="Open sidebar"
            onClick={(event) => { event.stopPropagation(); setSidebarOpen(true); }}
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
              onClick={(event) => {
              event.stopPropagation();
              setProfileOpen((prev) => !prev);
            }}
              aria-label="Profile"
            />

            {profileOpen && (
              <div className="profile-card" onClick={(event) => event.stopPropagation()}>
              <div className="profile-header">
                <div className="profile-avatar">
                  {`${user?.first_name || ""} ${user?.last_name || ""}`.trim().slice(0, 1).toUpperCase() ||
                    user?.email?.slice(0, 1).toUpperCase() ||
                    "U"}
                </div>
                <div className="profile-title">
                  <h3>{user?.email || "Profile"}</h3>
                  <span>Login successful</span>
                </div>
              </div>
              <div className="profile-body">
                <div className="profile-row">
                  <span className="profile-icon email" aria-hidden="true" />
                  <div>
                    <strong>Email</strong>
                    <div>{user?.email || "-"}</div>
                  </div>
                </div>
                <div className="profile-row">
                  <span className="profile-icon role" aria-hidden="true" />
                  <div>
                    <strong>Role</strong>
                    <div>{user?.role || "-"}</div>
                  </div>
                </div>
              </div>
              <div className="profile-footer">
                <button className="profile-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
            )}
          </div>
        </header>

        <div className="content-card user-form-card">
          <div className="section-head user-form-head">
            <div className="user-form-title">
              <span className="title-icon" aria-hidden="true" />
              <div>
                <h2>{isEditing ? "Edit User" : "Create User"}</h2>
                <p>
                  {isEditing
                    ? "Update user details and master permissions."
                    : "Create a new normal user and assign master permissions."}
                </p>
              </div>
            </div>
            <div className="action-group">
              <button type="button" className="user-back" onClick={() => navigate(-1)}>
                <span className="btn-icon back" aria-hidden="true" />
                Back
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading master permissions...</p>
          ) : (
            <form className="form user-form" onSubmit={handleSubmit}>
              <div className="form-grid user-form-grid">
                <div className="form-group">
                  <label htmlFor="user-email">Email</label>
                  <input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    required={!isEditing}
                    disabled={isEditing}
                    placeholder="user@example.com"
                  />
                </div>

                {!isEditing && (
                  <div className="form-group">
                    <label htmlFor="user-password">Password</label>
                    <input
                      id="user-password"
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      required
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="user-first">First Name</label>
                  <input
                    id="user-first"
                    type="text"
                    value={form.first_name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, first_name: event.target.value }))
                    }
                    placeholder="First name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-last">Last Name</label>
                  <input
                    id="user-last"
                    type="text"
                    value={form.last_name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, last_name: event.target.value }))
                    }
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="user-toggle">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, is_active: event.target.checked }))
                    }
                  />
                  <span className="toggle-track" aria-hidden="true" />
                  <span className="toggle-label">Active User</span>
                </label>
                {form.is_active && <span className="status-pill active">Active</span>}
              </div>

              <div className="permission-grid user-permissions">
                <h4>Master Permissions</h4>
                {permissionRows.map((permission) => (
                  <div key={permission.master_name} className="permission-row">
                    <span>{permission.label}</span>
                    {permission.master_name === "deleted_records" ? (
                      <button
                        type="button"
                        className={`perm-icon perm-access align-right ${permission.can_read ? "active" : ""}`}
                        onClick={() =>
                          setPermissionValue(
                            permission.master_name,
                            "can_read",
                            !permission.can_read,
                          )
                        }
                      >
                        {permission.can_read ? "Access Granted" : "Access Denied"}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`perm-icon ${permission.can_read ? "active" : ""}`}
                          title="Read"
                          onClick={() =>
                            setPermissionValue(
                              permission.master_name,
                              "can_read",
                              !permission.can_read,
                            )
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
                            setPermissionValue(
                              permission.master_name,
                              "can_delete",
                              !permission.can_delete,
                            )
                          }
                        >
                          D
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {formError && <p className="error">{formError}</p>}

              <div className="modal-actions user-form-actions">
                <button type="submit" disabled={saving} className="user-submit">
                  {saving ? "Saving..." : isEditing ? "Update" : "Create"}
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
