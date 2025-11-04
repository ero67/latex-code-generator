import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const KarnaughMapSelection = () => {
  const [savedMaps, setSavedMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  console.log(user);
  useEffect(() => {
    // Fetch saved Karnaugh maps from the backend
    const fetchSavedMaps = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:3001/api/karnaughmap?userId=${user.id}`
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
    if (window.confirm("Are you sure you want to delete this map?")) {
      try {
        await axios.delete(`http://localhost:3001/api/karnaughmap/${mapId}`);
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
      <h1 className="text-3xl font-bold mb-8 text-center">Karnaugh Maps</h1>

      <div className="w-full mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create New Map Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Create New Map
          </h2>
          <p className="text-gray-600 mb-4">
            Design a new Karnaugh map from scratch with custom configuration.
          </p>
          <Link
            to="/karnaugh-maps/create"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
            data-umami-event="Create new map button"
          >
            Create New Map
          </Link>
        </div>

        {/* View Saved Maps Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Saved Maps
          </h2>
          <p className="text-gray-600 mb-4">
            View and edit your previously saved Karnaugh maps.
          </p>
          <button
            onClick={() =>
              document
                .getElementById("saved-maps")
                .scrollIntoView({ behavior: "smooth" })
            }
            className="block w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded text-center transition-colors"
            data-umami-event="View saved maps button"
          >
            View Saved Maps
          </button>
        </div>
      </div>

      {/* Saved Maps Section */}
      <div id="saved-maps" className="w-full">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Your Saved Maps
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading your saved maps...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : savedMaps.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You don't have any saved maps yet.</p>
            <Link
              to="/karnaugh-maps/create"
              className="inline-block mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
              data-umami-event="Create your first map button"
            >
              Create Your First Map
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
                    {map.tableSize.replace("x", " × ")} Map
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(map.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <p>Implicants: {map.implicants.length}</p>
                  <p>Edge Implicants: {map.edgeImplicants.length}</p>
                </div>
                 <div className="flex gap-2">
                <button
                  onClick={() => handleEditMap(map._id)}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center text-sm transition-colors"
                  data-umami-event="Edit Karnaugh Map button"
                >
                  Edit Map
                </button>
                <button
                  onClick={() => handleDeleteMap(map._id)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors"
                  data-umami-event="Delete Karnaugh Map button"
                >
                  Delete
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
