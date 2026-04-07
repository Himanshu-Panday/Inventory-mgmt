import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { listWaxReceiveHistory } from "../api/mgmt";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { useNavigate } from "react-router-dom";
import { fetchWaxReceives, removeWaxReceive } from "../store/waxReceiveSlice";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const WaxReceivePanel = ({ canCreateUpdate, canDelete }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { records, loading, submitting, error } = useSelector((state) => state.waxReceive);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [filterVendorName, setFilterVendorName] = useState("");
  const { visibleCount, sentinelRef } = useInfiniteScroll(records.length);
  const filteredRecords = records.filter((record) =>
    filterVendorName
      ? record.vendor_name
          ?.toLowerCase()
          .includes(filterVendorName.trim().toLowerCase())
      : true,
  );
  const { visibleCount: visibleCountFiltered, sentinelRef: sentinelRefFiltered } =
    useInfiniteScroll(filteredRecords.length);
  const visibleRecords = filteredRecords.slice(0, visibleCountFiltered);

  useEffect(() => {
    dispatch(fetchWaxReceives());
  }, [dispatch]);

  const openHistoryModal = async (record) => {
    setHistoryTitle(`Wax Receive #${record.id}`);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const rows = await listWaxReceiveHistory(record.id);
      setHistoryRows(rows);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!canDelete) return;
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await dispatch(removeWaxReceive(deleteTarget.id)).unwrap();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err || "Unable to delete wax receive.");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((record) => record.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const confirmBulkDelete = async () => {
    if (!canDelete) return;
    if (selectedIds.length === 0) return;
    setDeleteError("");
    try {
      await Promise.all(selectedIds.map((id) => dispatch(removeWaxReceive(id)).unwrap()));
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      setDeleteError(err || "Unable to delete wax receives.");
    }
  };

  return (
    <div className="content-card vendor-panel">
      <div className="section-head vendor-head">
        <div>
          <h2>Wax Receive</h2>
          <p>Create wax receive entries for vendors.</p>
        </div>
        <div className="action-group vendor-head-actions">
          <div className="filter-field compact wax-search">
            <input
              id="wax-filter-vendor"
              type="text"
              value={filterVendorName}
              onChange={(event) => setFilterVendorName(event.target.value)}
              placeholder="Search Record"
              aria-label="Search Record"
            />
          </div>
          {selectedIds.length > 0 && canDelete && (
            <button
              type="button"
              className="add-btn danger"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={submitting}
            >
              Delete ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            className="action-btn add"
            onClick={() => navigate("/wax-receives/new")}
            disabled={!canCreateUpdate}
          >
            Add
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading wax receives...</p>
      ) : (
        <div className="table-wrap vendor-table">
          <table className="records-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      filteredRecords.length > 0 &&
                      selectedIds.length === filteredRecords.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>Date & Time</th>
                <th>Vendor Name</th>
                <th>Weight</th>
                <th>Quantity</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    No wax receive records found.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="clickable-row"
                    onClick={() => navigate(`/wax-receives/${record.id}`)}
                  >
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => toggleSelect(record.id)}
                      />
                    </td>
                    <td>{record.id}</td>
                    <td>{formatDateTime(record.date_time)}</td>
                    <td>{record.vendor_name}</td>
                    <td>{record.weight ?? 0}</td>
                    <td>{record.quantity ?? 0}</td>
                    <td>{record.total_amount ?? 0}</td>
                    <td>
                      <div className="action-group vendor-actions">
                        <button
                          type="button"
                          className="small-btn"
                          data-action="edit"
                          data-icon="✎"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/wax-receives/${record.id}/edit`);
                          }}
                          disabled={!canCreateUpdate}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="small-btn info"
                          data-action="history"
                          data-icon="⏱"
                          onClick={(event) => {
                            event.stopPropagation();
                            openHistoryModal(record);
                          }}
                        >
                          History
                        </button>
                        <button
                          type="button"
                          className="small-btn danger"
                          data-action="delete"
                          data-icon="X"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (canDelete) {
                              setDeleteTarget(record);
                            }
                          }}
                          disabled={submitting || !canDelete}
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
          {visibleCountFiltered < filteredRecords.length && (
            <div ref={sentinelRefFiltered} className="inline-loader" />
          )}
        </div>
      )}


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
};

export default WaxReceivePanel;
