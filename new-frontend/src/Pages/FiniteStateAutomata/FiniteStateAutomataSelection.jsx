import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fsaService } from "../../services/fsa.service";

const FiniteStateAutomataSelection = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        setLoading(true);
        const response = await fsaService.getAllFSA(user.id);
        setSaved(response.data || []);
      } catch (err) {
        console.error("Error fetching FSA:", err);
        setError("Failed to load saved finite state automata");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSaved();
    }
  }, [user]);

  const handleEdit = (id) => {
    navigate(`/finite-state-automata/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this automata?")) return;
    try {
      await fsaService.deleteFSA(id);
      setSaved((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Error deleting FSA:", err);
      setError("Failed to delete automata");
    }
  };

  const countStart = (nodes) => (nodes || []).filter((n) => n.isStart).length;
  const countAccepting = (nodes) =>
    (nodes || []).filter((n) => n.isAccepting).length;

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Finite State Automata
      </h1>

      <div className="w-full mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Create New Automata
          </h2>
          <p className="text-gray-600 mb-4">
            Design a new finite state automata from scratch and generate TikZ
            code.
          </p>
          <Link
            to="/finite-state-automata/create"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
          >
            Create New Automata
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Saved Automata
          </h2>
          <p className="text-gray-600 mb-4">
            View and edit your previously saved finite state automata.
          </p>
          <button
            onClick={() =>
              document
                .getElementById("saved-automata")
                .scrollIntoView({ behavior: "smooth" })
            }
            className="block w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded text-center transition-colors"
          >
            View Saved Automata
          </button>
        </div>
      </div>

      <div id="saved-automata" className="w-full">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Your Saved Automata
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading your saved automata...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : saved.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You don't have any saved automata yet.</p>
            <Link
              to="/finite-state-automata/create"
              className="inline-block mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
            >
              Create Your First Automata
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((a) => (
              <div
                key={a._id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800">
                    {a.name || "Untitled Automata"}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {a.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {a.description}
                  </p>
                )}

                <div className="text-sm text-gray-600 mb-3">
                  <p>States: {a.nodes?.length || 0}</p>
                  <p>Transitions: {a.edges?.length || 0}</p>
                  <p>Start: {countStart(a.nodes)}</p>
                  <p>Accepting: {countAccepting(a.nodes)}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(a._id)}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a._id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors"
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

export default FiniteStateAutomataSelection;


