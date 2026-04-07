import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { useAuth } from "../components/AuthProvider";
import { fetchItems } from "../store/itemMasterSlice";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  createVendorModel,
  listVendorLists,
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

const VendorItemCreatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);

  const items = useSelector((state) => state.itemMaster.records);

  const [vendor, setVendor] = useState(null);
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
    let isMounted = true;
    Promise.all([listVendorLists(), listVendorModels({ vendorId: id })])
      .then(([vendorLists, models]) => {
        if (!isMounted) return;
        setVendor(vendorLists.find((entry) => String(entry.id) === String(id)) || null);
        setVendorItems(models);
      })
      .catch(() => {
        if (!isMounted) return;
        setVendor(null);
        setVendorItems([]);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleAddItem = async (event) => {
    event.preventDefault();
    setItemError("");

    if (!vendor?.id) {
      setItemError("Vendor not found.");
      return;
    }

    if (!itemForm.item_name || !itemForm.rate) {
      setItemError("Item name and rate are required.");
      return;
    }

    const payload = {
      vendor: Number(id),
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
              <h2>Add Vendor Item</h2>
              <p>Vendor details are locked while you add new items.</p>
            </div>
            <div className="action-group">
              <button type="button" className="small-btn" onClick={() => navigate(`/vendors/${id}`)}>
                Back to Vendor
              </button>
            </div>
          </div>

          {!vendor ? (
            <p className="error">Vendor not found.</p>
          ) : (
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
            <h3>New Vendor Item</h3>
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
                        No items yet.
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

export default VendorItemCreatePage;
