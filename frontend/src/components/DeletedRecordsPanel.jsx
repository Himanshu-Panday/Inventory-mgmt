import { useEffect, useMemo, useState } from "react";

import {
  listItemModels,
  listIssueMasters,
  listSizeModels,
  listVendorLists,
  listVendorModels,
  listWaxReceiveLines,
  listWaxReceives,
  updateItemModel,
  updateIssueMaster,
  updateSizeModel,
  updateVendorList,
  updateVendorModel,
  updateWaxReceive,
  updateWaxReceiveLine,
} from "../api/mgmt";
import useInfiniteScroll from "../hooks/useInfiniteScroll";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const DeletedRecordsPanel = () => {
  const tabConfig = useMemo(
    () => ({
      vendor_list: {
        label: "Vendor List",
        fetch: () => listVendorLists({ is_active: false }),
        recover: (record) => updateVendorList({ id: record.id, payload: { is_active: true } }),
        recordLabel: (record) => record.vendor_name || "-",
        dateValue: (record) => record.created_at,
        createdBy: (record) => record.created_by_email,
      },
      vendor_model: {
        label: "Vendor Model",
        fetch: () => listVendorModels({ is_active: false }),
        recover: (record) => updateVendorModel({ id: record.id, payload: { is_active: true } }),
        recordLabel: (record) =>
          `${record.vendor_name || "-"} - ${record.item_name_label || "-"}`,
        dateValue: (record) => record.date_time,
        createdBy: (record) => record.created_by_email,
      },
      item_model: {
        label: "Item Model",
        fetch: () => listItemModels({ is_active: false }),
        recover: (record) => updateItemModel({ id: record.id, payload: { is_active: true } }),
        recordLabel: (record) => record.name || "-",
        dateValue: (record) => record.date,
        createdBy: (record) => record.created_by_email,
      },
      size_model: {
        label: "Size Model",
        fetch: () => listSizeModels({ is_active: false }),
        recover: (record) => updateSizeModel({ id: record.id, payload: { is_active: true } }),
        recordLabel: (record) => record.name || "-",
        dateValue: (record) => record.date,
        createdBy: (record) => record.created_by_email,
      },
      wax_receive: {
        label: "Wax Receive",
        fetch: () => listWaxReceives({ is_active: false }),
        recover: (record) => updateWaxReceive({ id: record.id, payload: { is_active: true } }),
        recordLabel: (record) => `#${record.id} - ${record.vendor_name || "-"}`,
        dateValue: (record) => record.date_time,
        createdBy: (record) => record.created_by_email,
      },
      wax_receive_line: {
        label: "Wax Receive Line",
        fetch: () => listWaxReceiveLines({ is_active: false, include_deleted: true }),
        recover: (record) =>
          updateWaxReceiveLine({ id: record.id, payload: { is_active: true } }),
        recordLabel: (record) => `${record.item_name || "-"} - ${record.size_name || "-"}`,
        dateValue: () => null,
        createdBy: () => null,
      },
      issue_master: {
        label: "Issue Master",
        fetch: () => listIssueMasters({ is_active: false }),
        recover: (record) => updateIssueMaster({ id: record.id, payload: { is_active: true } }),
        recordLabel: (record) => `${record.item_name || "-"} - ${record.size_name || "-"}`,
        dateValue: (record) => record.date_time,
        createdBy: (record) => record.created_by_email,
      },
    }),
    [],
  );

  const tabKeys = Object.keys(tabConfig);
  const [activeTab, setActiveTab] = useState(tabKeys[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recoveringId, setRecoveringId] = useState(null);
  const { visibleCount, sentinelRef } = useInfiniteScroll(records.length);
  const visibleRecords = records.slice(0, visibleCount);

  const activeConfig = tabConfig[activeTab];

  useEffect(() => {
    setLoading(true);
    setError("");
    activeConfig
      .fetch()
      .then((rows) => {
        const inactiveRows = rows.filter((record) => record.is_active !== true);
        setRecords(inactiveRows);
      })
      .catch(() => setError("Unable to load deleted records."))
      .finally(() => setLoading(false));
  }, [activeConfig]);

  const handleRecover = async (record) => {
    setRecoveringId(record.id);
    try {
      await activeConfig.recover(record);
      setRecords((prev) => prev.filter((entry) => entry.id !== record.id));
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
          <p>Recover inactive master records by category.</p>
        </div>
      </div>

      <div className="tab-row">
        {tabKeys.map((key) => (
          <button
            key={key}
            type="button"
            className={`tab-btn ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {tabConfig[key].label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading inactive records...</p>
      ) : (
        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>Record</th>
                <th>Date & Time</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-row">
                    No inactive records found.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{activeConfig.recordLabel(record)}</td>
                    <td>{formatDateTime(activeConfig.dateValue(record))}</td>
                    <td>{activeConfig.createdBy(record) || "-"}</td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className="small-btn"
                          data-action="recover"
                          data-icon="↺"
                          onClick={() => handleRecover(record)}
                          disabled={recoveringId === record.id}
                        >
                          {recoveringId === record.id ? "Recovering..." : "Recover"}
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
    </div>
  );
};

export default DeletedRecordsPanel;
