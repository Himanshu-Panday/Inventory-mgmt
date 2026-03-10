import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { listVendorModelHistory } from "../api/mgmt";
import { fetchItems } from "../store/itemMasterSlice";
import {
  addVendor,
  editVendor,
  fetchVendors,
  removeVendor,
} from "../store/vendorMasterSlice";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const defaultForm = {
  vendor_name: "",
  item_name: "",
  rate: "",
};

const VendorCrudPanel = ({ canWrite }) => {
  const dispatch = useDispatch();
  const vendorState = useSelector((state) => state.vendorMaster);
  const itemState = useSelector((state) => state.itemMaster);
  const { records, loading, submitting, error } = vendorState;
  const itemOptions = itemState.records;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchVendors());
    if (itemOptions.length === 0) {
      dispatch(fetchItems());
    }
  }, [dispatch, itemOptions.length]);

  const openCreateModal = () => {
    setEditingRecord(null);
    setForm(defaultForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setForm({
      vendor_name: record.vendor_name,
      item_name: String(record.item_name),
      rate: String(record.rate),
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setForm(defaultForm);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!canWrite) {
      setFormError("You have read-only access for this master.");
      return;
    }

    if (!form.vendor_name.trim() || !form.item_name || !form.rate) {
      setFormError("Vendor name, item name and rate are required.");
      return;
    }

    const payload = {
      vendor_name: form.vendor_name.trim(),
      item_name: Number(form.item_name),
      rate: Number(form.rate),
    };

    if (Number.isNaN(payload.rate)) {
      setFormError("Rate must be a valid number.");
      return;
    }

    try {
      if (editingRecord) {
        await dispatch(editVendor({ id: editingRecord.id, payload })).unwrap();
      } else {
        await dispatch(addVendor(payload)).unwrap();
      }
      closeModal();
    } catch (requestError) {
      setFormError(requestError || "Unable to save vendor.");
    }
  };

  const openHistoryModal = async (record) => {
    setHistoryTitle(record.vendor_name);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const rows = await listVendorModelHistory(record.id);
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
          <h2>Vendor Master</h2>
          <p>Manage vendor rates mapped to item master.</p>
        </div>
        <button type="button" className="add-btn" onClick={openCreateModal} disabled={!canWrite}>
          Add
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading vendors...</p>
      ) : (
        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>Serial No.</th>
                <th>Vendor Name</th>
                <th>Item Name</th>
                <th>Rate</th>
                <th>Date & Time</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    No vendor records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.vendor_name}</td>
                    <td>{record.item_name_label}</td>
                    <td>{record.rate}</td>
                    <td>{formatDateTime(record.date_time)}</td>
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
                          onClick={() => dispatch(removeVendor(record.id))}
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
            <h3>{editingRecord ? "Edit Vendor" : "Create Vendor"}</h3>
            <form className="form" onSubmit={handleSubmit}>
              <label htmlFor="vendor-name">Vendor Name</label>
              <input
                id="vendor-name"
                type="text"
                value={form.vendor_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, vendor_name: event.target.value }))
                }
                placeholder="Enter vendor name"
                required
              />

              <label htmlFor="vendor-item">Item Name</label>
              <select
                id="vendor-item"
                value={form.item_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, item_name: event.target.value }))
                }
                required
              >
                <option value="">Select item</option>
                {itemOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <label htmlFor="vendor-rate">Rate</label>
              <input
                id="vendor-rate"
                type="number"
                min="0"
                step="1"
                value={form.rate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, rate: event.target.value }))
                }
                placeholder="Enter rate"
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
                        <td>{formatDateTime(row.modified_at)}</td>
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

export default VendorCrudPanel;
