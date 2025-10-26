import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

/**
 * Wrap protected UI:
 * <ProtectedRoute><SomePage/></ProtectedRoute>
 *
 * Behavior:
 * - if user exists -> render children
 * - if token exists but user is not loaded yet -> return null (lets AuthContext finish validation)
 * - otherwise redirect to /login and preserve original location in state
 */
export default function ProtectedRoute({ children }) {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();

  // auth still validating: token present but no user yet -> avoid immediate redirect
  if (token && user === null) return null;

  // not authenticated -> redirect to login and keep intended route in state
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}