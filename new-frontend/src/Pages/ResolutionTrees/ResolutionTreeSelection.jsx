import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { resolutionTreeService } from "../../services/resolutiontree.service";

const ResolutionTreeSelection = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        setLoading(true);
        const response = await resolutionTreeService.getAllResolutionTrees(user.id);
        setSaved(response.data || []);
      } catch (err) {
        console.error("Error fetching resolution trees:", err);
        setError("Failed to load saved resolution trees");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchSaved();
  }, [user]);

  const handleEdit = (treeId) => {
    navigate(`/resolution-trees/edit/${treeId}`);
  };

  const handleDelete = async (treeId) => {
    if (!window.confirm("Are you sure you want to delete this resolution tree?")) return;
    try {
      await resolutionTreeService.deleteResolutionTree(treeId);
      setSaved((prev) => prev.filter((t) => t._id !== treeId));
    } catch (err) {
      console.error("Error deleting resolution tree:", err);
      setError("Failed to delete resolution tree");
    }
  };

  const countNodes = (node) => {
    if (!node) return 0;
    // Don't count the virtual root
    let count = node.id === -1 ? 0 : 1;
    if (node.children && node.children.length > 0) {
      count += node.children.reduce((acc, child) => acc + countNodes(child), 0);
    }
    return count;
  };

  const getDepth = (node) => {
    if (!node) return 0;
    if (!node.children || node.children.length === 0) return node.id === -1 ? 0 : 1;
    const childDepths = node.children.map(getDepth);
    const base = node.id === -1 ? 0 : 1;
    return base + Math.max(...childDepths, 0);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Resolution Trees</h1>

      <div className="w-full mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Create New Resolution Tree
          </h2>
          <p className="text-gray-600 mb-4">
            Build a new resolution tree from scratch and generate LaTeX.
          </p>
          <Link
            to="/resolution-trees/create"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
          >
            Create New Resolution Tree
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Saved Resolution Trees
          </h2>
          <p className="text-gray-600 mb-4">
            View and edit your previously saved resolution trees.
          </p>
          <button
            onClick={() =>
              document
                .getElementById("saved-resolution-trees")
                .scrollIntoView({ behavior: "smooth" })
            }
            className="block w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded text-center transition-colors"
          >
            View Saved Trees
          </button>
        </div>
      </div>

      <div id="saved-resolution-trees" className="w-full">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Your Saved Resolution Trees
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">
              Loading your saved resolution trees...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : saved.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              You don't have any saved resolution trees yet.
            </p>
            <Link
              to="/resolution-trees/create"
              className="inline-block mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
            >
              Create Your First Resolution Tree
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800">
                    {t.name || "Untitled Resolution Tree"}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {t.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {t.description}
                  </p>
                )}

                <div className="text-sm text-gray-600 mb-3">
                  <p>Nodes: {countNodes(t.treeData)}</p>
                  <p>Depth: {getDepth(t.treeData)}</p>
                  <p>Extra links: {t.extraLinks?.length || 0}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(t._id)}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
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

export default ResolutionTreeSelection;

