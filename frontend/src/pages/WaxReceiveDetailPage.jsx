import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchWaxReceives } from "../store/waxReceiveSlice";
import { useAuth } from "../components/AuthProvider";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";
import {
  deleteWaxReceiveLine,
  listWaxReceiveLineHistory,
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

const API_ROOT = import.meta.env.VITE_API_BASE_URL || window.location.origin;

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const resolveImageUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  return `${API_ROOT}${value}`;
};

const WaxReceiveDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const waxReceives = useSelector((state) => state.waxReceive.records);
  const [lines, setLines] = useState([]);
  const [loadingLines, setLoadingLines] = useState(true);
  const [viewImageUrl, setViewImageUrl] = useState("");
  const [lineHistoryOpen, setLineHistoryOpen] = useState(false);
  const [lineHistoryRows, setLineHistoryRows] = useState([]);
  const [lineHistoryTitle, setLineHistoryTitle] = useState("");
  const [lineHistoryLoading, setLineHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterItemName, setFilterItemName] = useState("");
  const [filterSizeName, setFilterSizeName] = useState("");
  const { visibleCount, sentinelRef } = useInfiniteScroll(lines.length);
  const itemOptions = Array.from(new Set(lines.map((line) => line.item_name).filter(Boolean)));
  const sizeOptions = Array.from(new Set(lines.map((line) => line.size_name).filter(Boolean)));
  const filteredLines = lines.filter((line) => {
    const itemMatch = filterItemName ? line.item_name === filterItemName : true;
    const sizeMatch = filterSizeName ? line.size_name === filterSizeName : true;
    return itemMatch && sizeMatch;
  });
  const { visibleCount: visibleCountFiltered, sentinelRef: sentinelRefFiltered } =
    useInfiniteScroll(filteredLines.length);
  const visibleLines = filteredLines.slice(0, visibleCountFiltered);

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

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (waxReceives.length === 0) {
      dispatch(fetchWaxReceives());
    }
  }, [dispatch, waxReceives.length]);

  useEffect(() => {
    setLoadingLines(true);
    listWaxReceiveLines(id)
      .then(setLines)
      .catch(() => setLines([]))
      .finally(() => setLoadingLines(false));
  }, [id]);

  const record = useMemo(
    () => waxReceives.find((entry) => String(entry.id) === String(id)),
    [waxReceives, id],
  );

  const openLineHistoryModal = async (line) => {
    setLineHistoryTitle(`${line.item_name} (${line.size_name})`);
    setLineHistoryLoading(true);
    setLineHistoryOpen(true);
    try {
      const rows = await listWaxReceiveLineHistory(line.id);
      setLineHistoryRows(rows);
    } catch {
      setLineHistoryRows([]);
    } finally {
      setLineHistoryLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteWaxReceiveLine(deleteTarget.id);
      setLines((prev) => prev.filter((entry) => entry.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to delete wax receive line.";
      setDeleteError(apiMessage);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === lines.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(lines.map((line) => line.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      await Promise.all(selectedIds.map((lineId) => deleteWaxReceiveLine(lineId)));
      setLines((prev) => prev.filter((entry) => !selectedIds.includes(entry.id)));
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to delete wax receive lines.";
      setDeleteError(apiMessage);
    } finally {
      setDeleting(false);
    }
  };

  const content = !record ? (
    <div className="content-card">
      <h2>Wax Receive</h2>
      <p>Record not found.</p>
      <button type="button" className="small-btn" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  ) : (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Wax Receive #{record.id}</h2>
          <p>
            Vendor: {record.vendor_name} | Date: {formatDateTime(record.date_time)}
          </p>
        </div>
        <div className="item-toolbar">
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="small-btn danger"
              onClick={() => setBulkDeleteOpen(true)}
            >
              Delete ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            className="add-btn"
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </button>
          <button
            type="button"
            className="add-btn"
            onClick={() => navigate(`/wax-receives/${id}/lines/new`)}
          >
            Add Line
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={lines.length > 0 && selectedIds.length === lines.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Item</th>
              <th>Size</th>
              <th>Weight</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingLines ? (
              <tr>
                <td colSpan="8" className="empty-row">
                  Loading lines...
                </td>
              </tr>
            ) : lines.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-row">
                  No lines yet.
                </td>
              </tr>
            ) : (
              visibleLines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(line.id)}
                      onChange={() => toggleSelect(line.id)}
                    />
                  </td>
                  <td>{line.item_name}</td>
                  <td>{line.size_name}</td>
                  <td>{line.in_weight}</td>
                  <td>{line.in_quantity}</td>
                  <td>{line.rate}</td>
                  <td>{line.amount}</td>
                  <td>
                    <div className="action-group">
                      <button
                        type="button"
                        className="small-btn info icon-btn"
                        data-action="view"
                        data-icon="eye"
                        aria-label="View"
                        onClick={() => setViewImageUrl(line.image || "")}
                        disabled={!line.image}
                      >
                        <span className="sr-only">View</span>
                      </button>
                      <button
                        type="button"
                        className="small-btn"
                        data-action="edit"
                        data-icon="✎"
                        onClick={() => navigate(`/wax-receives/${id}/lines/${line.id}/edit`)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="small-btn info"
                        data-action="history"
                        data-icon="⏱"
                        onClick={() => openLineHistoryModal(line)}
                      >
                        History
                      </button>
                      <button
                        type="button"
                        className="small-btn danger"
                        data-action="delete"
                        data-icon="✖"
                        onClick={() => {
                          setDeleteError("");
                          setDeleteTarget(line);
                        }}
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
        {visibleCountFiltered < filteredLines.length && (
          <div ref={sentinelRefFiltered} className="inline-loader" />
        )}
      </div>

      {viewImageUrl && (
        <div className="modal-overlay" onClick={() => setViewImageUrl("")}>
          <div className="modal-card image-card" onClick={(event) => event.stopPropagation()}>
            <h3>Wax Receive Line Image</h3>
            <img
              className="image-preview"
              src={resolveImageUrl(viewImageUrl)}
              alt="Wax receive line"
            />
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setViewImageUrl("")}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {filtersOpen && (
        <div className="modal-overlay" onClick={() => setFiltersOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Filters</h3>
            <div className="filter-row">
              <div className="filter-field">
                <label htmlFor="wax-detail-filter-item">Item Name</label>
                <select
                  id="wax-detail-filter-item"
                  value={filterItemName}
                  onChange={(event) => setFilterItemName(event.target.value)}
                >
                  <option value="">All items</option>
                  {itemOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="wax-detail-filter-size">Size</label>
                <select
                  id="wax-detail-filter-size"
                  value={filterSizeName}
                  onChange={(event) => setFilterSizeName(event.target.value)}
                >
                  <option value="">All sizes</option>
                  {sizeOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setFiltersOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {lineHistoryOpen && (
        <div className="modal-overlay" onClick={() => setLineHistoryOpen(false)}>
          <div className="modal-card history-card" onClick={(event) => event.stopPropagation()}>
            <h3>History - {lineHistoryTitle}</h3>
            {lineHistoryLoading ? (
              <p>Loading history...</p>
            ) : lineHistoryRows.length === 0 ? (
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
                    {lineHistoryRows.map((row) => (
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
              <button type="button" className="secondary-btn" onClick={() => setLineHistoryOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!deleting) {
              setDeleteTarget(null);
              setDeleteError("");
            }
          }}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this?</p>
            {deleteError && <p className="error">{deleteError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  if (!deleting) {
                    setDeleteTarget(null);
                    setDeleteError("");
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="small-btn danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteOpen && (
        <div className="modal-overlay" onClick={() => setBulkDeleteOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete {selectedIds.length} lines?</p>
            {deleteError && <p className="error">{deleteError}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setBulkDeleteOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="small-btn danger"
                onClick={confirmBulkDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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

        {content}
      </section>
    </div>
  );
};

export default WaxReceiveDetailPage;
