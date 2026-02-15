import React, { useEffect, useMemo, useState, useRef } from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import { Link, NavLink } from "react-router-dom";
import { SidebarData, ProfileSidebarData } from "./SidebarData.jsx";
import { IconContext } from "react-icons";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close mobile menu on route change (handled by NavLink onClick)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = mobileMenuOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = useMemo(() => {
    const items = [...SidebarData];
    if (user && user.isAdmin) {
      items.push({
        title: "Analytics",
        path: "/analytics",
        icon: <AiIcons.AiOutlineBarChart />,
      });
      items.push({
        title: "Model Manager",
        path: "/admin/models",
        icon: <AiIcons.AiOutlineSetting />,
      });
      items.push({
        title: "Benchmark",
        path: "/admin/benchmark",
        icon: <AiIcons.AiOutlineExperiment />,
      });
    }
    return items;
  }, [user]);

  const linkBase =
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap";
  const linkActive = "bg-blue-100 text-blue-700";
  const linkInactive = "text-gray-700 hover:bg-gray-100 hover:text-gray-900";

  const mobileLinkBase =
    "flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors border-b border-gray-100";
  const mobileLinkActive = "bg-blue-50 text-blue-700";
  const mobileLinkInactive = "text-gray-700 hover:bg-gray-50";

  return (
    <IconContext.Provider value={{ color: "currentColor" }}>
      {/* Main Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="h-full w-full px-4 lg:px-6 flex items-center">
          {/* Left: Logo */}
          <Link
            to="/"
            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors shrink-0"
          >
            LaTeX Generator
          </Link>

          {/* Center: Desktop Navigation */}
          <div className="hidden min-[1401px]:flex items-center gap-1 ml-8">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right: User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-sm font-semibold text-blue-700">
                    {String(user.name ?? "U").slice(0, 1).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <AiIcons.AiOutlineDown className="text-gray-500 text-xs" />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    {ProfileSidebarData.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span>{item.icon}</span>
                        <span>{item.title}</span>
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <AiIcons.AiOutlineLogout />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="min-[1401px]:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <FaIcons.FaBars className="text-xl" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="min-[1401px]:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          />

          {/* Mobile Menu Panel */}
          <aside className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <span className="text-lg font-semibold text-gray-900">Menu</span>
              <button
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <AiIcons.AiOutlineClose className="text-xl" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto">
              <ul>
                {navItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `${mobileLinkBase} ${
                          isActive ? mobileLinkActive : mobileLinkInactive
                        }`
                      }
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.title}</span>
                    </NavLink>
                  </li>
                ))}
                {user &&
                  ProfileSidebarData.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `${mobileLinkBase} ${
                            isActive ? mobileLinkActive : mobileLinkInactive
                          }`
                        }
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.title}</span>
                      </NavLink>
                    </li>
                  ))}
              </ul>
            </nav>

            {/* Footer: Auth Actions */}
            <div className="shrink-0 border-t border-gray-200 p-4 bg-gray-50">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-sm font-semibold text-blue-700">
                      {String(user.name ?? "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <AiIcons.AiOutlineLogout />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-4 text-center border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-4 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </IconContext.Provider>
  );
}

export default Navbar;
