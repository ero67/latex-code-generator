import React from "react";
import { FaKey, FaExternalLinkAlt, FaServer, FaCreditCard, FaShieldAlt } from "react-icons/fa";

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

      <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          What is OpenRouter?
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          OpenRouter is a unified API platform that gives you access to 300+ AI models from providers like Anthropic, Google, Meta, OpenAI, and many others — all through a single API key.
        </p>
        <p className="text-sm text-gray-700 mb-4">
          Instead of managing multiple accounts and API keys for different AI providers, OpenRouter lets you connect to many of them using one key. They handle the billing, rate limiting, and provider integration for you.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="flex items-start gap-2">
            <FaServer className="text-blue-600 mt-1" />
            <div>
              <p className="text-xs font-semibold text-gray-900">300+ Models</p>
              <p className="text-xs text-gray-600">Access top AI models from one place</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FaCreditCard className="text-blue-600 mt-1" />
            <div>
              <p className="text-xs font-semibold text-gray-900">Pay as you go</p>
              <p className="text-xs text-gray-600">Only pay for what you use</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FaShieldAlt className="text-blue-600 mt-1" />
            <div>
              <p className="text-xs font-semibold text-gray-900">Secure</p>
              <p className="text-xs text-gray-600">Your key stays with you</p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        How to get your API key
      </h3>

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
