import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const SSOCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState("processing");
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Prevent multiple executions
    if (processed) {
      return;
    }

    const token = searchParams.get("token");
    const userParam = searchParams.get("user");
    const error = searchParams.get("error");

    // Mark as processed immediately to prevent re-execution
    setProcessed(true);

    if (error) {
      // Handle error from SSO
      const errorMessage = decodeURIComponent(error);
      setStatus("error");
      toast.error(errorMessage);
      setTimeout(() => {
        navigate("/login?error=" + encodeURIComponent(errorMessage), { replace: true });
      }, 2000);
      return;
    }

    if (token && userParam) {
      try {
        // Parse user data - userParam is URL encoded JSON
        let user;
        try {
          // Decode URI component first, then parse JSON
          const decodedUserParam = decodeURIComponent(userParam);
          user = JSON.parse(decodedUserParam);
        } catch (parseError) {
          // If decoding fails, try parsing directly (might already be decoded)
          user = JSON.parse(userParam);
        }

        // Validate user data
        if (!user || !user.id || !user.email) {
          throw new Error("Invalid user data received from SSO");
        }

        // Store token and user
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Update auth context
        login(token);

        setStatus("success");
        toast.success("Successfully signed in with SSO!");

        // Redirect to home page
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
      } catch (err) {
        console.error("Error processing SSO callback:", err);
        setStatus("error");
        const errorMessage = err.message || "Failed to process SSO authentication";
        toast.error(errorMessage);
        setTimeout(() => {
          navigate("/login?error=" + encodeURIComponent(errorMessage), { replace: true });
        }, 2000);
      }
    } else {
      // Missing token or user data
      setStatus("error");
      toast.error("Invalid SSO callback. Missing authentication data.");
      setTimeout(() => {
        navigate("/login?error=Invalid SSO callback", { replace: true });
      }, 2000);
    }
  }, [searchParams, navigate, login, processed]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === "processing" && (
          <>
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Completing sign in...
            </h2>
            <p className="text-gray-600">Please wait while we finish signing you in.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sign in successful!
            </h2>
            <p className="text-gray-600">Redirecting you to the home page...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sign in failed
            </h2>
            <p className="text-gray-600">Redirecting you back to the login page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SSOCallback;

