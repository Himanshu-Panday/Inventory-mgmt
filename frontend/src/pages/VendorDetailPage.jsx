import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { useAuth } from "../components/AuthProvider";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  deleteVendorModel,
  listVendorListHistory,
  listVendorLists,
  listVendorModelHistory,
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

const VendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [vendorItems, setVendorItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersClosing, setFiltersClosing] = useState(false);
  const [filterItemName, setFilterItemName] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const { visibleCount, sentinelRef } = useInfiniteScroll(vendorItems.length);
  const itemNameOptions = Array.from(
    new Set(vendorItems.map((record) => record.item_name_label).filter(Boolean)),
  );
  const createdByOptions = Array.from(
    new Set(vendorItems.map((record) => record.created_by_email).filter(Boolean)),
  );
  const filteredVendorItems = vendorItems.filter((record) => {
    const itemMatch = filterItemName ? record.item_name_label === filterItemName : true;
    const createdMatch = filterCreatedBy ? record.created_by_email === filterCreatedBy : true;
    return itemMatch && createdMatch;
  });
  const { visibleCount: visibleCountFiltered, sentinelRef: sentinelRefFiltered } =
    useInfiniteScroll(filteredVendorItems.length);
  const visibleVendorItems = filteredVendorItems.slice(0, visibleCountFiltered);

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
    const items = MASTER_TABS.filter((tab) => permissionMap.get(tab.key)?.can_read).map(
      (tab) => tab.label,
    );
    if (permissionMap.get("deleted_records")?.can_read) {
      items.push("Deleted Records");
    }
    return items;
  }, [permissionMap, user]);

  const permission = useMemo(() => {
    if (!user) return {};
    if (user.role === "admin") {
      return { can_create_update: true, can_delete: true };
    }
    return (
      user.master_permissions?.find((entry) => entry.master_name === "vendor_master") || {}
    );
  }, [user]);

  const canCreateUpdate = user?.role === "admin" || Boolean(permission.can_create_update);
  const canDelete = user?.role === "admin" || Boolean(permission.can_delete);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openFilters = () => {
    setFiltersClosing(false);
    setFiltersOpen(true);
  };

  const closeFilters = () => {
    if (filtersClosing) return;
    setFiltersClosing(true);
    window.setTimeout(() => {
      setFiltersOpen(false);
      setFiltersClosing(false);
    }, 200);
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
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
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const openHistoryModal = async (record, type) => {
    setHistoryTitle(type === "vendor" ? vendor?.vendor_name || "Vendor" : record.item_name_label);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const rows =
        type === "vendor"
          ? await listVendorListHistory(id)
          : await listVendorModelHistory(record.id);
      setHistoryRows(rows);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await deleteVendorModel(deleteTarget.id);
      setVendorItems((prev) => prev.filter((record) => record.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const apiMessage =
        err?.response?.data?.detail || "Unable to delete vendor item.";
      setDeleteError(apiMessage);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === vendorItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(vendorItems.map((record) => record.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleteError("");
    try {
      await Promise.all(selectedIds.map((id) => deleteVendorModel(id)));
      setVendorItems((prev) => prev.filter((record) => !selectedIds.includes(record.id)));
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      const apiMessage =
        err?.response?.data?.detail || "Unable to delete vendor items.";
      setDeleteError(apiMessage);
    }
  };

  const content = loading ? (
    <div className="content-card">
      <h2>Vendor Items</h2>
      <p>Loading vendor details...</p>
    </div>
  ) : !vendor ? (
    <div className="content-card">
      <h2>Vendor Items</h2>
      <p>Vendor not found.</p>
      <button type="button" className="small-btn" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  ) : (
    <div className="content-card vendor-panel">
        <div className="section-head vendor-head">
          <div>
            <h2>{vendor.vendor_name}</h2>
            <p>Manage vendor item rates.</p>
          </div>
          <div className="action-group vendor-head-actions">
            <button
              type="button"
              className="action-btn filter"
              onClick={openFilters}
            >
              Filters
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                className="add-btn danger"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={!canDelete}
              >
                Delete ({selectedIds.length})
              </button>
            )}
            <button
              type="button"
              className="action-btn add"
              onClick={() => navigate(`/vendors/${id}/items/new`)}
              disabled={!canCreateUpdate}
            >
              Add
            </button>
          </div>
      </div>

      <div className="table-wrap vendor-table">
        <table className="records-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={vendorItems.length > 0 && selectedIds.length === vendorItems.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Item Name</th>
                    <th>Rate</th>
                    <th>Date & Time</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No vendor items found.
                      </td>
                    </tr>
                  ) : (
                    visibleVendorItems.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(record.id)}
                            onChange={() => toggleSelect(record.id)}
                          />
                        </td>
                        <td>{record.item_name_label}</td>
                        <td>{record.rate}</td>
                        <td>{formatDateTime(record.date_time)}</td>
                        <td>{record.created_by_email || "-"}</td>
                        <td>
                    <div className="action-group vendor-actions">
                      <button
                        type="button"
                        className="small-btn"
                        data-action="edit"
                        data-icon="✎"
                        onClick={() => navigate(`/vendors/${id}/items/${record.id}/edit`)}
                        disabled={!canCreateUpdate}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="small-btn info"
                        data-action="history"
                        data-icon="⏱"
                        onClick={() => openHistoryModal(record, "item")}
                      >
                        History
                      </button>
                      <button
                        type="button"
                        className="small-btn danger"
                        data-action="delete"
                        data-icon="✖"
                        onClick={() => setDeleteTarget(record)}
                        disabled={!canDelete}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {visibleCountFiltered < filteredVendorItems.length && (
          <div ref={sentinelRefFiltered} className="inline-loader" />
        )}
      </div>

      {historyOpen && (
        <div className="modal-overlay" onClick={() => setHistoryOpen(false)}>
          <div className="modal-card history-card" onClick={(event) => event.stopPropagation()}>
            <h3>History - {historyTitle}</h3>
            {historyLoading ? (
              <p>Loading history...</p>
            ) : historyRows.length === 0 ? (
              <p>No history available.</p>
            ) : (
              <div className="table-wrap">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Modified By</th>
                      <th>Modified At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.action}</td>
                        <td>{row.actor_name || row.actor_email || "-"}</td>
                        <td>{formatDateTime(row.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setHistoryOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {filtersOpen && (
        <div className="modal-overlay filter-overlay" onClick={closeFilters}>
          <div
            className={`modal-card filter-card ${filtersClosing ? "closing" : ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Filters</h3>
            <div className="filter-row">
              <div className="filter-field">
                <label htmlFor="vendor-detail-filter-item">Item Name</label>
                <select
                  id="vendor-detail-filter-item"
                  value={filterItemName}
                  onChange={(event) => setFilterItemName(event.target.value)}
                >
                  <option value="">All items</option>
                  {itemNameOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="vendor-detail-filter-created">Created By</label>
                <select
                  id="vendor-detail-filter-created"
                  value={filterCreatedBy}
                  onChange={(event) => setFilterCreatedBy(event.target.value)}
                >
                  <option value="">All creators</option>
                  {createdByOptions.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeFilters}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this?</p>
            {deleteError && <p className="error">{deleteError}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="small-btn danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteOpen && (
        <div className="modal-overlay" onClick={() => {
          setBulkDeleteOpen(false);
          setDeleteError("");
        }}>
          <div className="modal-card delete-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete {selectedIds.length} records?</p>
            {deleteError && <p className="error">{deleteError}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setBulkDeleteOpen(false)}>
                Cancel
              </button>
              <button type="button" className="small-btn danger" onClick={confirmBulkDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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

        {content}
      </section>
    </div>
  );
};

export default VendorDetailPage;
