import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../pages/AuthContext";
import axios from "axios";
import "./ProfilePage.css";

function ProfilePage() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  const isOAuth = user?.provider && user.provider !== "local";

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        const profileRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/customers/me`, { withCredentials: true });
        setProfile(profileRes.data);
        setFormData(profileRes.data);
        const ordersRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders/my-orders/${user.id}`, { withCredentials: true });
        setOrders(ordersRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return <p className="text-center mt-5">Please login to view your profile</p>;
  if (!profile) return <p className="text-center mt-5">Loading...</p>;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveInfo = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/customers/me`, formData, { withCredentials: true });
      setProfile({ ...profile, ...formData });
      setEditMode(false);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage("Error updating profile");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("New password does not match!");
      return;
    }
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/customers/change-password`, passwordData, { withCredentials: true });
      setMessage("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage("Error changing password");
    }
  };
  return (
    <div className="container py-5 profile-container">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-lg profile-card animate-fade-in">
            <div className="card-body p-4">
              <h2 className="mb-4 text-center title">Profile Information</h2>

              {profile.avatar && (
                <div className="text-center mb-4">
                  <img
                    src=""
                    alt="avatar"
                    className="rounded-circle profile-avatar"
                  />
                </div>
              )}

              {/* Tabs */}
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "info" ? "active" : ""}`}
                    onClick={() => setActiveTab("info")}
                  >
                    YOUR PROFILE
                  </button>
                </li>
                {!isOAuth && (
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "password" ? "active" : ""}`}
                      onClick={() => setActiveTab("password")}
                    >
                      CHANGE PASSWORD
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "orders" ? "active" : ""}`}
                    onClick={() => setActiveTab("orders")}
                  >
                    ORDERS
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              {activeTab === "info" && (
                <>
                  {editMode ? (
                    <>
                      <div className="mb-3">
                        <label>Full Name:</label>
                        <input type="text" name="name" value={formData.name || ""} onChange={handleChange} className="form-control"/>
                      </div>
                      <div className="mb-3">
                        <label>Email:</label>
                        <input type="email" name="email" value={formData.email || ""} onChange={handleChange} className="form-control"/>
                      </div>
                      <div className="mb-3">
                        <label>Phone:</label>
                        <input type="text" name="phone" value={formData.phone || ""} onChange={handleChange} className="form-control"/>
                      </div>
                      <div className="mb-3">
                        <label>Address:</label>
                        <input type="text" name="address" value={formData.address || ""} onChange={handleChange} className="form-control"/>
                      </div>
                      <div className="mb-3">
                        <label>Username:</label>
                        <input type="text" name="username" value={formData.username || ""} onChange={handleChange} className="form-control"/>
                      </div>
                      <div className="text-center mt-4">
                        <button className="btn btn-outline-dark me-2 custom-btn" onClick={handleSaveInfo}>Save</button>
                        <button className="btn btn-outline-dark custom-btn" onClick={() => setEditMode(false)}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-3"><strong>Full Name:</strong> {profile.name}</div>
                      <div className="mb-3"><strong>Email:</strong> {profile.email}</div>
                      <div className="mb-3"><strong>Phone:</strong> {profile.phone}</div>
                      <div className="mb-3"><strong>Address:</strong> {profile.address}</div>
                      <div className="mb-3"><strong>Username:</strong> {profile.username}</div>
                      <div className="text-center mt-4">
                        <button className="btn btn-outline-dark custom-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === "password" && !isOAuth && (
                <>
                  <div className="mb-3">
                    <label>Current Password:</label>
                    <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={(e)=>setPasswordData({...passwordData, currentPassword: e.target.value})} className="form-control"/>
                  </div>
                  <div className="mb-3">
                    <label>New Password:</label>
                    <input type="password" name="newPassword" value={passwordData.newPassword} onChange={(e)=>setPasswordData({...passwordData, newPassword: e.target.value})} className="form-control"/>
                  </div>
                  <div className="mb-3">
                    <label>Confirm New Password:</label>
                    <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={(e)=>setPasswordData({...passwordData, confirmPassword: e.target.value})} className="form-control"/>
                  </div>
                  <div className="text-center">
                    <button className="btn btn-outline-dark custom-btn" onClick={handlePasswordChange}>Change Password</button>
                  </div>
                </>
              )}

              {activeTab === "orders" && (
                <>
                  {orders.length === 0 ? (
                    <p className="text-center">You have no orders yet.</p>
                  ) : (
                    <div className="table-responsive">
                      {orders.map(order => {
                        const totalAmount = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                        return (
                          <div key={order.id} className="mb-4">
                            <h5>
                              Order #{order.id} - {new Date(order.order_date).toLocaleDateString()} - {order.status}
                            </h5>
                            <table className="table table-bordered text-center">
                              <thead>
                                <tr>
                                  <th>Image</th>
                                  <th>Product Name</th>
                                  <th>Quantity</th>
                                  <th>Price</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map(item => (
                                  <tr key={item.product_id}>
                                    <td className="text-center align-middle">
                                      {item.img ? (
                                        <img
                                          src={`${item.img}`}
                                          alt={item.name}
                                          style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                        />
                                      ) : (
                                        "-"
                                      )}
                                    </td>
                                    <td>{item.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>${item.price.toLocaleString()}</td>
                                    <td>${(item.price * item.quantity).toLocaleString()}</td>
                                  </tr>
                                ))}
                                <tr>
                                  <td colSpan="4" className="text-end"><strong>Total Amount:</strong></td>
                                  <td><strong>${totalAmount.toLocaleString()}</strong></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {message && <p className="text-center mt-3 text-success">{message}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
