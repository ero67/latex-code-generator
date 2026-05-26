import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

// In production behind the reverse-proxy, use same-origin `/api` to avoid mixed-content/CORS issues.
const API_URL = import.meta.env.VITE_API_URL || "/api";

const KarnaughMapSelection = () => {
  const [savedMaps, setSavedMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  console.log(user);
  useEffect(() => {
    // Fetch saved Karnaugh maps from the backend
    const fetchSavedMaps = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_URL}/karnaughmap?userId=${user.id}`
        );
        setSavedMaps(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching Karnaugh maps:", err);
        setError("Failed to load saved Karnaugh maps");
        setLoading(false);
      }
    };
    if (user) {
      setLoading(true);
      fetchSavedMaps();
    }
  }, [user]);

  const handleEditMap = (mapId) => {
    navigate(`/karnaugh-maps/edit/${mapId}`);
  };

  const handleDeleteMap = async (mapId) => {
    if (window.confirm(t('common.confirm_delete', { item: t('karnaugh.name') }))) {
      try {
        await axios.delete(`${API_URL}/karnaughmap/${mapId}`);
        // Remove the deleted tree from state
        setSavedMaps(savedMaps.filter((map) => map._id !== mapId));
      } catch (err) {
        console.error("Error deleting map:", err);
        setError("Failed to delete map");
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">{t('karnaugh.title')}</h1>

      <div className="w-full mb-8 flex justify-center">
        {/* Create New Map Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow max-w-md w-full">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            {t('karnaugh.create_new')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('karnaugh.create_new_desc')}
          </p>
          <Link
            to="/karnaugh-maps/create"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
            data-umami-event="Create new map button"
          >
            {t('karnaugh.create_new')}
          </Link>
        </div>
      </div>

      {/* Saved Maps Section */}
      <div id="saved-maps" className="w-full">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          {t('karnaugh.your_saved')}
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">{t('karnaugh.loading_saved')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : savedMaps.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">{t('karnaugh.no_saved')}</p>
            <Link
              to="/karnaugh-maps/create"
              className="inline-block mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
              data-umami-event="Create your first map button"
            >
              {t('karnaugh.create_first')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedMaps.map((map) => (
              <div
                key={map._id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">
                    {map.tableSize.replace("x", " × ")} {t('karnaugh.map')}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(map.createdAt).toLocaleDateString(i18n.language === 'sk' ? 'sk-SK' : 'en-US')}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <p>{t('karnaugh.implicants')} {map.implicants.length}</p>
                  <p>{t('karnaugh.edge_implicants')} {map.edgeImplicants.length}</p>
                </div>
                 <div className="flex gap-2">
                <button
                  onClick={() => handleEditMap(map._id)}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center text-sm transition-colors"
                  data-umami-event="Edit Karnaugh Map button"
                >
                  {t('karnaugh.edit_map')}
                </button>
                <button
                  onClick={() => handleDeleteMap(map._id)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors"
                  data-umami-event="Delete Karnaugh Map button"
                >
                  {t('common.delete')}
                </button>
                                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KarnaughMapSelection;
