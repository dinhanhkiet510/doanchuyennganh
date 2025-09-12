// OAuthSuccess.js
import { useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

function OAuthSuccess() {
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      login({ token });
      navigate("/"); // redirect về home
    }
  }, [location, login, navigate]);

  return <h2>Login successful! Redirecting...</h2>;
}

export default OAuthSuccess;
