import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { fsaService } from "../../services/fsa.service";

const FiniteStateAutomataSelection = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

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
    if (!window.confirm(t('common.confirm_delete', { item: t('fsa.name') }))) return;
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
        {t('fsa.title')}
      </h1>

      <div className="w-full mb-8 flex justify-center">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow max-w-md w-full">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            {t('fsa.create_new')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('fsa.create_new_desc')}
          </p>
          <Link
            to="/finite-state-automata/create"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
          >
            {t('fsa.create_new')}
          </Link>
        </div>
      </div>

      <div id="saved-automata" className="w-full">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          {t('fsa.your_saved')}
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">{t('fsa.loading_saved')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : saved.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">{t('fsa.no_saved')}</p>
            <Link
              to="/finite-state-automata/create"
              className="inline-block mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
            >
              {t('fsa.create_first')}
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
                    {a.name || t('common.untitled', { item: t('fsa.name') })}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(a.createdAt).toLocaleDateString(i18n.language === 'sk' ? 'sk-SK' : 'en-US')}
                  </span>
                </div>

                {a.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {a.description}
                  </p>
                )}

                <div className="text-sm text-gray-600 mb-3">
                  <p>{t('fsa.states')} {a.nodes?.length || 0}</p>
                  <p>{t('fsa.transitions')} {a.edges?.length || 0}</p>
                  <p>{t('fsa.start')} {countStart(a.nodes)}</p>
                  <p>{t('fsa.accepting')} {countAccepting(a.nodes)}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(a._id)}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center text-sm transition-colors"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(a._id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors"
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

export default FiniteStateAutomataSelection;


