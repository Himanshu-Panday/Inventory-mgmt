import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchItems } from "../store/itemMasterSlice";
import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  createVendorList,
  createVendorModel,
  listVendorModels,
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

const VendorCreatePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);

  const items = useSelector((state) => state.itemMaster.records);

  const [vendorName, setVendorName] = useState("");
  const [vendor, setVendor] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [vendorItems, setVendorItems] = useState([]);
  const [itemForm, setItemForm] = useState({ item_name: "", rate: "" });
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [itemError, setItemError] = useState("");

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
    if (items.length === 0) {
      dispatch(fetchItems());
    }
  }, [dispatch, items.length]);

  useEffect(() => {
    if (!vendor?.id) {
      setVendorItems([]);
      return;
    }
    listVendorModels({ vendorId: vendor.id })
      .then(setVendorItems)
      .catch(() => setVendorItems([]));
  }, [vendor?.id]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleCreateVendor = async (event) => {
    event.preventDefault();
    setCreateError("");

    if (!vendorName.trim()) {
      setCreateError("Vendor name is required.");
      return;
    }

    setCreating(true);
    try {
      const created = await createVendorList({ vendor_name: vendorName.trim() });
      setVendor(created);
      setVendorName(created.vendor_name);
      const rows = await listVendorModels({ vendorId: created.id });
      setVendorItems(rows);
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail ||
        requestError?.response?.data?.vendor_name?.[0] ||
        "Unable to create vendor.";
      setCreateError(apiMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleAddItem = async (event) => {
    event.preventDefault();
    setItemError("");

    if (!vendor?.id) {
      setItemError("Create vendor first.");
      return;
    }

    if (!itemForm.item_name || !itemForm.rate) {
      setItemError("Item name and rate are required.");
      return;
    }

    const payload = {
      vendor: Number(vendor.id),
      item_name: Number(itemForm.item_name),
      rate: Number(itemForm.rate),
    };

    if (Number.isNaN(payload.rate)) {
      setItemError("Rate must be a valid number.");
      return;
    }

    setItemSubmitting(true);
    try {
      const saved = await createVendorModel(payload);
      setVendorItems((prev) => [...prev, saved]);
      setItemForm({ item_name: "", rate: "" });
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail ||
        requestError?.response?.data?.item_name?.[0] ||
        requestError?.response?.data?.rate?.[0] ||
        "Unable to save vendor item.";
      setItemError(apiMessage);
    } finally {
      setItemSubmitting(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar open">
        <div className="sidebar-header">
          <span>Modules</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              type="button"
              key={item}
              className={`nav-item ${item === "Vendor-Master" ? "active" : ""}`}
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

      <section className="dashboard-main" onClick={() => setProfileOpen(false)}>
        <header className="topbar">
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
              <h2>Create Vendor</h2>
              <p>Add vendor info and then add item rates.</p>
            </div>
            <div className="action-group">
              {vendor && (
                <button
                  type="button"
                  className="small-btn"
                  onClick={() => navigate(`/vendors/${vendor.id}`)}
                >
                  Open Detail
                </button>
              )}
              <button type="button" className="small-btn" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
          </div>

          <form className="form" onSubmit={handleCreateVendor}>
            <label htmlFor="vendor-create-name">Vendor Name</label>
            <input
              id="vendor-create-name"
              type="text"
              value={vendorName}
              onChange={(event) => setVendorName(event.target.value)}
              placeholder="Enter vendor name"
              required
            />

            {createError && <p className="error">{createError}</p>}

            <div className="modal-actions">
              <button type="submit" disabled={creating}>
                {creating ? "Saving..." : vendor ? "Update" : "Create"}
              </button>
            </div>
          </form>

          {vendor && (
            <div className="info-grid">
              <div>
                <span>Vendor</span>
                <strong>{vendor.vendor_name}</strong>
              </div>
              <div>
                <span>Created At</span>
                <strong>{formatDateTime(vendor.created_at)}</strong>
              </div>
              <div>
                <span>Created By</span>
                <strong>{vendor.created_by_email || "-"}</strong>
              </div>
            </div>
          )}

          <div className="nested-card content-card">
            <h3>Vendor Items</h3>
            <form className="form form-grid" onSubmit={handleAddItem}>
              <div className="form-group">
                <label htmlFor="vendor-item-name">Item Name</label>
                <select
                  id="vendor-item-name"
                  value={itemForm.item_name}
                  onChange={(event) =>
                    setItemForm((prev) => ({ ...prev, item_name: event.target.value }))
                  }
                  required
                  disabled={!vendor}
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
                <label htmlFor="vendor-item-rate">Rate</label>
                <input
                  id="vendor-item-rate"
                  type="number"
                  min="0"
                  step="1"
                  value={itemForm.rate}
                  onChange={(event) =>
                    setItemForm((prev) => ({ ...prev, rate: event.target.value }))
                  }
                  required
                  disabled={!vendor}
                />
              </div>

              {itemError && <p className="error form-full">{itemError}</p>}

              <div className="modal-actions form-full">
                <button type="submit" disabled={itemSubmitting || !vendor}>
                  {itemSubmitting ? "Saving..." : "Add Item"}
                </button>
              </div>
            </form>

            <div className="table-wrap">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Rate</th>
                    <th>Date & Time</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        {vendor ? "No items yet." : "Create vendor to add items."}
                      </td>
                    </tr>
                  ) : (
                    vendorItems.map((record) => (
                      <tr key={record.id}>
                        <td>{record.item_name_label}</td>
                        <td>{record.rate}</td>
                        <td>{formatDateTime(record.date_time)}</td>
                        <td>{record.created_by_email || "-"}</td>
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

export default VendorCreatePage;
