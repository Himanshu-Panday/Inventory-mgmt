import { useEffect, useState } from "react";

import { listStockManagement } from "../api/mgmt";

const StockManagementPanel = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    listStockManagement()
      .then(setRecords)
      .catch(() => setError("Unable to load stock management."))
      .finally(() => setLoading(false));
  }, []);

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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockManagementPanel;
