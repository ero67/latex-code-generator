import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
          `${API_URL}/ast?userId=${user.id}` // Changed endpoint
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
    navigate(`/ast/edit/${treeId}`);
  };

  const handleDeleteTree = async (treeId) => {
    if (window.confirm("Are you sure you want to delete this tree?")) {
      try {
        await axios.delete(`${API_URL}/ast/${treeId}`);
        // Remove the deleted tree from state
        setSavedTrees(savedTrees.filter(tree => tree._id !== treeId));
      } catch (err) {
        console.error("Error deleting tree:", err);
        setError("Failed to delete tree");
      }
    }
  };

  // Helper function to count nodes in a tree
  const countNodes = (node) => {
    if (!node) return 0;
    let count = 1; // Count current node
    if (node.children && node.children.length > 0) {
      count += node.children.reduce((acc, child) => acc + countNodes(child), 0);
    }
    return count;
  };

  // Helper function to count edges in a tree
  const countEdges = (node) => {
    if (!node || !node.children) return 0;
    let count = node.children.length; // Direct children edges
    count += node.children.reduce((acc, child) => acc + countEdges(child), 0);
    return count;
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
            to="/ast/create"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
            data-umami-event="Create new AST button"
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
            data-umami-event="View saved ASTs button"
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
              to="/ast/create"
              className="inline-block mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
              data-umami-event="Create your first AST button"
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
                  <h3 className="font-medium text-gray-800">
                    {tree.name || "Untitled Tree"}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(tree.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {tree.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {tree.description}
                  </p>
                )}
                
                <div className="text-sm text-gray-600 mb-3">
                  <p>Root: {tree.treeData?.value || "N/A"}</p>
                  <p>Nodes: {countNodes(tree.treeData)}</p>
                  <p>Edges: {countEdges(tree.treeData)}</p>
                  <p>
                    Orientation: {
                      ["Top-Down", "Left-Right", "Bottom-Up", "Right-Left"][
                        tree.settings?.indexOfOrientation || 0
                      ]
                    }
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTree(tree._id)}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center text-sm transition-colors"
                    data-umami-event="Edit AST button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTree(tree._id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors"
                    data-umami-event="Delete AST button"
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

export default ASTSelection;