import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import useInfiniteScroll from "../hooks/useInfiniteScroll";
import {
  addItem,
  editItem,
  fetchItems,
  removeItem,
} from "../store/itemMasterSlice";
import { listItemModelHistory, listSizeModelHistory } from "../api/mgmt";
import {
  addSize,
  editSize,
  fetchSizes,
  removeSize,
} from "../store/sizeMasterSlice";

const CONFIG = {
  "Item-Master": {
    selector: (state) => state.itemMaster,
    fetchAction: fetchItems,
    addAction: addItem,
    editAction: editItem,
    removeAction: removeItem,
    historyAction: listItemModelHistory,
    title: "Item Master",
  },
  "Size-Master": {
    selector: (state) => state.sizeMaster,
    fetchAction: fetchSizes,
    addAction: addSize,
    editAction: editSize,
    removeAction: removeSize,
    historyAction: listSizeModelHistory,
    title: "Size Master",
  },
};

const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleString();
};

const emptyForm = {
  name: "",
};

const MasterCrudPanel = ({ tabName, canCreateUpdate, canDelete }) => {
  const config = CONFIG[tabName];
  const dispatch = useDispatch();
  const { records, loading, submitting, error } = useSelector(config.selector);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const { visibleCount, sentinelRef } = useInfiniteScroll(records.length);
  const visibleRecords = records.slice(0, visibleCount);

  useEffect(() => {
    dispatch(config.fetchAction());
  }, [dispatch, config]);

  const panelTitle = useMemo(
    () => `${config.title} Records`,
    [config.title],
  );

  const openCreateModal = () => {
    setEditingRecord(null);
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setForm({ name: record.name });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!canCreateUpdate) {
      setFormError("You have read-only access for this master.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    try {
      if (editingRecord) {
        await dispatch(
          config.editAction({
            id: editingRecord.id,
            payload: {
              name: form.name.trim(),
            },
          }),
        ).unwrap();
      } else {
        await dispatch(
          config.addAction({
            name: form.name.trim(),
          }),
        ).unwrap();
      }
      closeModal();
    } catch (requestError) {
      setFormError(requestError || "Unable to save record.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(config.removeAction(deleteTarget.id));
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
    await Promise.all(selectedIds.map((id) => dispatch(config.removeAction(id))));
    setSelectedIds([]);
    setBulkDeleteOpen(false);
  };

  const openHistoryModal = async (record) => {
    setHistoryTitle(record.name);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const rows = await config.historyAction(record.id);
      setHistoryRows(rows);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>{config.title}</h2>
          <p>Manage your {config.title.toLowerCase()} entries.</p>
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
          <button type="button" className="add-btn" onClick={openCreateModal} disabled={!canCreateUpdate}>
            Add
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading records...</p>
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
                <th>Name</th>
                <th>Date & Time</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No records found for {panelTitle}.
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
                    <td>{record.name}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.created_by_email || "-"}</td>
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
          {visibleCount < records.length && <div ref={sentinelRef} className="inline-loader" />}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>{editingRecord ? `Edit ${config.title}` : `Create ${config.title}`}</h3>
            <form className="form" onSubmit={handleSubmit}>
              <label htmlFor={`${tabName}-name`}>Name</label>
              <input
                id={`${tabName}-name`}
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Enter name"
                required
              />
              {formError && <p className="error">{formError}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
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
                        <td>{formatDate(row.timestamp)}</td>
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

export default MasterCrudPanel;
