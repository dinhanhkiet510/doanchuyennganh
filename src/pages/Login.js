import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../AuthContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Lưu ID vào localStorage
        localStorage.setItem("customerId", data.user.id);

        login(data.user);
        if (data.user.username === "admin") {
          navigate("/admin/products");
        } else {
          navigate("/");
        }
      }
    } catch {
      setError("Server connection error!");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "linear-gradient(to right, #43cea2, #185a9d)",
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{ width: "400px", borderRadius: "15px" }}
      >
        <h3
          className="text-center mb-4"
          style={{ fontWeight: "bold", color: "#185a9d" }}
        >
          Login
        </h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn w-100 text-white"
            style={{
              borderRadius: "8px",
              background: "linear-gradient(to right, #43cea2, #185a9d)",
              border: "none",
            }}
          >
            Login
          </button>
        </form>
        <div className="mt-3 text-center">
          <span>Don't have an account? </span>
          <Link to="/register" style={{ color: "#185a9d", fontWeight: "bold" }}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
