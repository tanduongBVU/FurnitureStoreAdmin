import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard/Dashboard";

import Products from "./pages/Products/Products";
import ProductCreate from "./pages/Products/ProductCreate";
import ProductEdit from "./pages/Products/ProductEdit";

import Services from "./pages/Services/Services";
import Projects from "./pages/Projects/Projects";

import BlogPosts from "./pages/BlogPosts/BlogPosts";
import BlogPostCreate from "./pages/BlogPosts/BlogPostCreate";
import BlogPostEdit from "./pages/BlogPosts/BlogPostEdit";

import ReviewsAdmin from "./pages/Reviews/ReviewsAdmin";

import Orders from "./pages/Orders/Orders";
import OrderDetail from "./pages/Orders/OrderDetail";

import Contacts from "./pages/Contacts/Contacts";
import ContactDetail from "./pages/Contacts/ContactDetail";

import Newsletter from "./pages/Newsletter/Newsletter";
import Coupons from "./pages/Coupons/Coupons";

import Users from "./pages/Users/Users";
import UserCreate from "./pages/Users/UserCreate";
import UserEdit from "./pages/Users/UserEdit";

import SiteSettings from "./pages/SiteSettings/SiteSettings";

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

        <Route path="services" element={<Services />} />
        <Route path="projects" element={<Projects />} />

        <Route path="blogposts" element={<BlogPosts />} />
        <Route path="blogposts/create" element={<BlogPostCreate />} />
        <Route path="blogposts/edit/:id" element={<BlogPostEdit />} />

        <Route path="reviews" element={<ReviewsAdmin />} />

        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />

        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/:id" element={<ContactDetail />} />

        <Route path="newsletter" element={<Newsletter />} />
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

        <Route
          path="settings"
          element={
            <ProtectedRoute adminOnly>
              <SiteSettings />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default App;