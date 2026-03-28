import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchWaxReceives } from "../store/waxReceiveSlice";
import { fetchSizes } from "../store/sizeMasterSlice";
import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  createWaxReceiveLine,
  listVendorModels,
  listWaxReceiveLines,
} from "../api/mgmt";

const MASTER_TABS = [
  { key: "vendor_master", label: "Vendor-Master" },
  { key: "item_master", label: "Item-Master" },
  { key: "size_master", label: "Size-Master" },
  { key: "wax_receive", label: "Wax-Receive" },
  { key: "issue_master", label: "Issue-Master" },
  { key: "stock_management", label: "StockManagement" },
];

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const WaxReceiveLineCreatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const waxReceives = useSelector((state) => state.waxReceive.records);
  const sizes = useSelector((state) => state.sizeMaster.records);

  const [vendorItems, setVendorItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [form, setForm] = useState({ item: "", size: "", in_weight: "", in_quantity: "" });
  const [imageFile, setImageFile] = useState(null);
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
      return [...MASTER_TABS.map((item) => item.label), "User Management", "Deleted Records"];
    }
    return MASTER_TABS.filter((tab) => permissionMap.get(tab.key)?.can_read).map(
      (tab) => tab.label,
    );
  }, [permissionMap, user]);

  const record = useMemo(
    () => waxReceives.find((entry) => String(entry.id) === String(id)),
    [waxReceives, id],
  );

  useEffect(() => {
    if (waxReceives.length === 0) {
      dispatch(fetchWaxReceives());
    }
    if (sizes.length === 0) {
      dispatch(fetchSizes());
    }
  }, [dispatch, waxReceives.length, sizes.length]);

  useEffect(() => {
    if (!record?.vendor) {
      setVendorItems([]);
      return;
    }
    listVendorModels({ vendorId: record.vendor })
      .then(setVendorItems)
      .catch(() => setVendorItems([]));
  }, [record?.vendor]);

  useEffect(() => {
    listWaxReceiveLines(id)
      .then(setLines)
      .catch(() => setLines([]));
  }, [id]);

  const vendorItemOptions = useMemo(
    () =>
      vendorItems.map((vendor) => ({
        id: vendor.item_name,
        label: vendor.item_name_label,
        rate: vendor.rate,
      })),
    [vendorItems],
  );

  const rate = useMemo(() => {
    const match = vendorItemOptions.find((item) => String(item.id) === String(form.item));
    return match?.rate ?? 0;
  }, [vendorItemOptions, form.item]);

  const amountPreview = useMemo(() => {
    const weight = Number(form.in_weight || 0);
    return (weight * rate).toFixed(2);
  }, [form.in_weight, rate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!record?.id) {
      setFormError("Wax receive record not found.");
      return;
    }

    if (!form.item || !form.size || !form.in_weight || !form.in_quantity) {
      setFormError("Item, size, weight and quantity are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("wax_receive", String(record.id));
      payload.append("item", String(form.item));
      payload.append("size", String(form.size));
      payload.append("in_weight", String(form.in_weight));
      payload.append("in_quantity", String(form.in_quantity));
      if (imageFile) {
        payload.append("image", imageFile);
      }
      await createWaxReceiveLine(payload);
      const refreshed = await listWaxReceiveLines(record.id);
      setLines(refreshed);
      setForm({ item: "", size: "", in_weight: "", in_quantity: "" });
      setImageFile(null);
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to save wax receive line.";
      setFormError(apiMessage);
    } finally {
      setSubmitting(false);
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
              className={`nav-item ${item === "Wax-Receive" ? "active" : ""}`}
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
              <h2>Wax Receive Line</h2>
              <p>Add a line to the selected wax receive record.</p>
            </div>
            <div className="action-group">
              <button type="button" className="small-btn" onClick={() => navigate(`/wax-receives/${id}`)}>
                Back to Record
              </button>
            </div>
          </div>

          {!record ? (
            <p className="error">Wax receive record not found.</p>
          ) : (
            <div className="info-grid">
              <div>
                <span>Vendor</span>
                <strong>{record.vendor_name}</strong>
              </div>
              <div>
                <span>Date & Time</span>
                <strong>{formatDateTime(record.date_time)}</strong>
              </div>
              <div>
                <span>Weight</span>
                <strong>{record.weight ?? 0}</strong>
              </div>
              <div>
                <span>Quantity</span>
                <strong>{record.quantity ?? 0}</strong>
              </div>
              <div>
                <span>Total Amount</span>
                <strong>{record.total_amount ?? 0}</strong>
              </div>
            </div>
          )}

          <div className="nested-card content-card">
            <h3>New Line</h3>
            <form className="form form-grid" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="wax-line-item">Item</label>
                <select
                  id="wax-line-item"
                  value={form.item}
                  onChange={(event) => setForm((prev) => ({ ...prev, item: event.target.value }))}
                  required
                  disabled={!record}
                >
                  <option value="">Select item</option>
                  {vendorItemOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="wax-line-size">Size</label>
                <select
                  id="wax-line-size"
                  value={form.size}
                  onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))}
                  required
                  disabled={!record}
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
                <label htmlFor="wax-line-weight">Weight (in_weight)</label>
                <input
                  id="wax-line-weight"
                  type="number"
                  step="0.001"
                  value={form.in_weight}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, in_weight: event.target.value }))
                  }
                  required
                  disabled={!record}
                />
              </div>

              <div className="form-group">
                <label htmlFor="wax-line-qty">Quantity (in_quantity)</label>
                <input
                  id="wax-line-qty"
                  type="number"
                  value={form.in_quantity}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, in_quantity: event.target.value }))
                  }
                  required
                  disabled={!record}
                />
              </div>

              <div className="form-group">
                <label htmlFor="wax-line-rate">Rate</label>
                <input id="wax-line-rate" type="number" value={rate} readOnly />
              </div>

              <div className="form-group">
                <label htmlFor="wax-line-amount">Amount</label>
                <input id="wax-line-amount" type="text" value={amountPreview} readOnly />
              </div>

              <div className="form-group">
                <label htmlFor="wax-line-image">Image</label>
                <input
                  id="wax-line-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  disabled={!record}
                />
              </div>

              {formError && <p className="error form-full">{formError}</p>}

              <div className="modal-actions form-full">
                <button type="submit" disabled={submitting || !record}>
                  {submitting ? "Saving..." : "Add Line"}
                </button>
              </div>
            </form>

            <div className="table-wrap">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Size</th>
                    <th>Weight</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No lines yet.
                      </td>
                    </tr>
                  ) : (
                    lines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.item_name}</td>
                        <td>{line.size_name}</td>
                        <td>{line.in_weight}</td>
                        <td>{line.in_quantity}</td>
                        <td>{line.rate}</td>
                        <td>{line.amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WaxReceiveLineCreatePage;
