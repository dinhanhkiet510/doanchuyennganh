import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../pages/CartContext";
import { AuthContext } from "../pages/AuthContext";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const { totalQuantity } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch product suggestions
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/api/products/search?q=${encodeURIComponent(searchTerm)}`)
      .then((res) => res.json())
      .then((data) => setSuggestions(data))
      .catch((err) => console.error(err));
  }, [searchTerm]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  // Đóng menu khi click bất kỳ link nào
  const handleLinkClick = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
    setSearchOpen(false);
  };

  return (
    <div className="header">
      <div className="logo">SPEAKER</div>

      {/* Menu toggle mobile */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>

      <ul className={`nav ${menuOpen ? "show" : ""}`}>
        <li><Link to="/" onClick={handleLinkClick}>HOME</Link></li>

        {/* Dropdown */}
        <li
          className={`dropdown ${dropdownOpen ? "open" : ""}`}
          onMouseEnter={() => window.innerWidth > 768 && setDropdownOpen(true)}
          onMouseLeave={() => window.innerWidth > 768 && setDropdownOpen(false)}
        >
<<<<<<< HEAD
          <Link className="dropdown-toggle " onClick={() => setDropdownOpen(!dropdownOpen)}>
=======
          <Link className="dropdown-toggle" onClick={() => setDropdownOpen(!dropdownOpen)}>
>>>>>>> 7d0f3db4e517d1cc4867303315c5ecef8e4fdf52
            PRODUCT
          </Link>

          <ul className="dropdown-menu">
            <li><Link to="/products/category/2" onClick={handleLinkClick}>SPEAKER</Link></li>
            <li><Link to="/products/category/3" onClick={handleLinkClick}>HEADPHONE</Link></li>
            <li><Link to="/products/category/1" onClick={handleLinkClick}>AMPS</Link></li>
          </ul>
        </li>

        <li><Link to="/about" onClick={handleLinkClick}>ABOUT US</Link></li>
        <li><Link to="/contact" onClick={handleLinkClick}>CONTACT</Link></li>

        {!user ? (
          <li className="auth"><Link to="/login" onClick={handleLinkClick}><i className="fas fa-user"></i> LOGIN</Link></li>
        ) : (
          <li className="auth user-logout">
            <Link to="/profile" className="user-name" onClick={handleLinkClick}>
              <i className="fas fa-user"></i> {user.name}
            </Link>
            <button onClick={handleLogout} className="btn-logout">LOG OUT</button>
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
                    const imgSrc = s.img?.startsWith("http") ? s.img : `${window.location.origin}/${s.img}`;
                    return (
                      <li key={s.id}>
                        <Link
                          to={`/products/${s.id}`}
                          onClick={() => {
                            setSearchTerm("");
                            setSuggestions([]);
                            handleLinkClick();
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
          <Link to="/cart" onClick={handleLinkClick}>
            <i className="fas fa-shopping-cart"></i>
            {totalQuantity > 0 && <span className="cart-count">{totalQuantity}</span>}
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Header;
