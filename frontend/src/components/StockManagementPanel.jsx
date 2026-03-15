import { useEffect, useState } from "react";

import { createIssueMaster, listStockInDetails, listStockManagement } from "../api/mgmt";

const defaultForm = {
  out_weight: "",
  out_quantity: "",
  description: "",
};

const StockManagementPanel = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRows, setViewRows] = useState([]);
  const [viewTitle, setViewTitle] = useState("");
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listStockManagement()
      .then(setRecords)
      .catch(() => setError("Unable to load stock management."))
      .finally(() => setLoading(false));
  }, []);

  const openIssueModal = (record) => {
    setSelectedRecord(record);
    setForm(defaultForm);
    setFormError("");
    setModalOpen(true);
  };

  const openViewModal = async (record) => {
    setViewTitle(`${record.item_name} - ${record.size_name}`);
    setViewLoading(true);
    setViewOpen(true);
    try {
      const rows = await listStockInDetails(record.id);
      setViewRows(rows);
    } catch {
      setViewRows([]);
    } finally {
      setViewLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
    setForm(defaultForm);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.out_weight || !form.out_quantity) {
      setFormError("Weight and quantity are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createIssueMaster({
        item: Number(selectedRecord.item),
        size: Number(selectedRecord.size),
        out_weight: Number(form.out_weight),
        out_quantity: Number(form.out_quantity),
        description: form.description,
      });
      closeModal();
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to save issue record.";
      setFormError(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Stock Management</h2>
          <p>Track in/out balances per item and size.</p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading stock data...</p>
      ) : (
        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>Serial No.</th>
                <th>Item Name</th>
                <th>Size</th>
                <th>In Weight</th>
                <th>In Quantity</th>
                <th>Out Weight</th>
                <th>Out Quantity</th>
                <th>Balance Weight</th>
                <th>Balance Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-row">
                    No stock records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.item_name}</td>
                    <td>{record.size_name}</td>
                    <td>{record.in_weight}</td>
                    <td>{record.in_quantity}</td>
                    <td>{record.out_weight}</td>
                    <td>{record.out_quantity}</td>
                    <td>{record.balance_weight}</td>
                    <td>{record.balance_quantity}</td>
                    <td>
                      <div className="action-group">
                        <button type="button" className="small-btn" onClick={() => openIssueModal(record)}>
                          Issue
                        </button>
                        <button
                          type="button"
                          className="small-btn info"
                          onClick={() => openViewModal(record)}
                        >
                          View
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

      {modalOpen && selectedRecord && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Create Issue</h3>
            <form className="form wax-form" onSubmit={handleSubmit}>
              <label>Item</label>
              <input type="text" value={selectedRecord.item_name} readOnly />

              <label>Size</label>
              <input type="text" value={selectedRecord.size_name} readOnly />

              <label htmlFor="stock-out-weight">Out Weight</label>
              <input
                id="stock-out-weight"
                type="number"
                step="0.001"
                value={form.out_weight}
                onChange={(event) => setForm((prev) => ({ ...prev, out_weight: event.target.value }))}
                required
              />

              <label htmlFor="stock-out-qty">Out Quantity</label>
              <input
                id="stock-out-qty"
                type="number"
                value={form.out_quantity}
                onChange={(event) => setForm((prev) => ({ ...prev, out_quantity: event.target.value }))}
                required
              />

              <label htmlFor="stock-desc">Description</label>
              <input
                id="stock-desc"
                type="text"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Optional description"
              />

              {formError && <p className="error">{formError}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewOpen && (
        <div className="modal-overlay" onClick={() => setViewOpen(false)}>
          <div className="modal-card history-card" onClick={(event) => event.stopPropagation()}>
            <h3>In Details - {viewTitle}</h3>
            {viewLoading ? (
              <p>Loading details...</p>
            ) : viewRows.length === 0 ? (
              <p>No entries found.</p>
            ) : (
              <div className="table-wrap">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>In Weight</th>
                      <th>In Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.vendor_name}</td>
                        <td>{row.in_weight}</td>
                        <td>{row.in_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setViewOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagementPanel;
