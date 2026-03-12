import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const isImageToLatexRoute = location.pathname === "/image-to-latex";
    const loginTarget = isImageToLatexRoute
      ? "/login?warning=" +
        encodeURIComponent(
          "You need to sign in before using Image to LaTeX."
        )
      : "/login";

    return <Navigate to={loginTarget} replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
