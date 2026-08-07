import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard/Dashboard";

import Products from "./pages/Products/Products";
import ProductCreate from "./pages/Products/ProductCreate";
import ProductEdit from "./pages/Products/ProductEdit";

import Orders from "./pages/Orders/Orders";
import OrderDetail from "./pages/Orders/OrderDetail";

import Contacts from "./pages/Contacts/Contacts";
import ContactDetail from "./pages/Contacts/ContactDetail";

import Users from "./pages/Users/Users";
import UserCreate from "./pages/Users/UserCreate";
import UserEdit from "./pages/Users/UserEdit";

import Login from "./pages/Login/Login";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="products" element={<Products />} />
        <Route path="products/create" element={<ProductCreate />} />
        <Route path="products/edit/:id" element={<ProductEdit />} />
        {/* Đã bỏ route products/delete/:id — thao tác Ẩn/Hiện giờ làm trực tiếp
            ngay trên danh sách (giống Users), không cần trang xác nhận riêng */}

        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />

        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/:id" element={<ContactDetail />} />

        <Route
          path="users"
          element={
            <ProtectedRoute adminOnly>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/create"
          element={
            <ProtectedRoute adminOnly>
              <UserCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/edit/:id"
          element={
            <ProtectedRoute adminOnly>
              <UserEdit />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default App;
