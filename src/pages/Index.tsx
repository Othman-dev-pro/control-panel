import { Navigate } from "react-router-dom";

export default function Index() {
  // Redirection automatically for the Admin Control Panel since the app is Web-Admin only
  return <Navigate to="/admin/login" replace />;
}
