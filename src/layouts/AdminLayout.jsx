import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/Header";
import AdminChatWidget from "../components/AdminChatWidget/AdminChatWidget";
import { isAdmin } from "../utils/permissions";
import "./AdminLayout.css";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Header />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
      {/* Chat AI Admin có thể trả lời cả số liệu doanh thu → CHỈ Admin (giám đốc) mới có */}
      {isAdmin() && <AdminChatWidget />}
    </div>
  );
};

export default AdminLayout;