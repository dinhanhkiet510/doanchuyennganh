import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../pages/CartContext";
import { AuthContext } from "../AuthContext";
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const { totalQuantity } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      return;
    }
    fetch(`http://localhost:5000/api/products/search?q=${encodeURIComponent(searchTerm)}`)
      .then((res) => res.json())
      .then((data) => setSuggestions(data))
      .catch((err) => console.error(err));
  }, [searchTerm]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="header">
      <div className="logo">SPEAKER</div>

      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>

      <ul className={`nav ${menuOpen ? "show" : ""}`}>
        <li><Link to="/">HOME</Link></li>
        <li className="dropdown">
          <Link to="#">PRODUCT <i className="fas fa-angle-down"></i></Link>
          <ul className="dropdown-menu">
            <li><Link to="/products/category/2">SPEAKER</Link></li>
            <li><Link to="/products/category/3">HEADPHONE</Link></li>
            <li><Link to="/products/category/1">AMPS</Link></li>
          </ul>
        </li>
        <li><Link to="/about">ABOUT US</Link></li>
        <li><Link to="/contact">CONTACT</Link></li>

        {/* LOGIN / USER */}
        {!user ? (
          <li className="auth">
            <Link to="/login">
              <i className="fas fa-user"></i> LOGIN
            </Link>
          </li>
        ) : (
          <li className="auth user-logout">
            <span className="user-name"><i className="fas fa-user"></i> {user.name}</span>
            <button onClick={handleLogout} className="btn-logout">Log out</button>
          </li>
        )}

        {/* Search */}
        <li className="search-wrapper">
          <i
            className={`fas ${searchOpen ? "fa-times" : "fa-search"} search-icon`}
            onClick={() => setSearchOpen(!searchOpen)}
          ></i>
          {searchOpen && (
            <div className="search-container">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {suggestions.length > 0 && (
                <ul className="search-suggestions">
                  {suggestions.map((s) => {
                    const imgSrc = s.img?.startsWith("http")
                      ? s.img
                      : `${window.location.origin}/${s.img}`;
                    return (
                      <li key={s.id}>
                        <Link
                          to={`/products/${s.id}`}
                          onClick={() => {
                            setSearchTerm("");
                            setSuggestions([]);
                            setSearchOpen(false);
                          }}
                        >
                          <img src={imgSrc} alt={s.name} className="suggestion-img" />
                          <span>{s.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </li>

        {/* Cart */}
        <li className="cart">
          <Link to="/cart">
            <i className="fas fa-shopping-cart"></i>
            {totalQuantity > 0 && <span className="cart-count">{totalQuantity}</span>}
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Header;
