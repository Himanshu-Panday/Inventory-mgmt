import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../components/AuthProvider";
import rudraLogo from "../assets/RUDRA_LOGO.png";
import { setActiveTab } from "../store/uiSlice";

const MasterCrudPanel = lazy(() => import("../components/MasterCrudPanel"));
const VendorCrudPanel = lazy(() => import("../components/VendorCrudPanel"));
const UserManagementPanel = lazy(() => import("../components/UserManagementPanel"));
const WaxReceivePanel = lazy(() => import("../components/WaxReceivePanel"));
const IssueMasterPanel = lazy(() => import("../components/IssueMasterPanel"));
const StockManagementPanel = lazy(() => import("../components/StockManagementPanel"));
const DeletedRecordsPanel = lazy(() => import("../components/DeletedRecordsPanel"));

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
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.ui.activeTab);
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
      return [...MASTER_TABS.map((item) => item.label), "User Management", "Deleted Records"];
    }
    return MASTER_TABS.filter((tab) => permissionMap.get(tab.key)?.can_read).map((tab) => tab.label);
  }, [permissionMap, user]);

  useEffect(() => {
    if (!navItems.includes(activeTab)) {
      dispatch(setActiveTab(navItems[0] || ""));
    }
  }, [activeTab, navItems, dispatch]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const renderActiveModule = () => {
    const tabMeta = MASTER_TABS.find((tab) => tab.label === activeTab);
    const canCreateUpdate =
      user?.role === "admin" || Boolean(permissionMap.get(tabMeta?.key)?.can_create_update);
    const canDelete =
      user?.role === "admin" || Boolean(permissionMap.get(tabMeta?.key)?.can_delete);

    if (activeTab === "User Management" && user?.role === "admin") {
      return (
        <Suspense fallback={<div className="content-card"><div className="inline-loader" /></div>}>
          <UserManagementPanel />
        </Suspense>
      );
    }

    if (activeTab === "Vendor-Master") {
      return (
        <Suspense fallback={<div className="content-card"><div className="inline-loader" /></div>}>
          <VendorCrudPanel canCreateUpdate={canCreateUpdate} canDelete={canDelete} />
        </Suspense>
      );
    }

    if (activeTab === "Item-Master" || activeTab === "Size-Master") {
      return (
        <Suspense fallback={<div className="content-card"><div className="inline-loader" /></div>}>
          <MasterCrudPanel
            tabName={activeTab}
            canCreateUpdate={canCreateUpdate}
            canDelete={canDelete}
          />
        </Suspense>
      );
    }

    if (activeTab === "Wax-Receive") {
      return (
        <Suspense fallback={<div className="content-card"><div className="inline-loader" /></div>}>
          <WaxReceivePanel canCreateUpdate={canCreateUpdate} />
        </Suspense>
      );
    }

    if (activeTab === "Issue-Master") {
      return (
        <Suspense fallback={<div className="content-card"><div className="inline-loader" /></div>}>
          <IssueMasterPanel canCreateUpdate={canCreateUpdate} canDelete={canDelete} />
        </Suspense>
      );
    }

    if (activeTab === "StockManagement") {
      return (
        <Suspense fallback={<div className="content-card"><div className="inline-loader" /></div>}>
          <StockManagementPanel />
        </Suspense>
      );
    }

    if (activeTab === "Deleted Records" && user?.role === "admin") {
      return (
        <Suspense fallback={<div className="content-card"><div className="inline-loader" /></div>}>
          <DeletedRecordsPanel />
        </Suspense>
      );
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
                dispatch(setActiveTab(item));
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

          <div className="topbar-logo">
            <img src={rudraLogo} alt="Rudra Jewels" />
          </div>

          <div className="profile-wrap">
            <button
              type="button"
              className="profile-btn"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-label="Profile"
            >
            </button>

            {profileOpen && (
              <div className="profile-card">
                <h2>
                  {`${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                    user?.email ||
                    "Profile"}
                </h2>
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
