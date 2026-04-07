import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import useInfiniteScroll from "../hooks/useInfiniteScroll";
import {
  fetchIssueMasters,
  removeIssueMaster,
} from "../store/issueMasterSlice";
import { listIssueMasterHistory } from "../api/mgmt";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const IssueMasterPanel = ({ canCreateUpdate, canDelete }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { records, loading, submitting, error } = useSelector((state) => state.issueMaster);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const { visibleCount, sentinelRef } = useInfiniteScroll(records.length);
  const visibleRecords = records.slice(0, visibleCount);
  useEffect(() => {
    dispatch(fetchIssueMasters());
  }, [dispatch]);

  const openHistoryModal = async (record) => {
    setHistoryTitle(`${record.item_name} - ${record.size_name}`);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const rows = await listIssueMasterHistory(record.id);
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
      await dispatch(removeIssueMaster(deleteTarget.id)).unwrap();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err || "Unable to delete issue.");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((record) => record.id));
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
      await Promise.all(selectedIds.map((id) => dispatch(removeIssueMaster(id)).unwrap()));
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      setDeleteError(err || "Unable to delete issues.");
    }
  };

  return (
    <div className="content-card vendor-panel">
      <div className="section-head vendor-head">
        <div>
          <h2>Issue Master</h2>
          <p>Record item issues.</p>
        </div>
        <div className="action-group vendor-head-actions">
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
            onClick={() => navigate("/issue-masters/new")}
            disabled={!canCreateUpdate}
          >
            Add
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading issues...</p>
      ) : (
        <div className="table-wrap vendor-table">
          <table className="records-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={records.length > 0 && selectedIds.length === records.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>Date & Time</th>
                <th>Item</th>
                <th>Size</th>
                <th>Out Weight</th>
                <th>Out Quantity</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-row">
                    No issue records found.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => toggleSelect(record.id)}
                      />
                    </td>
                    <td>{record.id}</td>
                    <td>{formatDateTime(record.date_time)}</td>
                    <td>{record.item_name}</td>
                    <td>{record.size_name}</td>
                    <td>{record.out_weight}</td>
                    <td>{record.out_quantity}</td>
                    <td>{record.description || "-"}</td>
                    <td>
                      <div className="action-group vendor-actions">
                        <button
                          type="button"
                          className="small-btn"
                          data-action="edit"
                          data-icon="✎"
                        onClick={() => navigate(`/issue-masters/${record.id}/edit`)}
                        disabled={!canCreateUpdate}
                      >
                        Edit
                      </button>
                        <button
                          type="button"
                          className="small-btn info"
                          data-action="history"
                          data-icon="⏱"
                          onClick={() => openHistoryModal(record)}
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
          {visibleCount < records.length && <div ref={sentinelRef} className="inline-loader" />}
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

export default IssueMasterPanel;
