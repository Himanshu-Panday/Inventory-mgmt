import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchItems } from "../store/itemMasterSlice";
import { fetchSizes } from "../store/sizeMasterSlice";
import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import { createIssueMaster, listIssueMasters } from "../api/mgmt";

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


const IssueMasterCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = useSelector((state) => state.itemMaster.records);
  const sizes = useSelector((state) => state.sizeMaster.records);

  const [form, setForm] = useState({
    item: "",
    size: "",
    out_weight: "",
    out_quantity: "",
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const duplicateSelection = useMemo(() => {
    if (!form.item || !form.size) return false;
    return false;
  }, [form.item, form.size]);

  useEffect(() => {
    dispatch(fetchItems());
    dispatch(fetchSizes());
  }, [dispatch]);

  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill) return;
    setForm((prev) => ({
      ...prev,
      item: prefill.item ? String(prefill.item) : prev.item,
      size: prefill.size ? String(prefill.size) : prev.size,
      out_weight:
        prefill.out_weight !== undefined ? String(prefill.out_weight) : prev.out_weight,
      out_quantity:
        prefill.out_quantity !== undefined
          ? String(prefill.out_quantity)
          : prev.out_quantity,
      description: prefill.description ?? prev.description,
    }));
  }, [location.state]);

  const returnTo = location.state?.returnTo;
  const returnToTab = location.state?.returnToTab;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.item || !form.out_weight || !form.out_quantity) {
      setFormError("Item, weight and quantity are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        item: Number(form.item),
        size: form.size ? Number(form.size) : null,
        out_weight: Number(form.out_weight),
        out_quantity: Number(form.out_quantity),
        description: form.description,
      };
      await createIssueMaster(payload);
      if (returnToTab) {
        dispatch(setActiveTab(returnToTab));
      }
      navigate(returnTo || "/", { replace: true });
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to save issue record.";
      setFormError(apiMessage);
    } finally {
      setSubmitting(false);
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
              className={`nav-item ${item === "Issue-Master" ? "active" : ""}`}
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

        <div className="content-card">
          <div className="section-head">
            <div>
              <h2>Create Issue</h2>
              <p>Add a new issue master record.</p>
            </div>
            <div className="action-group">
              <button
                type="button"
                className="small-btn"
                onClick={() => {
                  if (returnToTab) {
                    dispatch(setActiveTab(returnToTab));
                  }
                  if (returnTo) {
                    navigate(returnTo, { replace: true });
                  } else {
                    navigate(-1);
                  }
                }}
              >
                Back
              </button>
            </div>
          </div>

          <form className="form form-grid" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="issue-item">Item</label>
              <select
                id="issue-item"
                value={form.item}
                onChange={(event) => setForm((prev) => ({ ...prev, item: event.target.value }))}
                required
              >
                <option value="">Select item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="issue-size">Size (optional)</label>
              <select
                id="issue-size"
                value={form.size}
                onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))}
              >
                <option value="">No Size</option>
                {sizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="issue-weight">Out Weight</label>
              <input
                id="issue-weight"
                type="number"
                step="0.001"
                value={form.out_weight}
                onChange={(event) => setForm((prev) => ({ ...prev, out_weight: event.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="issue-qty">Out Quantity</label>
              <input
                id="issue-qty"
                type="number"
                value={form.out_quantity}
                onChange={(event) => setForm((prev) => ({ ...prev, out_quantity: event.target.value }))}
                required
              />
            </div>

            <div className="form-group form-full">
              <label htmlFor="issue-desc">Description</label>
              <input
                id="issue-desc"
                type="text"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Optional description"
              />
            </div>

            {formError && <p className="error form-full">{formError}</p>}

            <div className="modal-actions form-full">
              <button type="submit" disabled={submitting || duplicateSelection}>
                {submitting ? "Saving..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default IssueMasterCreatePage;
