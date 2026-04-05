import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchSizes } from "../store/sizeMasterSlice";
import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  getWaxReceive,
  getWaxReceiveLine,
  listVendorModels,
  updateWaxReceiveLine,
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

const WaxReceiveLineEditPage = () => {
  const { id, lineId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const sizes = useSelector((state) => state.sizeMaster.records);

  const [record, setRecord] = useState(null);
  const [line, setLine] = useState(null);
  const [vendorItems, setVendorItems] = useState([]);
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
      return [...MASTER_TABS.map((item) => item.label), "User Management"];
    }
    return MASTER_TABS.filter((tab) => permissionMap.get(tab.key)?.can_read).map(
      (tab) => tab.label,
    );
  }, [permissionMap, user]);

  useEffect(() => {
    if (sizes.length === 0) {
      dispatch(fetchSizes());
    }
  }, [dispatch, sizes.length]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getWaxReceive(id), getWaxReceiveLine(lineId)])
      .then(([waxRecord, lineRecord]) => {
        if (!isMounted) return;
        setRecord(waxRecord);
        setLine(lineRecord);
        setForm({
          item: String(lineRecord.item),
          size: lineRecord.size ? String(lineRecord.size) : "",
          in_weight: String(lineRecord.in_weight),
          in_quantity: String(lineRecord.in_quantity),
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setRecord(null);
        setLine(null);
      });
    return () => {
      isMounted = false;
    };
  }, [id, lineId]);

  useEffect(() => {
    if (!record?.vendor) {
      setVendorItems([]);
      return;
    }
    listVendorModels({ vendorId: record.vendor })
      .then(setVendorItems)
      .catch(() => setVendorItems([]));
  }, [record?.vendor]);

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
    return match?.rate ?? line?.rate ?? 0;
  }, [vendorItemOptions, form.item, line?.rate]);

  const amountPreview = useMemo(() => {
    const weight = Number(form.in_weight || 0);
    return (weight * Number(rate || 0)).toFixed(2);
  }, [form.in_weight, rate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!record?.id || !line?.id) {
      setFormError("Wax receive line not found.");
      return;
    }

    if (!form.item || !form.in_weight || !form.in_quantity) {
      setFormError("Item, weight and quantity are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("wax_receive", String(record.id));
      payload.append("item", String(form.item));
      if (form.size) {
        payload.append("size", String(form.size));
      }
      payload.append("in_weight", String(form.in_weight));
      payload.append("in_quantity", String(form.in_quantity));
      if (imageFile) {
        payload.append("image", imageFile);
      }
      await updateWaxReceiveLine({ id: line.id, payload });
      navigate(`/wax-receives/${id}`);
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to update wax receive line.";
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
              className={`nav-item ${item === "Wax-Receive" ? "active" : ""}`}
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
              <h2>Edit Wax Receive Line</h2>
              <p>Update line details for this wax receive record.</p>
            </div>
            <div className="action-group">
              <button
                type="button"
                className="small-btn"
                onClick={() => navigate(`/wax-receives/${id}`)}
              >
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
            </div>
          )}

          {!line ? (
            <p className="error">Wax receive line not found.</p>
          ) : (
            <div className="nested-card content-card">
              <h3>Line Details</h3>
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
                  <label htmlFor="wax-line-size">Size (optional)</label>
                  <select
                    id="wax-line-size"
                    value={form.size}
                    onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))}
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
                    {submitting ? "Saving..." : "Update Line"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default WaxReceiveLineEditPage;
