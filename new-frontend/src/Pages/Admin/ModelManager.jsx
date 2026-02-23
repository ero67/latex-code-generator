import React, { useEffect, useState } from "react";
import { FaPlus, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import ModelService from "../../services/model.service";
import SettingsService from "../../services/settings.service";

const ModelManager = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newModelId, setNewModelId] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEnabled, setNewEnabled] = useState(true);
  const [nameEdits, setNameEdits] = useState({});
  const [byokEnabled, setByokEnabled] = useState(false);
  const [byokLoading, setByokLoading] = useState(true);
  const [byokSaving, setByokSaving] = useState(false);

  const token = localStorage.getItem("token");

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await ModelService.getAllModels(token);
      const data = response.data?.data || [];
      setModels(data);
      const initialEdits = {};
      data.forEach((item) => {
        initialEdits[item._id] = item.displayName || "";
      });
      setNameEdits(initialEdits);
    } catch (error) {
      console.error("Failed to load models:", error);
      toast.error("Failed to load models");
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setByokLoading(true);
      const response = await SettingsService.getSettings(token);
      const settings = response.data?.data;
      setByokEnabled(Boolean(settings?.byokEnabled));
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setByokLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
    loadSettings();
  }, []);

  const handleToggleByok = async () => {
    try {
      setByokSaving(true);
      const nextValue = !byokEnabled;
      await SettingsService.updateSettings(token, {
        byokEnabled: nextValue,
        byokProvider: "openrouter",
      });
      setByokEnabled(nextValue);
      toast.success(
        nextValue
          ? "BYOK enabled. Users must add their OpenRouter key."
          : "BYOK disabled. Using server key."
      );
    } catch (error) {
      console.error("Failed to update BYOK settings:", error);
      toast.error("Failed to update BYOK settings");
    } finally {
      setByokSaving(false);
    }
  };

  const handleCreateModel = async (event) => {
    event.preventDefault();
    if (!newModelId.trim()) {
      toast.error("Model ID is required");
      return;
    }

    try {
      await ModelService.createModel(token, {
        modelId: newModelId.trim(),
        displayName: newDisplayName.trim() || undefined,
        enabled: newEnabled,
      });
      toast.success("Model added");
      setNewModelId("");
      setNewDisplayName("");
      setNewEnabled(true);
      loadModels();
    } catch (error) {
      console.error("Failed to create model:", error);
      const message = error.response?.data?.message || "Failed to add model";
      toast.error(message);
    }
  };

  const handleToggleEnabled = async (model) => {
    try {
      await ModelService.updateModel(token, model._id, {
        enabled: !model.enabled,
      });
      loadModels();
    } catch (error) {
      console.error("Failed to update model:", error);
      toast.error("Failed to update model");
    }
  };

  const handleSaveDisplayName = async (model) => {
    try {
      await ModelService.updateModel(token, model._id, {
        displayName: nameEdits[model._id],
      });
      toast.success("Display name updated");
      loadModels();
    } catch (error) {
      console.error("Failed to update display name:", error);
      toast.error("Failed to update display name");
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">OpenRouter Models</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage the list of OpenRouter models available in the Image to LaTeX
          dropdown.
        </p>
      </div>

      <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Bring Your Own Key (BYOK)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              When enabled, Image to LaTeX requires users to add their own
              OpenRouter API key.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleByok}
            disabled={byokLoading || byokSaving}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              byokEnabled
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            } ${byokLoading || byokSaving ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {byokLoading
              ? "Loading..."
              : byokEnabled
              ? "BYOK Enabled"
              : "BYOK Disabled"}
          </button>
        </div>
      </div>

      <form
        onSubmit={handleCreateModel}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8"
      >
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Model ID
          </label>
          <input
            type="text"
            value={newModelId}
            onChange={(e) => setNewModelId(e.target.value)}
            placeholder="openai/gpt-4.1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Display Name (optional)
          </label>
          <input
            type="text"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            placeholder="GPT-4.1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={newEnabled}
              onChange={(e) => setNewEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            Enabled
          </label>
          <button
            type="submit"
            className="ml-auto inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <FaPlus />
            Add Model
          </button>
        </div>
      </form>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left px-4 py-3">Model ID</th>
              <th className="text-left px-4 py-3">Display Name</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {models.map((model) => (
              <tr key={model._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-800">
                  {model.modelId}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameEdits[model._id] ?? ""}
                      onChange={(e) =>
                        setNameEdits((prev) => ({
                          ...prev,
                          [model._id]: e.target.value,
                        }))
                      }
                      className="w-full max-w-xs p-2 border border-gray-200 rounded-md"
                      placeholder="-"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveDisplayName(model)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold"
                    >
                      <FaSave />
                      Save
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      model.enabled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {model.enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(model)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      model.enabled
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {model.enabled ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && models.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No models configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Link to OpenRouter Models */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          OpenRouter Models
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          <a
            href="https://openrouter.ai/models"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Browse all available models
          </a>{" "}
          in the OpenRouter console.
        </p>
      </div>
    </div>
  );
};

export default ModelManager;
