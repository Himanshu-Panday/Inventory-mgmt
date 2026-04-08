import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchItems } from "../store/itemMasterSlice";
import { fetchSizes } from "../store/sizeMasterSlice";
import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  createWaxReceiveLine,
  getWaxReceive,
  listVendorLists,
  listVendorModels,
  listWaxReceiveLines,
  updateWaxReceive,
} from "../api/mgmt";

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


const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const WaxReceiveEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = useSelector((state) => state.itemMaster.records);
  const sizes = useSelector((state) => state.sizeMaster.records);

  const [vendors, setVendors] = useState([]);
  const [vendorId, setVendorId] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [record, setRecord] = useState(null);
  const [vendorItems, setVendorItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [lineForm, setLineForm] = useState({ item: "", size: "", in_weight: "", in_quantity: "" });
  const [imageFile, setImageFile] = useState(null);
  const [lineError, setLineError] = useState("");
  const [lineSubmitting, setLineSubmitting] = useState(false);

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
    const match = vendorItemOptions.find((item) => String(item.id) === String(lineForm.item));
    return match?.rate ?? 0;
  }, [vendorItemOptions, lineForm.item]);

  const amountPreview = useMemo(() => {
    const weight = Number(lineForm.in_weight || 0);
    return (weight * rate).toFixed(2);
  }, [lineForm.in_weight, rate]);

  useEffect(() => {
    if (items.length === 0) dispatch(fetchItems());
    if (sizes.length === 0) dispatch(fetchSizes());
    listVendorLists().then(setVendors).catch(() => setVendors([]));
  }, [dispatch, items.length, sizes.length]);

  useEffect(() => {
    let isMounted = true;
    getWaxReceive(id)
      .then((data) => {
        if (!isMounted) return;
        setRecord(data);
        setVendorId(String(data.vendor));
      })
      .catch(() => {
        if (!isMounted) return;
        setRecord(null);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

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
    if (!record?.id) {
      setLines([]);
      return;
    }
    listWaxReceiveLines(record.id)
      .then(setLines)
      .catch(() => setLines([]));
  }, [record?.id]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setUpdateError("");

    if (!record?.id) {
      setUpdateError("Wax receive record not found.");
      return;
    }

    if (!vendorId) {
      setUpdateError("Vendor name is required.");
      return;
    }

    setUpdating(true);
    try {
      const updated = await updateWaxReceive({ id: record.id, payload: { vendor: Number(vendorId) } });
      setRecord(updated);
      setVendorId(String(updated.vendor));
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.detail || "Unable to update wax receive.";
      setUpdateError(apiMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddLine = async (event) => {
    event.preventDefault();
    setLineError("");

    if (!record?.id) {
      setLineError("Wax receive record not found.");
      return;
    }

    if (!lineForm.item || !lineForm.in_weight || !lineForm.in_quantity) {
      setLineError("Item, weight and quantity are required.");
      return;
    }

    setLineSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("wax_receive", String(record.id));
      payload.append("item", String(lineForm.item));
      if (lineForm.size) {
        payload.append("size", String(lineForm.size));
      }
      payload.append("in_weight", String(lineForm.in_weight));
      payload.append("in_quantity", String(lineForm.in_quantity));
      if (imageFile) {
        payload.append("image", imageFile);
      }
      await createWaxReceiveLine(payload);
      const refreshed = await listWaxReceiveLines(record.id);
      setLines(refreshed);
      setLineForm({ item: "", size: "", in_weight: "", in_quantity: "" });
      setImageFile(null);
    } catch (requestError) {
      const apiMessage = requestError?.response?.data?.detail || "Unable to save wax receive line.";
      setLineError(apiMessage);
    } finally {
      setLineSubmitting(false);
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
              className={`nav-item ${item === "Wax-Receive" ? "active" : ""}`}
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
              <h2>Edit Wax Receive</h2>
              <p>Update the vendor and add lines if needed.</p>
            </div>
            <div className="action-group">
              {record && (
                <button
                  type="button"
                  className="small-btn"
                  onClick={() => navigate(`/wax-receives/${record.id}`)}
                >
                  Open Detail
                </button>
              )}
              <button type="button" className="small-btn" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
          </div>

          {!record ? (
            <p className="error">Wax receive record not found.</p>
          ) : (
            <>
              <form className="form" onSubmit={handleUpdate}>
                <label htmlFor="wax-edit-vendor">Vendor Name</label>
                <select
                  id="wax-edit-vendor"
                  value={vendorId}
                  onChange={(event) => setVendorId(event.target.value)}
                  required
                >
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.vendor_name}
                    </option>
                  ))}
                </select>

                {updateError && <p className="error">{updateError}</p>}

                <div className="modal-actions">
                  <button type="submit" disabled={updating}>
                    {updating ? "Saving..." : "Update"}
                  </button>
                </div>
              </form>

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
            </>
          )}

          <div className="nested-card content-card">
            <h3>Wax Receive Lines</h3>
            <form className="form form-grid" onSubmit={handleAddLine}>
              <div className="form-group">
                <label htmlFor="wax-line-item">Item</label>
                <select
                  id="wax-line-item"
                  value={lineForm.item}
                  onChange={(event) =>
                    setLineForm((prev) => ({ ...prev, item: event.target.value }))
                  }
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
                  value={lineForm.size}
                  onChange={(event) =>
                    setLineForm((prev) => ({ ...prev, size: event.target.value }))
                  }
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
                  value={lineForm.in_weight}
                  onChange={(event) =>
                    setLineForm((prev) => ({ ...prev, in_weight: event.target.value }))
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
                  value={lineForm.in_quantity}
                  onChange={(event) =>
                    setLineForm((prev) => ({ ...prev, in_quantity: event.target.value }))
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

              {lineError && <p className="error form-full">{lineError}</p>}

              <div className="modal-actions form-full">
                <button type="submit" disabled={lineSubmitting || !record}>
                  {lineSubmitting ? "Saving..." : "Add Line"}
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
                        {record ? "No lines yet." : "Create a wax receive to add lines."}
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

export default WaxReceiveEditPage;
