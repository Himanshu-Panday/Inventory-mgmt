import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { listVendorModels } from "../api/mgmt";
import { useNavigate } from "react-router-dom";
import { addWaxReceive, fetchWaxReceives } from "../store/waxReceiveSlice";

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
  const [vendorId, setVendorId] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(fetchWaxReceives());
    listVendorModels().then(setVendors).catch(() => setVendors([]));
  }, [dispatch]);

  const openModal = () => {
    setVendorId("");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
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
      await dispatch(addWaxReceive({ vendor: Number(vendorId) })).unwrap();
      closeModal();
    } catch (requestError) {
      setFormError(requestError || "Unable to save wax receive.");
    }
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Wax Receive</h2>
          <p>Create wax receive entries for vendors.</p>
        </div>
        <button type="button" className="add-btn" onClick={openModal} disabled={!canCreateUpdate}>
          Add
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading wax receives...</p>
      ) : (
        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date & Time</th>
                <th>Vendor Name</th>
                <th>Weight</th>
                <th>Quantity</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    No wax receive records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className="clickable-row"
                    onClick={() => navigate(`/wax-receives/${record.id}`)}
                  >
                    <td>{record.id}</td>
                    <td>{formatDateTime(record.date_time)}</td>
                    <td>{record.vendor_name}</td>
                    <td>{record.weight ?? 0}</td>
                    <td>{record.quantity ?? 0}</td>
                    <td>{record.total_amount ?? 0}</td>
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
            <h3>Create Wax Receive</h3>
            <form className="form" onSubmit={handleSubmit}>
              <label htmlFor="wax-vendor">Vendor Name</label>
              <select
                id="wax-vendor"
                value={vendorId}
                onChange={(event) => setVendorId(event.target.value)}
                required
              >
                <option value="">Select vendor</option>
                {Array.from(
                  vendors.reduce((map, vendor) => {
                    if (!map.has(vendor.vendor_name)) {
                      map.set(vendor.vendor_name, vendor);
                    }
                    return map;
                  }, new Map()).values(),
                ).map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.vendor_name}
                  </option>
                ))}
              </select>

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

export default WaxReceivePanel;
