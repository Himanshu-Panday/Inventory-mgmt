import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { useAuth } from "../components/AuthProvider";
import { fetchItems } from "../store/itemMasterSlice";
import {
  createVendorModel,
  deleteVendorModel,
  listVendorListHistory,
  listVendorLists,
  listVendorModelHistory,
  listVendorModels,
  updateVendorModel,
} from "../api/mgmt";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const defaultItemForm = {
  item_name: "",
  rate: "",
};

const VendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const items = useSelector((state) => state.itemMaster.records);

  const [vendor, setVendor] = useState(null);
  const [vendorItems, setVendorItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState(defaultItemForm);
  const [itemFormError, setItemFormError] = useState("");
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const permission = useMemo(() => {
    if (!user) return {};
    if (user.role === "admin") {
      return { can_create_update: true, can_delete: true };
    }
    return (
      user.master_permissions?.find((entry) => entry.master_name === "vendor_master") || {}
    );
  }, [user]);

  const canCreateUpdate = user?.role === "admin" || Boolean(permission.can_create_update);
  const canDelete = user?.role === "admin" || Boolean(permission.can_delete);

  useEffect(() => {
    if (items.length === 0) {
      dispatch(fetchItems());
    }
  }, [dispatch, items.length]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([listVendorLists(), listVendorModels({ vendorId: id })])
      .then(([vendorLists, models]) => {
        if (!isMounted) return;
        setVendor(vendorLists.find((entry) => String(entry.id) === String(id)) || null);
        setVendorItems(models);
      })
      .catch(() => {
        if (!isMounted) return;
        setVendor(null);
        setVendorItems([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const openItemCreateModal = () => {
    setEditingItem(null);
    setItemForm(defaultItemForm);
    setItemFormError("");
    setIsItemModalOpen(true);
  };

  const openItemEditModal = (record) => {
    setEditingItem(record);
    setItemForm({
      item_name: String(record.item_name),
      rate: String(record.rate),
    });
    setItemFormError("");
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
    setItemForm(defaultItemForm);
    setItemFormError("");
  };

  const handleItemSubmit = async (event) => {
    event.preventDefault();
    setItemFormError("");

    if (!canCreateUpdate) {
      setItemFormError("You have read-only access for this master.");
      return;
    }

    if (!itemForm.item_name || !itemForm.rate) {
      setItemFormError("Item name and rate are required.");
      return;
    }

    const payload = {
      vendor: Number(id),
      item_name: Number(itemForm.item_name),
      rate: Number(itemForm.rate),
    };

    if (Number.isNaN(payload.rate)) {
      setItemFormError("Rate must be a valid number.");
      return;
    }

    setItemSubmitting(true);
    try {
      let saved;
      if (editingItem) {
        saved = await updateVendorModel({ id: editingItem.id, payload });
        setVendorItems((prev) =>
          prev.map((record) => (record.id === saved.id ? saved : record)),
        );
      } else {
        saved = await createVendorModel(payload);
        setVendorItems((prev) => [...prev, saved]);
      }
      closeItemModal();
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail ||
        requestError?.response?.data?.item_name?.[0] ||
        requestError?.response?.data?.rate?.[0] ||
        "Unable to save vendor item.";
      setItemFormError(apiMessage);
    } finally {
      setItemSubmitting(false);
    }
  };

  const openHistoryModal = async (record, type) => {
    setHistoryTitle(type === "vendor" ? vendor?.vendor_name || "Vendor" : record.item_name_label);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const rows =
        type === "vendor"
          ? await listVendorListHistory(id)
          : await listVendorModelHistory(record.id);
      setHistoryRows(rows);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteVendorModel(deleteTarget.id);
    setVendorItems((prev) => prev.filter((record) => record.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="content-card">
        <h2>Vendor Items</h2>
        <p>Loading vendor details...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="content-card">
        <h2>Vendor Items</h2>
        <p>Vendor not found.</p>
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
          <h2>{vendor.vendor_name}</h2>
          <p>Manage vendor item rates.</p>
        </div>
        <div className="action-group">
          <button type="button" className="small-btn" onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            type="button"
            className="small-btn info"
            onClick={() => openHistoryModal(vendor, "vendor")}
          >
            History
          </button>
          <button type="button" className="add-btn" onClick={openItemCreateModal} disabled={!canCreateUpdate}>
            Add
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>Serial No.</th>
              <th>Item Name</th>
              <th>Rate</th>
              <th>Date & Time</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendorItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  No vendor items found.
                </td>
              </tr>
            ) : (
              vendorItems.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.item_name_label}</td>
                  <td>{record.rate}</td>
                  <td>{formatDateTime(record.date_time)}</td>
                  <td>{record.created_by_email || "-"}</td>
                  <td>
                    <div className="action-group">
                      <button
                        type="button"
                        className="small-btn"
                        onClick={() => openItemEditModal(record)}
                        disabled={!canCreateUpdate}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="small-btn info"
                        onClick={() => openHistoryModal(record, "item")}
                      >
                        History
                      </button>
                      <button
                        type="button"
                        className="small-btn danger"
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
      </div>

      {isItemModalOpen && (
        <div className="modal-overlay" onClick={closeItemModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>{editingItem ? "Edit Vendor Item" : "Add Vendor Item"}</h3>
            <form className="form" onSubmit={handleItemSubmit}>
              <label htmlFor="vendor-item">Item Name</label>
              <select
                id="vendor-item"
                value={itemForm.item_name}
                onChange={(event) =>
                  setItemForm((prev) => ({ ...prev, item_name: event.target.value }))
                }
                required
              >
                <option value="">Select item</option>
                {items.map((item) => (
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
                value={itemForm.rate}
                onChange={(event) =>
                  setItemForm((prev) => ({ ...prev, rate: event.target.value }))
                }
                placeholder="Enter rate"
                required
              />

              {itemFormError && <p className="error">{itemFormError}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeItemModal}>
                  Cancel
                </button>
                <button type="submit" disabled={itemSubmitting}>
                  {itemSubmitting ? "Saving..." : editingItem ? "Update" : "Create"}
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
    </div>
  );
};

export default VendorDetailPage;
