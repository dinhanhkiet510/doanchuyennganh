import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    username: "",
    password: ""
  });
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:5000/register", form)
      .then(() => {
        setMessage("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      })
      .catch(err => {
        setMessage(err.response?.data?.error || "Registration failed!");
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: "linear-gradient(to right, #ff512f, #dd2476)" }}>
      <div className="card shadow-lg p-4" style={{ width: "500px", borderRadius: "15px" }}>
        <h3 className="text-center mb-4" style={{ fontWeight: "bold", color: "#dd2476" }}>Register</h3>
        {message && <div className="alert alert-info">{message}</div>}
        <form onSubmit={handleSubmit}>
          <input className="form-control mb-2" placeholder="Full Name" onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="form-control mb-2" type="email" placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="form-control mb-2" placeholder="Phone Number" onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input className="form-control mb-2" placeholder="Address" onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          <input className="form-control mb-2" placeholder="Username" onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <input className="form-control mb-3" type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button
            type="submit"
            className="btn w-100 text-white"
            style={{
                background: "linear-gradient(to right, #ff512f, #dd2476)",
                border: "none",
                borderRadius: "8px",
            }}
            >
                Register
            </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
