import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const Home = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mb-8">{t('home.title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">{t('home.karnaugh_maps')}</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {t('home.karnaugh_maps_desc')}
          </p>
          <Link to="/karnaugh-maps">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              {t('home.go_to_karnaugh')}
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">{t('home.ast')}</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {t('home.ast_desc')}
          </p>
          <Link to="/ast">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              {t('home.go_to_ast')}
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">{t('home.proof_trees')}</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {t('home.proof_trees_desc')}
          </p>
          <Link to="/proof-trees">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              {t('home.go_to_proof_trees')}
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">{t('home.fsa')}</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {t('home.fsa_desc')}
          </p>
          <Link to="/finite-state-automata">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              {t('home.go_to_fsa')}
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">{t('home.resolution_trees')}</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {t('home.resolution_trees_desc')}
          </p>
          <Link to="/resolution-trees">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              {t('home.go_to_resolution_trees')}
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">{t('home.image_to_latex')}</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {t('home.image_to_latex_desc')}
          </p>
          <Link to="/image-to-latex">
            <button className="bg-green-500 hover:bg-green-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
              {t('home.go_to_image_to_latex')}
            </button>
          </Link>
        </div>
        {user && user.isAdmin && (
          <div className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 p-5 transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">{t('home.analytics')}</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {t('home.analytics_desc')}
            </p>
            <Link to="/analytics">
              <button className="bg-purple-500 hover:bg-purple-600 text-white py-1.5 px-4 rounded-lg w-full text-sm font-medium transition-colors">
                {t('home.go_to_analytics')}
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
