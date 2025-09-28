import React, { useState } from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import { Link } from "react-router-dom";
import { SidebarData } from "./SidebarData.jsx";
// import "./Navbar.css";
import { IconContext } from "react-icons";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const [navbarOpen, setNavbarOpen] = useState(false);

  return (
    <>
      <IconContext.Provider value={{ color: "#000000ff" }}>
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-gray-800">
              LaTeX Generator
            </Link>
          </div>
          <div className="flex items-center">
            <button
              className="text-gray-800 text-2xl md:hidden"
              onClick={() => setNavbarOpen(!navbarOpen)}
            >
              <FaIcons.FaBars />
            </button>
            <div
              className={`md:flex ${
                navbarOpen ? "block" : "hidden"
              } w-full md:w-auto`}
            >
              <ul className="flex justify-center items-center space-x-4">
                {SidebarData.map((item, index) => (
                  <li key={index} className="nav-item">
                    <Link
                      to={item.path}
                      className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-200 rounded"
                    >
                      {item.icon}
                      <span className="ml-2">{item.title}</span>
                    </Link>
                  </li>
                ))}
                {user && user.isAdmin && (
                  <li className="nav-item">
                    <Link
                      to="/analytics"
                      className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-200 rounded"
                    >
                      <AiIcons.AiOutlineBarChart />
                      <span className="ml-2">Analytics</span>
                    </Link>
                  </li>
                )}
                {user ? (
                  <>
                    <li className="nav-item">
                      <span className="block px-4 py-2 text-gray-800">
                        Logged as: {user.name}
                      </span>
                    </li>
                    <li className="nav-item">
                      <button
                        onClick={logout}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded ml-4"
                      >
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item">
                      <Link
                        to="/login"
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded ml-4"
                      >
                        Login
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/register"
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded ml-4"
                      >
                        Register
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </nav>
      </IconContext.Provider>
    </>
  );
}

export default Navbar;
