import { useEffect, useMemo, useState } from "react";

import {
  createUserRequest,
  deleteUserRequest,
  listMasterOptionsRequest,
  listUsersRequest,
  updateUserRequest,
} from "../api/auth";

const defaultForm = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  is_active: true,
};

const buildPermissionRows = (masters, userPermissions = []) => {
  const permissionMap = new Map(
    userPermissions.map((permission) => [permission.master_name, permission]),
  );

  return masters.map((master) => {
    const permission = permissionMap.get(master.master_name);
    return {
      master_name: master.master_name,
      label: master.label,
      can_read: permission?.can_read || false,
      can_create_update: permission?.can_create_update || false,
      can_delete: permission?.can_delete || false,
    };
  });
};

const UserManagementPanel = () => {
  const [users, setUsers] = useState([]);
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [permissionRows, setPermissionRows] = useState([]);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersData, mastersData] = await Promise.all([
        listUsersRequest(),
        listMasterOptionsRequest(),
      ]);
      setUsers(usersData);
      setMasters(mastersData);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const permissionSummary = useMemo(
    () =>
      users.reduce((acc, user) => {
        acc[user.id] = (user.master_permissions || [])
          .filter(
            (permission) =>
              permission.can_read ||
              permission.can_create_update ||
              permission.can_delete,
          )
          .map((permission) => {
            const flags = [];
            if (permission.can_read) flags.push("R");
            if (permission.can_create_update) flags.push("CU");
            if (permission.can_delete) flags.push("D");
            return `${permission.master_label} (${flags.join("/") || "-"})`;
          })
          .join(", ");
        return acc;
      }, {}),
    [users],
  );

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(defaultForm);
    setPermissionRows(buildPermissionRows(masters));
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      is_active: user.is_active,
    });
    setPermissionRows(buildPermissionRows(masters, user.master_permissions || []));
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setForm(defaultForm);
    setFormError("");
    setPermissionRows([]);
  };

  const setPermissionValue = (masterName, key, value) => {
    setPermissionRows((prev) =>
      prev.map((permission) => {
        if (permission.master_name !== masterName) return permission;
        if (key === "can_read" && !value) {
          return { ...permission, can_read: false, can_create_update: false, can_delete: false };
        }
        if (key === "can_create_update" && value) {
          return { ...permission, can_create_update: true, can_read: true };
        }
        if (key === "can_delete" && value) {
          return { ...permission, can_delete: true, can_read: true };
        }
        return { ...permission, [key]: value };
      }),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const permissionPayload = permissionRows.map((permission) => ({
        master_name: permission.master_name,
        can_read: permission.can_read,
        can_create_update: permission.can_create_update,
        can_delete: permission.can_delete,
      }));

      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        is_active: form.is_active,
        master_permissions: permissionPayload,
      };

      if (editingUser) {
        await updateUserRequest({ id: editingUser.id, payload });
      } else {
        if (!form.email || !form.password) {
          setFormError("Email and password are required.");
          setSaving(false);
          return;
        }
        await createUserRequest({
          ...payload,
          email: form.email,
          password: form.password,
          role: "user",
        });
      }

      await loadData();
      closeModal();
    } catch (requestError) {
      const data = requestError?.response?.data;
      const apiMessage =
        data?.detail ||
        data?.email?.[0] ||
        data?.password?.[0] ||
        data?.master_permissions?.[0]?.master_name?.[0] ||
        data?.master_permissions?.[0]?.non_field_errors?.[0] ||
        data?.non_field_errors?.[0] ||
        "Unable to save user.";
      setFormError(apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteUserRequest(id);
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  return (
    <div className="content-card">
      <div className="section-head">
        <div>
          <h2>User Management</h2>
          <p>Create normal users and assign master-level read/write permissions.</p>
        </div>
        <button type="button" className="add-btn" onClick={openCreateModal}>
          Add User
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Status</th>
                <th>Master Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No users available.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{`${user.first_name || ""} ${user.last_name || ""}`.trim() || "-"}</td>
                    <td>{user.is_active ? "Active" : "Inactive"}</td>
                    <td>{permissionSummary[user.id] || "No access assigned"}</td>
                    <td>
                      <div className="action-group">
                        <button type="button" className="small-btn" onClick={() => openEditModal(user)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="small-btn danger"
                          onClick={() => handleDelete(user.id)}
                          disabled={saving}
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

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card user-modal" onClick={(event) => event.stopPropagation()}>
            <h3>{editingUser ? "Edit User" : "Create User"}</h3>
            <form className="form" onSubmit={handleSubmit}>
              {!editingUser && (
                <>
                  <label htmlFor="user-email">Email</label>
                  <input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                  />

                  <label htmlFor="user-password">Password</label>
                  <input
                    id="user-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    required
                  />
                </>
              )}

              <label htmlFor="user-first">First Name</label>
              <input
                id="user-first"
                type="text"
                value={form.first_name}
                onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
              />

              <label htmlFor="user-last">Last Name</label>
              <input
                id="user-last"
                type="text"
                value={form.last_name}
                onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
              />

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
                Active User
              </label>

              <div className="permission-grid">
                <h4>Master Permissions</h4>
                {permissionRows.map((permission) => (
                  <div key={permission.master_name} className="permission-row">
                    <span>{permission.label}</span>
                    <button
                      type="button"
                      className={`perm-icon ${permission.can_read ? "active" : ""}`}
                      title="Read"
                      onClick={() =>
                        setPermissionValue(permission.master_name, "can_read", !permission.can_read)
                      }
                    >
                      R
                    </button>
                    <button
                      type="button"
                      className={`perm-icon ${permission.can_create_update ? "active" : ""}`}
                      title="Create/Update"
                      onClick={() =>
                        setPermissionValue(
                          permission.master_name,
                          "can_create_update",
                          !permission.can_create_update,
                        )
                      }
                    >
                      CU
                    </button>
                    <button
                      type="button"
                      className={`perm-icon ${permission.can_delete ? "active" : ""}`}
                      title="Delete"
                      onClick={() =>
                        setPermissionValue(permission.master_name, "can_delete", !permission.can_delete)
                      }
                    >
                      D
                    </button>
                  </div>
                ))}
              </div>

              {formError && <p className="error">{formError}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;
