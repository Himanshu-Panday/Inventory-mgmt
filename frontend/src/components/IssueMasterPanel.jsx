import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { fetchItems } from "../store/itemMasterSlice";
import { fetchSizes } from "../store/sizeMasterSlice";
import {
  addIssueMaster,
  editIssueMaster,
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
  const { records, loading, submitting, error } = useSelector((state) => state.issueMaster);
  const items = useSelector((state) => state.itemMaster.records);
  const sizes = useSelector((state) => state.sizeMaster.records);

  const [form, setForm] = useState({
    item: "",
    size: "",
    out_weight: "",
    out_quantity: "",
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const { visibleCount, sentinelRef } = useInfiniteScroll(records.length);
  const visibleRecords = records.slice(0, visibleCount);
  const selectedItemId = form.item ? String(form.item) : "";
  const selectedSizeId = form.size ? String(form.size) : "";
  const duplicateRecord = records.find(
    (record) =>
      String(record.item) === selectedItemId && String(record.size) === selectedSizeId,
  );
  const isDuplicateSelection =
    Boolean(duplicateRecord) && (!editingRecord || duplicateRecord.id !== editingRecord.id);

  useEffect(() => {
    dispatch(fetchIssueMasters());
    if (items.length === 0) dispatch(fetchItems());
    if (sizes.length === 0) dispatch(fetchSizes());
  }, [dispatch, items.length, sizes.length]);

  const openModal = () => {
    setEditingRecord(null);
    setForm({
      item: "",
      size: "",
      out_weight: "",
      out_quantity: "",
      description: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setForm({
      item: String(record.item),
      size: String(record.size),
      out_weight: String(record.out_weight),
      out_quantity: String(record.out_quantity),
      description: record.description || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!canCreateUpdate) {
      setFormError("You have read-only access for this master.");
      return;
    }

    if (!form.item || !form.size || !form.out_weight || !form.out_quantity) {
      setFormError("Item, size, weight and quantity are required.");
      return;
    }

    try {
      const payload = {
        item: Number(form.item),
        size: Number(form.size),
        out_weight: Number(form.out_weight),
        out_quantity: Number(form.out_quantity),
        description: form.description,
      };
      if (editingRecord) {
        await dispatch(editIssueMaster({ id: editingRecord.id, payload })).unwrap();
      } else {
        await dispatch(addIssueMaster(payload)).unwrap();
      }
      closeModal();
    } catch (requestError) {
      setFormError(requestError || "Unable to save issue record.");
    }
  };

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
    await dispatch(removeIssueMaster(deleteTarget.id));
    setDeleteTarget(null);
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
    await Promise.all(selectedIds.map((id) => dispatch(removeIssueMaster(id))));
    setSelectedIds([]);
    setBulkDeleteOpen(false);
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Issue Master</h2>
          <p>Record item issues.</p>
        </div>
        <div className="action-group">
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
          <button type="button" className="add-btn" onClick={openModal} disabled={!canCreateUpdate}>
            Add
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading issues...</p>
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
                      <div className="action-group">
                        <button
                          type="button"
                          className="small-btn"
                          data-action="edit"
                          data-icon="✎"
                          onClick={() => openEditModal(record)}
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

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>{editingRecord ? "Edit Issue" : "Create Issue"}</h3>
            <form className="form wax-form" onSubmit={handleSubmit}>
              <label htmlFor="issue-item">Item</label>
              <select
                id="issue-item"
                value={form.item}
                onChange={(event) => setForm((prev) => ({ ...prev, item: event.target.value }))}
                required
              >
                <option value="">Select item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <label htmlFor="issue-size">Size</label>
              <select
                id="issue-size"
                value={form.size}
                onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))}
                required
              >
                <option value="">Select size</option>
                {sizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name}
                  </option>
                ))}
              </select>

              <label htmlFor="issue-weight">Out Weight</label>
              <input
                id="issue-weight"
                type="number"
                step="0.001"
                value={form.out_weight}
                onChange={(event) => setForm((prev) => ({ ...prev, out_weight: event.target.value }))}
                required
              />

              <label htmlFor="issue-qty">Out Quantity</label>
              <input
                id="issue-qty"
                type="number"
                value={form.out_quantity}
                onChange={(event) => setForm((prev) => ({ ...prev, out_quantity: event.target.value }))}
                required
              />

              <label htmlFor="issue-desc">Description</label>
              <input
                id="issue-desc"
                type="text"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Optional description"
              />

              {formError && <p className="error">{formError}</p>}
              {isDuplicateSelection && (
                <p className="error">Issue record for this item and size already exists.</p>
              )}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting || isDuplicateSelection}>
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

export default IssueMasterPanel;
