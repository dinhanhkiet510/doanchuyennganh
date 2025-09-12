import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthContext } from "../AuthContext";

const AdminPage = ({ children }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutToHome = () => {
    logout();
    localStorage.removeItem("customerId");
    navigate("/");
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <h5 className="text-center mb-4">Admin Dashboard</h5>

        <Link
          className={`admin-link ${
            location.pathname === "/admin/orders" ? "active" : ""
          }`}
          to="/admin/orders"
        >
          Order Management
        </Link>

        <Link
          className={`admin-link ${
            location.pathname === "/admin/customers" ? "active" : ""
          }`}
          to="/admin/customers"
        >
          Customer Management
        </Link>

        <Link
          className={`admin-link ${
            location.pathname === "/admin/products" ? "active" : ""
          }`}
          to="/admin/products"
        >
          Management Products
        </Link>

        <Link
          className={`admin-link ${
            location.pathname === "/statistics" ? "active" : ""
          }`}
          to="/admin/statistics"
        >
          Sales Statistics
        </Link>

        {/* Chat với khách hàng */}
        <Link
          className={`admin-link ${
            location.pathname === "/admin/chat" ? "active" : ""
          }`}
          to="/admin/chat"
        >
          Chat with Customers
        </Link>

        {/* Nút logout */}
        <button
          onClick={handleLogoutToHome}
          className="btn btn-danger w-100 admin-logout-btn mt-3"
        >
          Back to homepage
        </button>
      </div>

      {/* Nội dung trang */}
      <div className="flex-grow-1 p-4" style={{ marginLeft: "240px" }}>
        {children}
      </div>
    </div>
  );
};

export default AdminPage;
