import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchWaxReceives } from "../store/waxReceiveSlice";
import { fetchItems } from "../store/itemMasterSlice";
import { fetchSizes } from "../store/sizeMasterSlice";
import { listVendorModels, createWaxReceiveLine, listWaxReceiveLines } from "../api/mgmt";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const WaxReceiveDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const waxReceives = useSelector((state) => state.waxReceive.records);
  const items = useSelector((state) => state.itemMaster.records);
  const sizes = useSelector((state) => state.sizeMaster.records);

  const [vendors, setVendors] = useState([]);
  const [lines, setLines] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [form, setForm] = useState({ size: "", in_weight: "", in_quantity: "" });
  const [formError, setFormError] = useState("");
  const [loadingLines, setLoadingLines] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lineModalOpen, setLineModalOpen] = useState(false);

  useEffect(() => {
    if (waxReceives.length === 0) {
      dispatch(fetchWaxReceives());
    }
    if (items.length === 0) {
      dispatch(fetchItems());
    }
    if (sizes.length === 0) {
      dispatch(fetchSizes());
    }
    listVendorModels().then(setVendors).catch(() => setVendors([]));
  }, [dispatch, waxReceives.length, items.length, sizes.length]);

  useEffect(() => {
    setLoadingLines(true);
    listWaxReceiveLines(id)
      .then(setLines)
      .catch(() => setLines([]))
      .finally(() => setLoadingLines(false));
  }, [id]);

  const record = useMemo(
    () => waxReceives.find((entry) => String(entry.id) === String(id)),
    [waxReceives, id],
  );

  const vendorItemOptions = useMemo(() => {
    if (!record) return [];
    const options = vendors
      .filter((vendor) => vendor.vendor_name === record.vendor_name)
      .map((vendor) => ({
        id: vendor.item_name,
        label: vendor.item_name_label,
        rate: vendor.rate,
      }));
    const seen = new Set();
    return options.filter((option) => {
      if (seen.has(option.id)) return false;
      seen.add(option.id);
      return true;
    });
  }, [record, vendors]);

  const rate = useMemo(() => {
    const match = vendorItemOptions.find((item) => String(item.id) === String(selectedItemId));
    return match?.rate ?? 0;
  }, [vendorItemOptions, selectedItemId]);

  const amountPreview = useMemo(() => {
    const weight = Number(form.in_weight || 0);
    return (weight * rate).toFixed(2);
  }, [form.in_weight, rate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!selectedItemId || !form.size || !form.in_weight || !form.in_quantity) {
      setFormError("Item, size, weight and quantity are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createWaxReceiveLine({
        waxReceiveId: id,
        payload: {
          item: Number(selectedItemId),
          size: Number(form.size),
          in_weight: Number(form.in_weight),
          in_quantity: Number(form.in_quantity),
        },
      });
      const refreshed = await listWaxReceiveLines(id);
      setLines(refreshed);
      setForm({ size: "", in_weight: "", in_quantity: "" });
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to save wax receive line.";
      setFormError(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const openLineModal = () => {
    setFormError("");
    setForm({ size: "", in_weight: "", in_quantity: "" });
    setLineModalOpen(true);
  };

  const closeLineModal = () => {
    setLineModalOpen(false);
  };


  if (!record) {
    return (
      <div className="content-card">
        <h2>Wax Receive</h2>
        <p>Record not found.</p>
        <button type="button" className="small-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Wax Receive #{record.id}</h2>
          <p>
            Vendor: {record.vendor_name} | Date: {formatDateTime(record.date_time)}
          </p>
        </div>
        <div className="item-toolbar">
          <button
            type="button"
            className="add-btn"
            onClick={openLineModal}
            disabled={!selectedItemId}
          >
            Add Line
          </button>
          <select
            className="item-select"
            value={selectedItemId}
            onChange={(event) => setSelectedItemId(event.target.value)}
          >
            <option value="">Select item</option>
            {vendorItemOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Size</th>
              <th>Weight</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loadingLines ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  Loading lines...
                </td>
              </tr>
            ) : lines.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  No lines yet.
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.item_name}</td>
                  <td>{line.size_name}</td>
                  <td>{line.in_weight}</td>
                  <td>{line.in_quantity}</td>
                  <td>{line.rate}</td>
                  <td>{line.amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lineModalOpen && (
        <div className="modal-overlay" onClick={closeLineModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Add Wax Receive Line</h3>
            <form className="form wax-form" onSubmit={handleSubmit}>
              <label htmlFor="wax-size">Size</label>
              <select
                id="wax-size"
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

              <label htmlFor="wax-weight">Weight (in_weight)</label>
              <input
                id="wax-weight"
                type="number"
                step="0.001"
                value={form.in_weight}
                onChange={(event) => setForm((prev) => ({ ...prev, in_weight: event.target.value }))}
                required
              />

              <label htmlFor="wax-qty">Quantity (in_quantity)</label>
              <input
                id="wax-qty"
                type="number"
                value={form.in_quantity}
                onChange={(event) => setForm((prev) => ({ ...prev, in_quantity: event.target.value }))}
                required
              />

              <label htmlFor="wax-rate">Rate</label>
              <input id="wax-rate" type="number" value={rate} readOnly />

              <label htmlFor="wax-amount">Amount</label>
              <input id="wax-amount" type="text" value={amountPreview} readOnly />

              {formError && <p className="error">{formError}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeLineModal}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Add Line"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaxReceiveDetailPage;
