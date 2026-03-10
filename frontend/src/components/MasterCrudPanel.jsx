import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

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

const MasterCrudPanel = ({ tabName, canWrite }) => {
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

    if (!canWrite) {
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

  const handleDelete = async (id) => {
    await dispatch(config.removeAction(id));
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
        <button type="button" className="add-btn" onClick={openCreateModal} disabled={!canWrite}>
          Add
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading records...</p>
      ) : (
        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date & Time</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-row">
                    No records found for {panelTitle}.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.name}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.created_by_email || "-"}</td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className="small-btn"
                          onClick={() => openEditModal(record)}
                          disabled={!canWrite}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="small-btn info"
                          onClick={() => openHistoryModal(record)}
                        >
                          History
                        </button>
                        <button
                          type="button"
                          className="small-btn danger"
                          onClick={() => handleDelete(record.id)}
                          disabled={submitting || !canWrite}
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
                        <td>{row.modified_by_email || "-"}</td>
                        <td>{formatDate(row.modified_at)}</td>
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
    </div>
  );
};

export default MasterCrudPanel;
