import React, { useEffect, useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import { Link, NavLink } from "react-router-dom";
import { SidebarData, ProfileSidebarData } from "./SidebarData.jsx";
import { IconContext } from "react-icons";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Prevent body scroll when the mobile drawer is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = isOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const navItems = useMemo(() => {
    const items = [...SidebarData];
    if (user && user.isAdmin) {
      items.push({
        title: "Analytics",
        path: "/analytics",
        icon: <AiIcons.AiOutlineBarChart />,
        cName: "nav-text",
      });
    }
    if (user) {
      items.push(...ProfileSidebarData);
    }
    return items;
  }, [user]);

  const linkBase =
    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const linkActive = "bg-blue-50 text-blue-700";
  const linkInactive = "text-gray-700 hover:bg-gray-100";

  const SidebarContent = ({ collapsed }) => (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between gap-2">
        {!collapsed && (
          <Link
            to="/"
            className="text-xl font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis"
            onClick={() => setIsOpen(false)}
            title="Home"
          >
            LaTeX Generator
          </Link>
        )}
        <button
          className={`hidden md:inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 ${
            collapsed ? "mx-auto" : ""
          }`}
          onClick={() => {
            setIsCollapsed((prev) => {
              const next = !prev;
              try {
                localStorage.setItem("sidebar_collapsed", next ? "1" : "0");
              } catch {
                // ignore
              }
              return next;
            });
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <AiIcons.AiOutlineRight /> : <AiIcons.AiOutlineLeft />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `${linkBase} ${collapsed ? "justify-center" : ""} ${
                    isActive ? linkActive : linkInactive
                  }`
                }
                title={collapsed ? item.title : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span>{item.title}</span>}
                {collapsed && <span className="sr-only">{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-4 space-y-3">
        {user ? (
          <>
            {!collapsed ? (
              <div className="text-sm text-gray-600">
                Logged as:{" "}
                <span className="font-semibold text-gray-800">{user.name}</span>
              </div>
            ) : (
              <div
                className="w-full flex items-center justify-center"
                title={`Logged as: ${user.name}`}
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {String(user.name ?? "U").slice(0, 1).toUpperCase()}
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className={`${
                collapsed ? "w-10 h-10 mx-auto" : "w-full py-2 px-4"
              } bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium flex items-center justify-center`}
              title={collapsed ? "Logout" : undefined}
            >
              {collapsed ? <AiIcons.AiOutlineLogout /> : "Logout"}
            </button>
          </>
        ) : (
          <div className={`${collapsed ? "flex flex-col items-center" : "grid grid-cols-2"} gap-2`}>
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className={`${
                collapsed ? "w-10 h-10" : "py-2 px-3"
              } text-center bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium flex items-center justify-center`}
              title={collapsed ? "Login" : undefined}
            >
              {collapsed ? <AiIcons.AiOutlineLogin /> : "Login"}
            </Link>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className={`${
                collapsed ? "w-10 h-10" : "py-2 px-3"
              } text-center bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium flex items-center justify-center`}
              title={collapsed ? "Register" : undefined}
            >
              {collapsed ? <AiIcons.AiOutlineUserAdd /> : "Register"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <IconContext.Provider value={{ color: "#000000ff" }}>
        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
          <button
            className="text-gray-900 text-2xl"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            <FaIcons.FaBars />
          </button>
          <Link to="/" className="text-lg font-bold text-gray-900">
            LaTeX Generator
          </Link>
          <div className="w-8" />
        </div>

        {/* Desktop sidebar */}
        <aside
          className={`hidden md:flex md:shrink-0 md:h-screen md:sticky md:top-0 bg-white border-r border-gray-200 transition-[width] duration-200 ${
            isCollapsed ? "md:w-20" : "md:w-72"
          }`}
        >
          <div className="w-full">
            <SidebarContent collapsed={isCollapsed} />
          </div>
        </aside>

        {/* Mobile drawer */}
        {isOpen && (
          <div className="md:hidden">
            <button
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu overlay"
            />
            <aside className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl">
              <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Menu</span>
                <button
                  className="text-2xl text-gray-900"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <AiIcons.AiOutlineClose />
                </button>
              </div>
              <SidebarContent collapsed={false} />
            </aside>
          </div>
        )}
      </IconContext.Provider>
    </>
  );
}

export default Navbar;
