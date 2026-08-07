import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem("adminToken");
  const userStr = localStorage.getItem("adminUser");
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Chỉ cho phép Admin / Nhân viên vào trang quản trị
  if (user.role === "Khách hàng") {
    return <Navigate to="/login" replace />;
  }

  // Một số trang (VD: Quản lý người dùng) chỉ dành riêng cho Admin
  if (adminOnly && user.role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
