import { useEffect, useMemo, useState } from "react";

import { listDeletedRecords, recoverDeletedRecord } from "../api/mgmt";

const TAB_DEFS = [
  { key: "vendor_list", label: "Vendor List" },
  { key: "vendor_model", label: "Vendor Model" },
  { key: "item_model", label: "Item Model" },
  { key: "size_model", label: "Size Model" },
  { key: "wax_receive", label: "Wax Receive" },
  { key: "wax_receive_line", label: "Wax Receive Line" },
  { key: "issue_master", label: "Issue Master" },
];

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const DeletedRecordsPanel = () => {
  const [activeTab, setActiveTab] = useState(TAB_DEFS[0].key);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recoveringId, setRecoveringId] = useState(null);

  const tabLabel = useMemo(
    () => TAB_DEFS.find((tab) => tab.key === activeTab)?.label || "Deleted Records",
    [activeTab],
  );

  useEffect(() => {
    setLoading(true);
    setError("");
    listDeletedRecords(activeTab)
      .then(setRecords)
      .catch(() => setError("Unable to load deleted records."))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const handleRecover = async (recordId) => {
    setRecoveringId(recordId);
    try {
      await recoverDeletedRecord(recordId);
      setRecords((prev) => prev.filter((record) => record.id !== recordId));
    } catch (requestError) {
      const apiMessage =
        requestError?.response?.data?.detail || "Unable to recover record.";
      setError(apiMessage);
    } finally {
      setRecoveringId(null);
    }
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>Deleted Records</h2>
          <p>Recover deleted master records by category.</p>
        </div>
      </div>

      <div className="tab-row">
        {TAB_DEFS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading deleted records...</p>
      ) : (
        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>Serial No.</th>
                <th>{tabLabel}</th>
                <th>Deleted At</th>
                <th>Deleted By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No deleted records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.object_id}</td>
                    <td>{record.display_name || "-"}</td>
                    <td>{formatDateTime(record.deleted_at)}</td>
                    <td>{record.deleted_by_email || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="small-btn"
                        onClick={() => handleRecover(record.id)}
                        disabled={recoveringId === record.id}
                      >
                        {recoveringId === record.id ? "Recovering..." : "Recover"}
                      </button>
                    </td>
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

export default DeletedRecordsPanel;
