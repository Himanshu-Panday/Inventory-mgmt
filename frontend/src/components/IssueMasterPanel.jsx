import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchItems } from "../store/itemMasterSlice";
import { fetchSizes } from "../store/sizeMasterSlice";
import { addIssueMaster, fetchIssueMasters } from "../store/issueMasterSlice";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const IssueMasterPanel = ({ canCreateUpdate }) => {
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

  useEffect(() => {
    dispatch(fetchIssueMasters());
    if (items.length === 0) dispatch(fetchItems());
    if (sizes.length === 0) dispatch(fetchSizes());
  }, [dispatch, items.length, sizes.length]);

  const openModal = () => {
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

  const closeModal = () => {
    setModalOpen(false);
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
      await dispatch(
        addIssueMaster({
          item: Number(form.item),
          size: Number(form.size),
          out_weight: Number(form.out_weight),
          out_quantity: Number(form.out_quantity),
          description: form.description,
        }),
      ).unwrap();
      closeModal();
    } catch (requestError) {
      setFormError(requestError || "Unable to save issue record.");
    }
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Issue Master</h2>
          <p>Record item issues.</p>
        </div>
        <button type="button" className="add-btn" onClick={openModal} disabled={!canCreateUpdate}>
          Add
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading issues...</p>
      ) : (
        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date & Time</th>
                <th>Item</th>
                <th>Size</th>
                <th>Out Weight</th>
                <th>Out Quantity</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    No issue records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{formatDateTime(record.date_time)}</td>
                    <td>{record.item_name}</td>
                    <td>{record.size_name}</td>
                    <td>{record.out_weight}</td>
                    <td>{record.out_quantity}</td>
                    <td>{record.description || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Create Issue</h3>
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
    </div>
  );
};

export default IssueMasterPanel;
