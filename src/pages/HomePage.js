import React from "react";
import { Link } from "react-router-dom";
import "../css/Home.css";

function HomePage() {
  return (
   <><div className="homepage-banner d-flex align-items-center justify-content-center mb-5">
      <img
        src="/assets/img/Header_desktop.png"
        alt="banner"
        className="img-fluid w-100 homepage-image" />
    </div>
    <div className="container-fluid ">
        <div className="row h-100">
          <div className="col-12 col-md-6 d-flex align-items-center justify-content-center p-0">
            <img
              src="/assets/img/Untitled.jpg"
              alt=""
              className="img-fluid w-100 h-100 object-fit-cover" />
          </div>
          <div className="col-12 col-md-6 d-flex align-items-center justify-content-center bg-black text-white mb-0 mt-3">
            <div className="text-center px-4">
              <h1 className="mb-4" >Music comes alive at night with Midnight Blue</h1>
              <p className="text-midnight-marshall">Discover our range of Midnight Blue headphones and speakers, capturing the power of music after dark in a new colour.</p>
              <Link to="" className="shop-midnight-marshall">Shop</Link>
            </div>
          </div>
        </div>
    </div>
    <div className="container-fluid mt-5">
      <div className="container-img-center-kilburn">
        <img
          src="/assets/img/Homepage2.png"
          alt="Center Image"
          className="centered-image"
        />
      </div>
      <div className="container-text-kilburn text-center mt-5 mb-5">
        <h1 className="mb-4 text-white" >Give it up for Kilburn III</h1>
        <p className="text-midnight-marshall">Legendary sound, inside & out. Our latest portable speaker will keep you going all weekend.</p>
        <Link to="/category/killburn" className="shop-midnight-marshall">Shop</Link>
      </div>
    </div>
    <div className="container-fluid bg-dark py-5 container-itemhomepage">
      <div className="row text-white text-center">
        
        {/* Cột 1 */}
        <div className="col-12 col-md-4 mb-4">
          <Link to="/products/category/1" className="text-white products-homepage">
          <h2 className="fw-bold">AMPS</h2>
          <img src="/assets/img/amps_carousel.png" className="img-fluid" alt="Amps" />
          </Link>
        </div>

        {/* Cột 2 */}
        <div className="col-12 col-md-4 mb-4">
          <Link to="/products/category/2" className="text-white products-homepage">
          <h2 className="fw-bold">SPEAKERS</h2>
          <img src="/assets/img/speakers_carousel.png" className="img-fluid" alt="Speakers" />
          </Link>
        </div>

        {/* Cột 3 */}
        <div className="col-12 col-md-4 mb-4">
          <Link to="/products/category/3" className="text-white products-homepage">
          <h2 className="fw-bold">HEADPHONES</h2>
          <img src="/assets/img/headphones_carousel.png" className="img-fluid" alt="Headphones" />
          </Link>
        </div>
      </div>
    </div>
    <div className="marquee-container text-white py-2">
      <div className="marquee-text">
        MUSIC IS LIFE — EXPLORE THE LATEST HEADPHONES NOW!
      </div>
    </div>
    <div className="container-fluid mt-5">
      <div className="container-img-center-kilburn">
        <img
          src="/assets/img/ABOUTUS.png"
          alt=""
          className="centered-image"
        />
      </div>
      <div className="container-text-kilburn text-center mt-5 mb-5">
        <h1 className="mb-4 text-white">Made in the UK</h1>
        <p className="text-midnight-marshall">When Marshall first started shaping the sound of rock ’n’ roll in the ‘60s, our amps were proudly built in Bletchley. Decades later, some of our most iconic amps are still crafted in the same factory.</p>
        <Link to="" className="shop-midnight-marshall">Learn more about our UK made amps</Link>
      </div>
    </div>
    </>
  );
}

export default HomePage;
