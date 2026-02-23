import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaEnvelope, FaIdCard, FaBuilding, FaUserTie } from "react-icons/fa";
import { toast } from "react-toastify";
import ByokService from "../services/byok.service";

const UserProfile = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [byokStatus, setByokStatus] = useState({
    configured: false,
    last4: null,
    updatedAt: null,
  });
  const [byokLoading, setByokLoading] = useState(true);
  const [byokSaving, setByokSaving] = useState(false);
  const [byokDeleting, setByokDeleting] = useState(false);
  const [byokKeyInput, setByokKeyInput] = useState("");
  const [byokError, setByokError] = useState(null);

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (err) {
        setError("Failed to load user data");
      }
    } else {
      setError("No user data found");
    }
    setLoading(false);
  }, []);

  const loadByokStatus = async () => {
    try {
      setByokLoading(true);
      setByokError(null);
      const response = await ByokService.getStatus();
      const data = response.data?.data || {};
      setByokStatus({
        configured: Boolean(data.configured),
        last4: data.last4 || null,
        updatedAt: data.updatedAt || null,
      });
    } catch (err) {
      console.error("Failed to load BYOK status:", err);
      setByokError("Failed to load BYOK status");
    } finally {
      setByokLoading(false);
    }
  };

  useEffect(() => {
    loadByokStatus();
  }, []);

  const handleSaveByokKey = async () => {
    if (!byokKeyInput.trim()) {
      toast.error("Please enter your OpenRouter API key");
      return;
    }

    try {
      setByokSaving(true);
      const response = await ByokService.saveKey(byokKeyInput.trim());
      const data = response.data?.data || {};
      setByokStatus({
        configured: Boolean(data.configured),
        last4: data.last4 || null,
        updatedAt: data.updatedAt || null,
      });
      setByokKeyInput("");
      toast.success("OpenRouter key saved");
    } catch (err) {
      console.error("Failed to save BYOK key:", err);
      const message = err.response?.data?.message || "Failed to save key";
      toast.error(message);
    } finally {
      setByokSaving(false);
    }
  };

  const handleDeleteByokKey = async () => {
    try {
      setByokDeleting(true);
      const response = await ByokService.deleteKey();
      const data = response.data?.data || {};
      setByokStatus({
        configured: Boolean(data.configured),
        last4: data.last4 || null,
        updatedAt: data.updatedAt || null,
      });
      toast.success("OpenRouter key removed");
    } catch (err) {
      console.error("Failed to delete BYOK key:", err);
      const message = err.response?.data?.message || "Failed to delete key";
      toast.error(message);
    } finally {
      setByokDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaUser className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 m-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaUser className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="ml-3">
            <p className="text-yellow-700">No user profile data available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <div className="flex items-center">
            <div className="bg-white p-3 rounded-full mr-4">
              <FaUser className="text-blue-500 text-2xl" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">User Profile</h1>
              <p className="text-blue-100">Welcome to your account</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                Basic Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FaUser className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{userData.name || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaEnvelope className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{userData.email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaIdCard className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="font-medium">{userData.id || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SSO Information */}
            {userData.ssoId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaBuilding className="mr-2 text-green-500" />
                  SSO Information
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <FaIdCard className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">SSO ID</p>
                      <p className="font-medium">{userData.ssoId || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaBuilding className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">SSO Provider</p>
                      <p className="font-medium">{userData.ssoProvider || "N/A"}</p>
                    </div>
                  </div>
                  {userData.employeeType && (
                    <div className="flex items-center">
                      <FaUserTie className="text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Employee Type</p>
                        <p className="font-medium">
                          {userData.employeeType === "S" && "Student"}
                          {userData.employeeType === "D" && "PhD Student"}
                          {userData.employeeType === "P" && "Faculty"}
                          {userData.employeeType === "N" && "Administrative"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account Status */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaUserTie className="mr-2 text-purple-500" />
              Account Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                <div>
                  <p className="text-sm text-gray-500">Account Status</p>
                  <p className="font-medium text-green-600">Active</p>
                </div>
              </div>
              {userData.isAdmin && (
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium text-yellow-600">Administrator</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BYOK Settings */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaUserTie className="mr-2 text-blue-500" />
              OpenRouter API Key (BYOK)
            </h2>
            {byokError && (
              <p className="text-sm text-red-600 mb-3">{byokError}</p>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    {byokLoading
                      ? "Loading..."
                      : byokStatus.configured
                      ? `Configured (••••${byokStatus.last4 || ""})`
                      : "Not configured"}
                  </p>
                  {byokStatus.updatedAt && (
                    <p className="text-xs text-gray-400">
                      Updated: {new Date(byokStatus.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {byokStatus.configured && (
                  <button
                    type="button"
                    onClick={handleDeleteByokKey}
                    disabled={byokDeleting}
                    className={`px-3 py-2 text-xs font-semibold rounded-md bg-red-100 text-red-600 hover:bg-red-200 ${
                      byokDeleting ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {byokDeleting ? "Removing..." : "Remove Key"}
                  </button>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="password"
                  value={byokKeyInput}
                  onChange={(e) => setByokKeyInput(e.target.value)}
                  placeholder="Paste your OpenRouter API key"
                  className="flex-1 p-3 border border-gray-300 rounded-lg text-sm"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={handleSaveByokKey}
                  disabled={byokSaving}
                  className={`px-4 py-3 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 ${
                    byokSaving ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {byokSaving ? "Saving..." : "Save Key"}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Your key is stored encrypted and never shared with other users.
              </p>
              <Link
                to="/byok-tutorial"
                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                How to get an OpenRouter key
              </Link>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaUser className="mr-2 text-blue-500" />
              About Your Account
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              This account is connected to the KPI Single Sign-On system, providing secure access to LaTeX Generator services.
              Your account information is synchronized with the university's authentication system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
