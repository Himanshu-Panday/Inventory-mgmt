import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import useInfiniteScroll from "../hooks/useInfiniteScroll";
import {
  listVendorListHistory,
} from "../api/mgmt";
import {
  fetchVendors,
  removeVendor,
} from "../store/vendorMasterSlice";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const VendorCrudPanel = ({ canCreateUpdate, canDelete }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const vendorState = useSelector((state) => state.vendorMaster);
  const { records, loading, submitting, error } = vendorState;

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [filterVendorName, setFilterVendorName] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const createdByOptions = Array.from(
    new Set(records.map((record) => record.created_by_email).filter(Boolean)),
  );
  const filteredRecords = records.filter((record) => {
    const vendorMatch = filterVendorName
      ? record.vendor_name
          ?.toLowerCase()
          .includes(filterVendorName.trim().toLowerCase())
      : true;
    const createdMatch = filterCreatedBy
      ? record.created_by_email === filterCreatedBy
      : true;
    return vendorMatch && createdMatch;
  });
  const { visibleCount, sentinelRef } = useInfiniteScroll(filteredRecords.length);
  const visibleRecords = filteredRecords.slice(0, visibleCount);
  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);


  const openHistoryModal = async (record) => {
    setHistoryTitle(record.vendor_name);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const rows = await listVendorListHistory(record.id);
      setHistoryRows(rows);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(removeVendor(deleteTarget.id));
    setDeleteTarget(null);
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
    if (selectedIds.length === 0) return;
    await Promise.all(selectedIds.map((id) => dispatch(removeVendor(id))));
    setSelectedIds([]);
    setBulkDeleteOpen(false);
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Vendor Master</h2>
          <p>Manage vendor list records.</p>
        </div>
        <div className="action-group">
          <button
            type="button"
            className="small-btn info"
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </button>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="small-btn danger"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={!canDelete}
            >
              Delete ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            className="add-btn"
            onClick={() => navigate("/vendors/new")}
            disabled={!canCreateUpdate}
          >
            Add
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {filtersOpen && (
        <div className="modal-overlay" onClick={() => setFiltersOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Filters</h3>
            <div className="filter-row">
              <div className="filter-field">
                <label htmlFor="vendor-filter-name">Vendor Name</label>
                <input
                  id="vendor-filter-name"
                  type="text"
                  value={filterVendorName}
                  onChange={(event) => setFilterVendorName(event.target.value)}
                  placeholder="Search vendor name"
                />
              </div>
              <div className="filter-field">
                <label htmlFor="vendor-filter-created">Created By</label>
                <select
                  id="vendor-filter-created"
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
              <button type="button" className="secondary-btn" onClick={() => setFiltersOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading vendors...</p>
      ) : (
        <div className="table-wrap">
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
                <th>Serial No.</th>
                <th>Vendor Name</th>
                <th>Created At</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    No vendor records found.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => (
                  <tr key={record.id} className="clickable-row" onClick={() => navigate(`/vendors/${record.id}`)}>
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => toggleSelect(record.id)}
                      />
                    </td>
                    <td>{record.id}</td>
                    <td>{record.vendor_name}</td>
                    <td>{formatDateTime(record.created_at)}</td>
                    <td>{record.created_by_email || "-"}</td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className="small-btn"
                          data-action="edit"
                          data-icon="✎"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/vendors/${record.id}/edit`);
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
                          data-icon="✖"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteTarget(record);
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
          {visibleCount < filteredRecords.length && (
            <div ref={sentinelRef} className="inline-loader" />
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
        <div
          className="modal-overlay"
          onClick={() => {
            setDeleteTarget(null);
          }}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this?</p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setDeleteTarget(null);
                }}
              >
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
        <div className="modal-overlay" onClick={() => setBulkDeleteOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete {selectedIds.length} records?</p>
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

export default VendorCrudPanel;
