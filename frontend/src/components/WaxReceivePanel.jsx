import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { listVendorLists, listWaxReceiveHistory } from "../api/mgmt";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { useNavigate } from "react-router-dom";
import { addWaxReceive, editWaxReceive, fetchWaxReceives, removeWaxReceive } from "../store/waxReceiveSlice";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const WaxReceivePanel = ({ canCreateUpdate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { records, loading, submitting, error } = useSelector((state) => state.waxReceive);
  const [vendors, setVendors] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [vendorId, setVendorId] = useState("");
  const [formError, setFormError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
  const selectedVendorId = vendorId ? String(vendorId) : "";
  const duplicateRecord = records.find(
    (record) => String(record.vendor) === selectedVendorId,
  );
  const isDuplicateVendor =
    Boolean(duplicateRecord) && (!editingRecord || duplicateRecord.id !== editingRecord.id);

  useEffect(() => {
    dispatch(fetchWaxReceives());
    listVendorLists().then(setVendors).catch(() => setVendors([]));
  }, [dispatch]);

  const openModal = () => {
    setEditingRecord(null);
    setVendorId("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setVendorId(String(record.vendor));
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
    setVendorId("");
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!canCreateUpdate) {
      setFormError("You have read-only access for this master.");
      return;
    }

    if (!vendorId) {
      setFormError("Vendor name is required.");
      return;
    }

    try {
      const payload = { vendor: Number(vendorId) };
      if (editingRecord) {
        await dispatch(editWaxReceive({ id: editingRecord.id, payload })).unwrap();
      } else {
        await dispatch(addWaxReceive(payload)).unwrap();
      }
      closeModal();
    } catch (requestError) {
      setFormError(requestError || "Unable to save wax receive.");
    }
  };

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
    if (!deleteTarget) return;
    await dispatch(removeWaxReceive(deleteTarget.id));
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
    await Promise.all(selectedIds.map((id) => dispatch(removeWaxReceive(id))));
    setSelectedIds([]);
    setBulkDeleteOpen(false);
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Wax Receive</h2>
          <p>Create wax receive entries for vendors.</p>
        </div>
        <div className="action-group">
          <div className="filter-field compact">
            <label htmlFor="wax-filter-vendor">Search Record</label>
            <input
              id="wax-filter-vendor"
              type="text"
              value={filterVendorName}
              onChange={(event) => setFilterVendorName(event.target.value)}
              placeholder="Search"
            />
          </div>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="small-btn danger"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={submitting}
            >
              Delete ({selectedIds.length})
            </button>
          )}
          <button type="button" className="add-btn" onClick={openModal} disabled={!canCreateUpdate}>
            Add
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading wax receives...</p>
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
                      <div className="action-group">
                        <button
                          type="button"
                          className="small-btn"
                          data-action="edit"
                          data-icon="✎"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditModal(record);
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
                          disabled={submitting}
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

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>{editingRecord ? "Edit Wax Receive" : "Create Wax Receive"}</h3>
            <form className="form" onSubmit={handleSubmit}>
              <label htmlFor="wax-vendor">Vendor Name</label>
              <select
                id="wax-vendor"
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

              {formError && <p className="error">{formError}</p>}
              {isDuplicateVendor && <p className="error">This vendor already has a wax receive.</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting || isDuplicateVendor}>
                  {submitting ? "Saving..." : editingRecord ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
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
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this?</p>
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

export default WaxReceivePanel;
