import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-black text-white py-5 w-100">
      <div className="container-fluid px-5">
        <div className="row text-center text-md-start">

          {/* Cột 1: Logo + mô tả */}
          <div className="col-12 col-md-4 mb-4">
            <h4 className="fw-bold">SPEAKER</h4>
            <p>
              Experience legendary sound with our range of AMPS, SPEAKERS, and HEADPHONES.
            </p>
          </div>

          {/* Cột 2: Danh mục sản phẩm */}
          <div className="col-12 col-md-4 mb-4">
            <h5 className="fw-bold">PRODUCTS</h5>
            <ul className="list-unstyled">
              <li><Link to="/products/category/1" className="footer-link">AMPS</Link></li>
              <li><Link to="/products/category/2" className="footer-link">SPEAKERS</Link></li>
              <li><Link to="/products/category/3" className="footer-link">HEADPHONES</Link></li>
            </ul>
          </div>

          {/* Cột 3: Các trang khác */}
          <div className="col-12 col-md-4 mb-4">
            <h5 className="fw-bold">INFO</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="footer-link">HOME</Link></li>
              <li><Link to="/about" className="footer-link">ABOUT US</Link></li>
              <li><Link to="/contact" className="footer-link">CONTACT</Link></li>
              <li><Link to="/login" className="footer-link">LOGIN</Link></li>
            </ul>
          </div>

        </div>

        {/* Đường kẻ và bản quyền */}
        <hr className="border-secondary" />
        <div className="text-center small mt-3">
          © {new Date().getFullYear()} SPEAKER. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
