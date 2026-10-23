import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard/Dashboard";

import Products from "./pages/Products/Products";

import Bundles from "./pages/Bundles/Bundles";

import Services from "./pages/Services/Services";

import BlogPosts from "./pages/BlogPosts/BlogPosts";

import ReviewsAdmin from "./pages/Reviews/ReviewsAdmin";

import Orders from "./pages/Orders/Orders";
import OrderDetail from "./pages/Orders/OrderDetail";

import Contacts from "./pages/Contacts/Contacts";
import ContactDetail from "./pages/Contacts/ContactDetail";

import Coupons from "./pages/Coupons/Coupons";

import Users from "./pages/Users/Users";
import UserCreate from "./pages/Users/UserCreate";
import UserEdit from "./pages/Users/UserEdit";

import SiteSettings from "./pages/SiteSettings/SiteSettings";
import Profile from "./pages/Profile/Profile";

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
        <Route path="profile" element={<Profile />} />

        {/* Thêm/Sửa sản phẩm, combo, bài viết giờ là popup ngay trên trang danh sách — các đường dẫn cũ
            (còn trong lịch sử/bookmark) tự chuyển về danh sách thay vì báo lỗi. */}
        <Route path="products" element={<Products />} />
        <Route path="products/create" element={<Navigate to="/products" replace />} />
        <Route path="products/edit/:id" element={<Navigate to="/products" replace />} />

        <Route path="bundles" element={<Bundles />} />
        <Route path="bundles/create" element={<Navigate to="/bundles" replace />} />
        <Route path="bundles/edit/:id" element={<Navigate to="/bundles" replace />} />

        <Route path="services" element={<Services />} />

        <Route path="blogposts" element={<BlogPosts />} />
        <Route path="blogposts/create" element={<Navigate to="/blogposts" replace />} />
        <Route path="blogposts/edit/:id" element={<Navigate to="/blogposts" replace />} />

        <Route path="reviews" element={<ReviewsAdmin />} />

        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />

        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/:id" element={<ContactDetail />} />


        <Route path="coupons" element={<Coupons />} />

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

        <Route path="settings" element={<SiteSettings />} />
      </Route>
    </Routes>
  );
};

export default App;