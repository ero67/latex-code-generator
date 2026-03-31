import React from "react";
import { FaKey, FaExternalLinkAlt, FaServer, FaCreditCard, FaShieldAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const ByokTutorial = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
          <FaKey />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('byok_tutorial.title')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('byok_tutorial.subtitle')}
          </p>
        </div>
      </div>

      <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {t('byok_tutorial.what_is')}
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          {t('byok_tutorial.what_is_desc')}
        </p>
        <p className="text-sm text-gray-700 mb-4">
          {t('byok_tutorial.what_is_desc2')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="flex items-start gap-2">
            <FaServer className="text-blue-600 mt-1" />
            <div>
              <p className="text-xs font-semibold text-gray-900">{t('byok_tutorial.models')}</p>
              <p className="text-xs text-gray-600">{t('byok_tutorial.models_desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FaCreditCard className="text-blue-600 mt-1" />
            <div>
              <p className="text-xs font-semibold text-gray-900">{t('byok_tutorial.pay')}</p>
              <p className="text-xs text-gray-600">{t('byok_tutorial.pay_desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FaShieldAlt className="text-blue-600 mt-1" />
            <div>
              <p className="text-xs font-semibold text-gray-900">{t('byok_tutorial.secure')}</p>
              <p className="text-xs text-gray-600">{t('byok_tutorial.secure_desc')}</p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('byok_tutorial.howto')}
      </h3>

      <ol className="space-y-4 text-sm text-gray-700">
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-gray-700">
            1
          </span>
          <div>
            <p className="font-medium text-gray-900">{t('byok_tutorial.step1_title')}</p>
            <p className="text-gray-600">
              {t('byok_tutorial.step1_desc')}
            </p>
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mt-2"
            >
              {t('byok_tutorial.step1_link')}
              <FaExternalLinkAlt className="text-xs" />
            </a>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-gray-700">
            2
          </span>
          <div>
            <p className="font-medium text-gray-900">{t('byok_tutorial.step2_title')}</p>
            <p className="text-gray-600">
              {t('byok_tutorial.step2_desc')}
            </p>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mt-2"
            >
              {t('byok_tutorial.step2_link')}
              <FaExternalLinkAlt className="text-xs" />
            </a>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-gray-700">
            3
          </span>
          <div>
            <p className="font-medium text-gray-900">{t('byok_tutorial.step3_title')}</p>
            <p className="text-gray-600">
              {t('byok_tutorial.step3_desc')}
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-gray-700">
            4
          </span>
          <div>
            <p className="font-medium text-gray-900">{t('byok_tutorial.step4_title')}</p>
            <p className="text-gray-600">
              {t('byok_tutorial.step4_desc')}
            </p>
          </div>
        </li>
      </ol>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-900">
          {t('byok_tutorial.warning')}
        </p>
      </div>
    </div>
  );
};

export default ByokTutorial;
