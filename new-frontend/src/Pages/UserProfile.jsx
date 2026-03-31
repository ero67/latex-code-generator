import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaEnvelope, FaIdCard, FaBuilding, FaUserTie } from "react-icons/fa";
import { toast } from "react-toastify";
import ByokService from "../services/byok.service";
import { useTranslation } from "react-i18next";

const UserProfile = () => {
  const { t } = useTranslation();
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
        setError(t('profile.load_failed'));
      }
    } else {
      setError(t('profile.no_user'));
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
      setByokError(t('profile.status_load_failed'));
    } finally {
      setByokLoading(false);
    }
  };

  useEffect(() => {
    loadByokStatus();
  }, []);

  const handleSaveByokKey = async () => {
    if (!byokKeyInput.trim()) {
      toast.error(t('profile.enter_key'));
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
      toast.success(t('profile.key_saved'));
    } catch (err) {
      console.error("Failed to save BYOK key:", err);
      const message = err.response?.data?.message || t('profile.key_save_failed');
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
      toast.success(t('profile.key_removed'));
    } catch (err) {
      console.error("Failed to delete BYOK key:", err);
      const message = err.response?.data?.message || t('profile.key_remove_failed');
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
            <p className="text-yellow-700">{t('profile.no_data')}</p>
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
              <h1 className="text-white text-2xl font-bold">{t('profile.title')}</h1>
              <p className="text-blue-100">{t('profile.welcome')}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                {t('profile.basic_info')}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FaUser className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('profile.name')}</p>
                    <p className="font-medium">{userData.name || t('common.na')}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaEnvelope className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('profile.email')}</p>
                    <p className="font-medium">{userData.email || t('common.na')}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaIdCard className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('profile.user_id')}</p>
                    <p className="font-medium">{userData.id || t('common.na')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SSO Information */}
            {userData.ssoId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaBuilding className="mr-2 text-green-500" />
                  {t('profile.sso_info')}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <FaIdCard className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">{t('profile.sso_id')}</p>
                      <p className="font-medium">{userData.ssoId || t('common.na')}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaBuilding className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">{t('profile.sso_provider')}</p>
                      <p className="font-medium">{userData.ssoProvider || t('common.na')}</p>
                    </div>
                  </div>
                  {userData.employeeType && (
                    <div className="flex items-center">
                      <FaUserTie className="text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">{t('profile.employee_type')}</p>
                        <p className="font-medium">
                          {userData.employeeType === "S" && t('profile.student')}
                          {userData.employeeType === "D" && t('profile.phd_student')}
                          {userData.employeeType === "P" && t('profile.faculty')}
                          {userData.employeeType === "N" && t('profile.administrative')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>


          {/* BYOK Settings */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaUserTie className="mr-2 text-blue-500" />
              {t('profile.byok_title')}
            </h2>
            {byokError && (
              <p className="text-sm text-red-600 mb-3">{byokError}</p>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('profile.byok_status')}</p>
                  <p className="font-medium">
                    {byokLoading
                      ? t('common.loading')
                      : byokStatus.configured
                      ? t('profile.byok_configured', { last4: `••••${byokStatus.last4 || ""}` })
                      : t('profile.byok_not_configured')}
                  </p>
                  {byokStatus.updatedAt && (
                    <p className="text-xs text-gray-400">
                      {t('profile.byok_updated')} {new Date(byokStatus.updatedAt).toLocaleString()}
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
                    {byokDeleting ? t('profile.byok_removing') : t('profile.byok_remove')}
                  </button>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="password"
                  value={byokKeyInput}
                  onChange={(e) => setByokKeyInput(e.target.value)}
                  placeholder={t('profile.byok_placeholder')}
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
                  {byokSaving ? t('profile.byok_saving') : t('profile.byok_save')}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {t('profile.byok_security')}
              </p>
              <Link
                to="/byok-tutorial"
                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                {t('profile.byok_howto')}
              </Link>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaUser className="mr-2 text-blue-500" />
              {t('profile.about_account')}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {t('profile.about_account_desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
