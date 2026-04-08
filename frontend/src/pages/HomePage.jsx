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

const NAV_ICON_MAP = {
  "Vendor-Master": "vendor",
  "Item-Master": "item",
  "Size-Master": "size",
  "Wax-Receive": "wax",
  "Issue-Master": "issue",
  "StockManagement": "stock",
  "User Management": "user",
  "Deleted Records": "trash",
};

const getNavIcon = (label) => NAV_ICON_MAP[label] || "default";


const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.ui.activeTab);

  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const permissionMap = useMemo(() => {
    const map = new Map();
    (user?.master_permissions || []).forEach((permission) => {
      map.set(permission.master_name, permission);
    });
    return map;
  }, [user]);

  const canViewDeletedRecords =
    user?.role === "admin" || Boolean(permissionMap.get("deleted_records")?.can_read);

  const navItems = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") {
      return [...MASTER_TABS.map((item) => item.label), "User Management", "Deleted Records"];
    }
    const items = MASTER_TABS.filter((tab) => permissionMap.get(tab.key)?.can_read).map(
      (tab) => tab.label,
    );
    if (canViewDeletedRecords) {
      items.push("Deleted Records");
    }
    return items;
  }, [permissionMap, user, canViewDeletedRecords]);

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

    if (activeTab === "Deleted Records" && canViewDeletedRecords) {
      return (
        <Suspense fallback={<div className="content-card"><div className="inline-loader" /></div>}>
          <DeletedRecordsPanel />
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
          <WaxReceivePanel canCreateUpdate={canCreateUpdate} canDelete={canDelete} />
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
        <div className="sidebar-header">
          <span>Modules</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              type="button"
              key={item}
              className={`nav-item ${activeTab === item ? "active" : ""}`}
              onClick={() => {
                dispatch(setActiveTab(item));
              }}
            >
              <span className="nav-icon" data-icon={getNavIcon(item)} aria-hidden="true" />
              <span>{item}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

      <section className="dashboard-main" onClick={() => { setProfileOpen(false); setSidebarOpen(false); }}>
        <header className="topbar">
          <button
            type="button"
            className="hamburger"
            aria-label="Open sidebar"
            onClick={(event) => { event.stopPropagation(); setSidebarOpen(true); }}
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
              onClick={(event) => {
              event.stopPropagation();
              setProfileOpen((prev) => !prev);
            }}
              aria-label="Profile"
            >
            </button>

            {profileOpen && (
              <div className="profile-card" onClick={(event) => event.stopPropagation()}>
              <div className="profile-header">
                <div className="profile-avatar">
                  {`${user?.first_name || ""} ${user?.last_name || ""}`.trim().slice(0, 1).toUpperCase() ||
                    user?.email?.slice(0, 1).toUpperCase() ||
                    "U"}
                </div>
                <div className="profile-title">
                  <h3>{user?.email || "Profile"}</h3>
                  <span>Login successful</span>
                </div>
              </div>
              <div className="profile-body">
                <div className="profile-row">
                  <span className="profile-icon email" aria-hidden="true" />
                  <div>
                    <strong>Email</strong>
                    <div>{user?.email || "-"}</div>
                  </div>
                </div>
                <div className="profile-row">
                  <span className="profile-icon role" aria-hidden="true" />
                  <div>
                    <strong>Role</strong>
                    <div>{user?.role || "-"}</div>
                  </div>
                </div>
              </div>
              <div className="profile-footer">
                <button className="profile-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
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
