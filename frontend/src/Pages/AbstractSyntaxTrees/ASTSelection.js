import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const ASTSelection = () => {
  const [savedTrees, setSavedTrees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Fetch saved ASTs from the backend
    const fetchSavedTrees = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:3001/api/abstractsyntax?userId=${user.id}`
        );
        setSavedTrees(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching ASTs:", err);
        setError("Failed to load saved ASTs");
        setLoading(false);
      }
    };

    if (user) {
      setLoading(true);
      fetchSavedTrees();
    }
  }, [user]);

  const handleEditTree = (treeId) => {
    navigate(`/abstract-syntax-trees/edit/${treeId}`);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Abstract Syntax Trees
      </h1>

      <div className="w-full mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create New Tree Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Create New Tree
          </h2>
          <p className="text-gray-600 mb-4">
            Design a new Abstract Syntax Tree from scratch with custom
            configuration.
          </p>
          <Link
            to="/abstract-syntax-trees/create"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
          >
            Create New Tree
          </Link>
        </div>

        {/* View Saved Trees Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Saved Trees
          </h2>
          <p className="text-gray-600 mb-4">
            View and edit your previously saved Abstract Syntax Trees.
          </p>
          <button
            onClick={() =>
              document
                .getElementById("saved-trees")
                .scrollIntoView({ behavior: "smooth" })
            }
            className="block w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded text-center transition-colors"
          >
            View Saved Trees
          </button>
        </div>
      </div>

      {/* Saved Trees Section */}
      <div id="saved-trees" className="w-full">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Your Saved Trees
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading your saved trees...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : savedTrees.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You don't have any saved trees yet.</p>
            <Link
              to="/abstract-syntax-trees/create"
              className="inline-block mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
            >
              Create Your First Tree
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedTrees.map((tree) => (
              <div
                key={tree._id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{tree.value}</h3>
                  <span className="text-xs text-gray-500">
                    {new Date(tree.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <p>Nodes: {tree.nodeCount}</p>
                  <p>Edges: {tree.edgeCount}</p>
                </div>
                <button
                  onClick={() => handleEditTree(tree._id)}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center text-sm transition-colors"
                >
                  Edit Tree
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ASTSelection;
