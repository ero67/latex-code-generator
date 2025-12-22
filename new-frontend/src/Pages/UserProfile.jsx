import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaEnvelope, FaIdCard, FaBuilding, FaUserTie } from "react-icons/fa";

const UserProfile = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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