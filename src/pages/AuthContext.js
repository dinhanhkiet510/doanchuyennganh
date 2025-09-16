import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Khi app load, fetch user từ server (session)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/current_user`, {
          credentials: "include",
        });
        const data = await res.json();
        // Nếu server trả user object, set user
        setUser(data.user || null);
      } catch (err) {
        console.error(err);
        setUser(null);
      }
    };
    fetchUser();
  }, []);


  // Login dùng cho local login/register
  const login = (userData) => {
    if (userData?.id) {
      setUser(userData); // userData phải có id, name, email
    }
  };

  // Logout
  const logout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
