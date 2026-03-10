import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import MasterCrudPanel from "../components/MasterCrudPanel";
import UserManagementPanel from "../components/UserManagementPanel";
import VendorCrudPanel from "../components/VendorCrudPanel";
import { useAuth } from "../components/AuthProvider";

const MASTER_TABS = [
  { key: "vendor_master", label: "Vendor-Master" },
  { key: "item_master", label: "Item-Master" },
  { key: "size_master", label: "Size-Master" },
  { key: "wax_receive", label: "Wax-Receive" },
  { key: "issue_master", label: "Issue-Master" },
  { key: "stock_management", label: "StockManagement" },
];

const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const permissionMap = useMemo(() => {
    const map = new Map();
    (user?.master_permissions || []).forEach((permission) => {
      map.set(permission.master_name, permission);
    });
    return map;
  }, [user]);

  const navItems = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") {
      return [...MASTER_TABS.map((item) => item.label), "User Management"];
    }
    return MASTER_TABS.filter((tab) => permissionMap.get(tab.key)?.can_read).map((tab) => tab.label);
  }, [permissionMap, user]);

  const [activeTab, setActiveTab] = useState(navItems[0] || "");

  useEffect(() => {
    if (!navItems.includes(activeTab)) {
      setActiveTab(navItems[0] || "");
    }
  }, [activeTab, navItems]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const renderActiveModule = () => {
    const tabMeta = MASTER_TABS.find((tab) => tab.label === activeTab);
    const canWrite = user?.role === "admin" || Boolean(permissionMap.get(tabMeta?.key)?.can_write);

    if (activeTab === "User Management" && user?.role === "admin") {
      return <UserManagementPanel />;
    }

    if (activeTab === "Vendor-Master") {
      return <VendorCrudPanel canWrite={canWrite} />;
    }

    if (activeTab === "Item-Master" || activeTab === "Size-Master") {
      return <MasterCrudPanel tabName={activeTab} canWrite={canWrite} />;
    }

    if (!activeTab) {
      return (
        <div className="content-card">
          <h2>No Access</h2>
          <p>No master access has been assigned by admin yet.</p>
        </div>
      );
    }

    return (
      <div className="content-card">
        <h2>{activeTab}</h2>
        <p>Module setup for {activeTab} will be added here.</p>
      </div>
    );
  };

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">Modules</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              type="button"
              key={item}
              className={`nav-item ${activeTab === item ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item);
                setSidebarOpen(false);
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <div
        className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <section className="dashboard-main">
        <header className="topbar">
          <button
            type="button"
            className="hamburger"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>

          <h1>Inventory Management System</h1>

          <div className="profile-wrap">
            <button
              type="button"
              className="profile-btn"
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              Profile
            </button>

            {profileOpen && (
              <div className="profile-card">
                <h2>Home</h2>
                <p>Login successful. Welcome to inventory management.</p>
                <div className="meta">
                  <span>Email: {user?.email}</span>
                  <span>Role: {user?.role}</span>
                </div>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </header>

        {renderActiveModule()}
      </section>
    </div>
  );
};

export default HomePage;
