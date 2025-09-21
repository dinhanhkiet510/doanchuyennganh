import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaGoogle, FaFacebookF } from "react-icons/fa";

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
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/register`,
        form,
        { withCredentials: true }
      );

      setSuccessMessage(
        res.data.message || "Registration successful! Redirecting to login..."
      );

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      let message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Registration failed!";
      if (typeof message === "object") {
        message = JSON.stringify(message);
      }
      setErrorMessage(message);
    }
  };

  const handleOAuthRegister = (provider) => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/${provider}`;
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ background: "linear-gradient(to right, #ff512f, #dd2476)" }}
    >
      <div
        className="card shadow-lg p-4"
        style={{ width: "500px", borderRadius: "15px" }}
      >
        <h3
          className="text-center mb-4"
          style={{ fontWeight: "bold", color: "#dd2476" }}
        >
          Register
        </h3>

        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="alert alert-danger">{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-2"
            placeholder="Full Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="form-control mb-2"
            type="email"
            placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="form-control mb-2"
            placeholder="Phone Number"
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <input
            className="form-control mb-2"
            placeholder="Address"
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
          <input
            className="form-control mb-2"
            placeholder="Username"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            className="form-control mb-3"
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <button
            type="submit"
            className="btn w-100 text-white mb-3"
            style={{
              background: "linear-gradient(to right, #ff512f, #dd2476)",
              border: "none",
              borderRadius: "8px"
            }}
          >
            Register
          </button>
        </form>

        {/* OAuth buttons */}
        <div className="d-flex justify-content-center mb-3">
          <button
            onClick={() => handleOAuthRegister("google")}
            className="btn btn-light d-flex align-items-center me-2"
            style={{ borderRadius: "8px", width: "48%" }}
          >
            <FaGoogle style={{ marginRight: "8px", color: "#DB4437" }} /> Google
          </button>
          <button
            onClick={() => handleOAuthRegister("facebook")}
            className="btn btn-light d-flex align-items-center"
            style={{ borderRadius: "8px", width: "48%" }}
          >
            <FaFacebookF style={{ marginRight: "8px", color: "#4267B2" }} />{" "}
            Facebook
          </button>
        </div>

        {/* Back to login */}
        <div className="mt-3 text-center">
          <span>Already have an account? </span>
          <button
            onClick={() => navigate("/login")}
            className="btn btn-link p-0"
            style={{ color: "#dd2476", fontWeight: "bold" }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
