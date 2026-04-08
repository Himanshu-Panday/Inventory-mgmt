import { useEffect, useState } from "react";

import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { listIssueMasters, listStockInDetails, listStockManagement } from "../api/mgmt";
import { useNavigate } from "react-router-dom";

const escapeCsv = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
};

const StockManagementPanel = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRows, setViewRows] = useState([]);
  const [viewTitle, setViewTitle] = useState("");
  const [viewLoading, setViewLoading] = useState(false);
  const { visibleCount, sentinelRef } = useInfiniteScroll(records.length);
  const visibleRecords = records.slice(0, visibleCount);

  const loadStock = () => {
    setLoading(true);
    listStockManagement()
      .then(setRecords)
      .catch(() => setError("Unable to load stock management."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStock();
  }, []);

  const openIssuePage = async (record) => {
    try {
      const issues = await listIssueMasters();
      const existing = issues
        .filter(
          (issue) =>
            String(issue.item) === String(record.item) &&
            String(issue.size) === String(record.size),
        )
        .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))[0];
      const state = {
        returnTo: "/",
        returnToTab: "StockManagement",
        prefill: {
          item: record.item,
          size: record.size,
        },
      };
      if (existing) {
        navigate(`/issue-masters/${existing.id}/edit`, { state });
      } else {
        navigate("/issue-masters/new", { state });
      }
    } catch {
      navigate("/issue-masters/new", {
        state: {
          returnTo: "/",
          returnToTab: "StockManagement",
          prefill: {
            item: record.item,
            size: record.size,
          },
        },
      });
    }
  };

  const openViewModal = async (record) => {
    setViewTitle(`${record.item_name} - ${record.size_name || "No Size"}`);
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

  const exportToExcel = () => {
    if (records.length === 0) return;
    const headers = [
      "Item Name",
      "Size",
      "In Weight",
      "In Quantity",
      "Out Weight",
      "Out Quantity",
      "Balance Weight",
      "Balance Quantity",
    ];
    const rows = records.map((record) => [
      record.item_name,
      record.size_name || "No Size",
      record.in_weight,
      record.in_quantity,
      record.out_weight,
      record.out_quantity,
      record.balance_weight,
      record.balance_quantity,
    ]);
    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-management-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Stock Management</h2>
          <p>Track in/out balances per item and size.</p>
        </div>
        <div className="action-group">
          <button
            type="button"
            className="small-btn success"
            onClick={exportToExcel}
            disabled={records.length === 0}
          >
            Export to Excel
          </button>
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
                  <td colSpan="9" className="empty-row">
                    No stock records found.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.item_name}</td>
                    <td>{record.size_name || "No Size"}</td>
                    <td>{record.in_weight}</td>
                    <td>{record.in_quantity}</td>
                    <td>{record.out_weight}</td>
                    <td>{record.out_quantity}</td>
                    <td>{record.balance_weight}</td>
                    <td>{record.balance_quantity}</td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className="issue-btn"
                          onClick={() => openIssuePage(record)}
                        >
                          Issue
                        </button>
                        <button
                          type="button"
                          className="ledger-btn"
                          aria-label="Ledger"
                          title="Ledger"
                          onClick={() => openViewModal(record)}
                        >
                          <span className="sr-only">Ledger</span>
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
