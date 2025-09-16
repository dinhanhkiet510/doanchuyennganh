import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { FaGoogle, FaFacebookF } from "react-icons/fa";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Xử lý OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userStr = params.get("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(decodeURIComponent(userStr));
        login(userObj); // Lưu user vào context
        navigate("/"); // Redirect về homepage
      } catch (err) {
        console.error("Invalid OAuth user data:", err);
      }
    }
  }, [location, login, navigate]);


  //local login
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Login button clicked");

    // Log API URL
    console.log("API URL:", process.env.REACT_APP_API_URL);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/login`,  {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // gửi cookie session
      });
      console.log("Response:", res);
      const data = await res.json().catch(e => console.error("JSON parse error", e));
      console.log("Data:", data);
      if (res.ok) {
        login(data.user); // lưu user vào context

        // Redirect theo role
        if (data.role === "admin") {
          navigate("/admin/products"); // admin thì vào trang admin
        } else {
          navigate("/"); // customer thì về trang chủ
        }
      } else {
        setError(data.message || "Login failed!");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection error!");
    }
  };

  // OAuth login
  const handleOAuthLogin = (provider) => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/${provider}`;
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: "linear-gradient(to right, #43cea2, #185a9d)" }}>
      <div className="card shadow-lg p-4" style={{ width: "400px", borderRadius: "15px" }}>
        <h3 className="text-center mb-4" style={{ fontWeight: "bold", color: "#185a9d" }}>Login</h3>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn w-100 text-white mb-3" style={{ borderRadius: "8px", background: "linear-gradient(to right, #43cea2, #185a9d)", border: "none" }}>
            Login
          </button>
        </form>

        <div className="d-flex justify-content-center mb-3">
          <button onClick={() => handleOAuthLogin("google")} className="btn btn-light d-flex align-items-center me-2" style={{ borderRadius: "8px", width: "48%" }}>
            <FaGoogle style={{ marginRight: "8px", color: "#DB4437" }} /> Google
          </button>
          <button onClick={() => handleOAuthLogin("facebook")} className="btn btn-light d-flex align-items-center" style={{ borderRadius: "8px", width: "48%" }}>
            <FaFacebookF style={{ marginRight: "8px", color: "#4267B2" }} /> Facebook
          </button>
        </div>

        <div className="mt-3 text-center">
          <span>Don't have an account? </span>
          <Link to="/register" style={{ color: "#185a9d", fontWeight: "bold" }}>Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
