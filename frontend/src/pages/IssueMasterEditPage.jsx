import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchItems } from "../store/itemMasterSlice";
import { fetchSizes } from "../store/sizeMasterSlice";
import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  getIssueMaster,
  listIssueMasters,
  updateIssueMaster,
} from "../api/mgmt";

const MASTER_TABS = [
  { key: "vendor_master", label: "Vendor-Master" },
  { key: "item_master", label: "Item-Master" },
  { key: "size_master", label: "Size-Master" },
  { key: "wax_receive", label: "Wax-Receive" },
  { key: "issue_master", label: "Issue-Master" },
  { key: "stock_management", label: "StockManagement" },
];

const IssueMasterEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
  const [existing, setExisting] = useState([]);

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
    dispatch(fetchItems());
    dispatch(fetchSizes());
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getIssueMaster(id), listIssueMasters()])
      .then(([record, allRecords]) => {
        if (!isMounted) return;
        setForm({
          item: String(record.item),
          size: String(record.size),
          out_weight: String(record.out_weight),
          out_quantity: String(record.out_quantity),
          description: record.description || "",
        });
        setExisting(allRecords || []);
      })
      .catch(() => {
        if (!isMounted) return;
        setForm({
          item: "",
          size: "",
          out_weight: "",
          out_quantity: "",
          description: "",
        });
        setExisting([]);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const selectedItemId = form.item ? String(form.item) : "";
  const selectedSizeId = form.size ? String(form.size) : "";
  const duplicateRecord = existing.find(
    (record) =>
      String(record.item) === selectedItemId &&
      String(record.size) === selectedSizeId &&
      String(record.id) !== String(id),
  );
  const isDuplicateSelection = Boolean(duplicateRecord);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.item || !form.size || !form.out_weight || !form.out_quantity) {
      setFormError("Item, size, weight and quantity are required.");
      return;
    }

    if (isDuplicateSelection) {
      setFormError("Issue record for this item and size already exists.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        item: Number(form.item),
        size: Number(form.size),
        out_weight: Number(form.out_weight),
        out_quantity: Number(form.out_quantity),
        description: form.description,
      };
      await updateIssueMaster({ id, payload });
      navigate(-1);
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to update issue record.";
      setFormError(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`dashboard-shell ${sidebarCollapsed && sidebarOpen ? "sidebar-push" : ""}`}>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
        <span>Modules</span>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => {
          setSidebarCollapsed((prev) => {
            const next = !prev;
            setSidebarOpen(!next);
            return next;
          });
        }}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? "X" : "X"}
        </button>
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
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <div
        className={`sidebar-backdrop ${sidebarOpen && !sidebarCollapsed ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <section className="dashboard-main">
        <header className="topbar">
          <button
            type="button"
            className={`hamburger ${sidebarCollapsed && !sidebarOpen ? "always" : ""}`}
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen(true)}
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
              <h2>Edit Issue</h2>
              <p>Update an issue master record.</p>
            </div>
            <div className="action-group">
              <button type="button" className="small-btn" onClick={() => navigate(-1)}>
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
              <label htmlFor="issue-size">Size</label>
              <select
                id="issue-size"
                value={form.size}
                onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))}
                required
              >
                <option value="">Select size</option>
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
              <button type="submit" disabled={submitting || isDuplicateSelection}>
                {submitting ? "Saving..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default IssueMasterEditPage;
