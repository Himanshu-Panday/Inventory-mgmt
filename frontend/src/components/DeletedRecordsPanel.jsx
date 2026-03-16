import { useEffect, useMemo, useState } from "react";

import { deleteDeletedRecord, listDeletedRecords, recoverDeletedRecord } from "../api/mgmt";
import useInfiniteScroll from "../hooks/useInfiniteScroll";

const TAB_DEFS = [
  { key: "vendor_list", label: "Vendor List" },
  { key: "vendor_model", label: "Vendor Model" },
  { key: "item_model", label: "Item Model" },
  { key: "size_model", label: "Size Model" },
  { key: "wax_receive", label: "Wax Receive" },
  { key: "wax_receive_line", label: "Wax Receive Line" },
  { key: "issue_master", label: "Issue Master" },
];

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const DeletedRecordsPanel = () => {
  const [activeTab, setActiveTab] = useState(TAB_DEFS[0].key);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recoveringId, setRecoveringId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const { visibleCount, sentinelRef } = useInfiniteScroll(records.length);
  const visibleRecords = records.slice(0, visibleCount);

  const tabLabel = useMemo(
    () => TAB_DEFS.find((tab) => tab.key === activeTab)?.label || "Deleted Records",
    [activeTab],
  );

  useEffect(() => {
    setLoading(true);
    setError("");
    listDeletedRecords(activeTab)
      .then((rows) => {
        setRecords(rows);
        setSelectedIds([]);
      })
      .catch(() => setError("Unable to load deleted records."))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const handleRecover = async (recordId) => {
    setRecoveringId(recordId);
    try {
      await recoverDeletedRecord(recordId);
      setRecords((prev) => prev.filter((record) => record.id !== recordId));
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to recover record.";
      setError(apiMessage);
    } finally {
      setRecoveringId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteDeletedRecord(deleteTarget.id);
      setRecords((prev) => prev.filter((record) => record.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to delete record.";
      setError(apiMessage);
    } finally {
      setDeletingId(null);
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
    setDeletingId("bulk");
    try {
      await Promise.all(selectedIds.map((id) => deleteDeletedRecord(id)));
      setRecords((prev) => prev.filter((record) => !selectedIds.includes(record.id)));
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to delete records.";
      setError(apiMessage);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Deleted Records</h2>
          <p>Recover deleted master records by category.</p>
        </div>
        {selectedIds.length > 0 && (
          <div className="action-group">
            <button
              type="button"
              className="small-btn danger"
              onClick={() => setBulkDeleteOpen(true)}
            >
              Delete ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      <div className="tab-row">
        {TAB_DEFS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading deleted records...</p>
      ) : (
        <div className="table-wrap">
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
                <th>Serial No.</th>
                <th>{tabLabel}</th>
                <th>Deleted At</th>
                <th>Deleted By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    No deleted records found.
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
                    <td>{record.object_id}</td>
                    <td>{record.display_name || "-"}</td>
                    <td>{formatDateTime(record.deleted_at)}</td>
                    <td>{record.deleted_by_email || "-"}</td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className="small-btn"
                          data-action="recover"
                          data-icon="↺"
                          onClick={() => handleRecover(record.id)}
                          disabled={recoveringId === record.id}
                        >
                          {recoveringId === record.id ? "Recovering..." : "Recover"}
                        </button>
                        <button
                          type="button"
                          className="small-btn danger"
                          data-action="delete"
                          data-icon="✖"
                          onClick={() => setDeleteTarget(record)}
                          disabled={deletingId === record.id}
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

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this?</p>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="small-btn danger"
                onClick={confirmDelete}
                disabled={deletingId === deleteTarget.id}
              >
                {deletingId === deleteTarget.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteOpen && (
        <div className="modal-overlay" onClick={() => setBulkDeleteOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete {selectedIds.length} records?</p>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setBulkDeleteOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="small-btn danger"
                onClick={confirmBulkDelete}
                disabled={deletingId === "bulk"}
              >
                {deletingId === "bulk" ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedRecordsPanel;
