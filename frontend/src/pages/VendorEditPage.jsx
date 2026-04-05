import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchItems } from "../store/itemMasterSlice";
import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  createVendorModel,
  getVendorList,
  listVendorModels,
  updateVendorList,
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

const VendorEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const items = useSelector((state) => state.itemMaster.records);

  const [vendorName, setVendorName] = useState("");
  const [vendor, setVendor] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

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
    Promise.all([getVendorList(id), listVendorModels({ vendorId: id })])
      .then(([vendorRecord, models]) => {
        if (!isMounted) return;
        setVendor(vendorRecord);
        setVendorName(vendorRecord.vendor_name || "");
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

  const handleUpdateVendor = async (event) => {
    event.preventDefault();
    setUpdateError("");

    if (!vendor?.id) {
      setUpdateError("Vendor not found.");
      return;
    }

    if (!vendorName.trim()) {
      setUpdateError("Vendor name is required.");
      return;
    }

    setUpdating(true);
    try {
      const updated = await updateVendorList({
        id: vendor.id,
        payload: { vendor_name: vendorName.trim() },
      });
      setVendor(updated);
      setVendorName(updated.vendor_name || "");
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail ||
        requestError?.response?.data?.vendor_name?.[0] ||
        "Unable to update vendor.";
      setUpdateError(apiMessage);
    } finally {
      setUpdating(false);
    }
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
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">Modules</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              type="button"
              key={item}
              className={`nav-item ${item === "Vendor-Master" ? "active" : ""}`}
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
              <h2>Edit Vendor</h2>
              <p>Update vendor info and add item rates.</p>
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

          {!vendor ? (
            <p className="error">Vendor not found.</p>
          ) : (
            <>
              <form className="form" onSubmit={handleUpdateVendor}>
                <label htmlFor="vendor-edit-name">Vendor Name</label>
                <input
                  id="vendor-edit-name"
                  type="text"
                  value={vendorName}
                  onChange={(event) => setVendorName(event.target.value)}
                  placeholder="Enter vendor name"
                  required
                />

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
            </>
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
                        {vendor ? "No items yet." : "Update vendor to add items."}
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

export default VendorEditPage;
