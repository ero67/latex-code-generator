import React from "react";
import { FaKey, FaExternalLinkAlt } from "react-icons/fa";

const ByokTutorial = () => {
  return (
    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
          <FaKey />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Get Your OpenRouter API Key
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Quick steps to create and add your key for BYOK.
          </p>
        </div>
      </div>

      <ol className="space-y-4 text-sm text-gray-700">
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-gray-700">
            1
          </span>
          <div>
            <p className="font-medium text-gray-900">Sign in to OpenRouter</p>
            <p className="text-gray-600">
              Go to OpenRouter and log in with your account.
            </p>
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mt-2"
            >
              Open OpenRouter
              <FaExternalLinkAlt className="text-xs" />
            </a>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-gray-700">
            2
          </span>
          <div>
            <p className="font-medium text-gray-900">Open the API Keys page</p>
            <p className="text-gray-600">
              Navigate to your keys dashboard.
            </p>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mt-2"
            >
              Open API Keys
              <FaExternalLinkAlt className="text-xs" />
            </a>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-gray-700">
            3
          </span>
          <div>
            <p className="font-medium text-gray-900">Create a new key</p>
            <p className="text-gray-600">
              Click “Create key”, give it a name, then copy the key.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-gray-700">
            4
          </span>
          <div>
            <p className="font-medium text-gray-900">Save it in your profile</p>
            <p className="text-gray-600">
              Paste the key in your Profile → OpenRouter API Key (BYOK) section.
            </p>
          </div>
        </li>
      </ol>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-900">
          Keep your API key private. If you think it was exposed, revoke it in
          OpenRouter and create a new one.
        </p>
      </div>
    </div>
  );
};

export default ByokTutorial;
