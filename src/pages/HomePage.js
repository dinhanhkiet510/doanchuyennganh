import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function HomePage() {
  return (
    <>
      {/* Banner đầu */}
      <motion.div
        className="homepage-banner d-flex align-items-center justify-content-center mb-5 "
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <img
          src="/assets/img/Header_desktop.png"
          alt="banner"
          className="img-fluid w-100 homepage-image"
        />
      </motion.div>

      {/* Phần 1 */}
      <div className="container-fluid">
        <div className="row h-100">
          <motion.div
            className="col-12 col-md-6 d-flex align-items-center justify-content-center p-0"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <img
              src="/assets/img/Untitled.jpg"
              alt=""
              className="img-fluid w-100 h-100 object-fit-cover"
            />
          </motion.div>

          <motion.div
            className="col-12 col-md-6 d-flex align-items-center justify-content-center bg-black text-white mb-0 mt-3"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center px-4">
              <h1 className="mb-4">
                Music comes alive at night with Midnight Blue
              </h1>
              <p className="text-midnight-marshall">
                Discover our range of Midnight Blue headphones and speakers,
                capturing the power of music after dark in a new colour.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Giữa trang */}
      <motion.div
        className="container-fluid mt-5"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container-img-center-kilburn">
          <img
            src="/assets/img/Homepage2.png"
            alt="Center Image"
            className="centered-image"
          />
        </div>
        <div className="container-text-kilburn text-center mt-5 mb-5">
          <h1 className="mb-4 text-white">Give it up for Kilburn III</h1>
          <p className="text-midnight-marshall">
            Legendary sound, inside & out. Our latest portable speaker will keep
            you going all weekend.
          </p>
        </div>
      </motion.div>

      {/* Sản phẩm */}
      <motion.div
        className="container-fluid py-5 container-itemhomepage"
        style={{ backgroundColor: "#111" }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="row text-white text-center">
          {[
            { id: 1, title: "AMPS", img: "/assets/img/amps_carousel.png" },
            { id: 2, title: "SPEAKERS", img: "/assets/img/speakers_carousel.png" },
            { id: 3, title: "HEADPHONES", img: "/assets/img/headphones_carousel.png" },
          ].map((item) => (
            <motion.div
              key={item.id}
              className="col-12 col-md-4 mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Link
                to={`/products/category/${item.id}`}
                className="text-white products-homepage"
              >
                <h2 className="fw-bold">{item.title}</h2>
                <img src={item.img} className="img-fluid" alt={item.title} />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Chạy chữ */}
      <div className="marquee-container text-white py-2" style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
        <motion.div
          className="marquee-text"
          style={{ display: "inline-block" }}
          animate={{ x: ["100%", "-100%"] }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        >
          MUSIC IS LIFE — EXPLORE THE LATEST HEADPHONES NOW! &nbsp; MUSIC IS LIFE — EXPLORE THE LATEST HEADPHONES NOW!
        </motion.div>
      </div>

      {/* About us */}
      <motion.div
        className="container-fluid mt-5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <div className="container-img-center-kilburn">
          <img src="/assets/img/ABOUTUS.png" alt="" className="centered-image" />
        </div>
        <div className="container-text-kilburn text-center mt-5 mb-5">
          <h1 className="mb-4 text-white">Made in the UK</h1>
          <p className="text-midnight-marshall">
            When Marshall first started shaping the sound of rock ’n’ roll in the
            ‘60s, our amps were proudly built in Bletchley. Decades later, some of
            our most iconic amps are still crafted in the same factory.
          </p>
          <Link to="/about" className="shop-midnight-marshall">
            Learn more about our UK made amps
          </Link>
        </div>

        {/* 2 hình cuối */}
        <div
          className="container-fluid"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: "50px",
            paddingTop: "60px",
            paddingBottom: "40px",
            backgroundColor: "#111",
          }}
        >
          {[
            {
              img: "/assets/img/img1.png",
              title: "BEGINNER GUIDES TO KICKSTART YOUR GUITAR JOURNEY",
              desc: "Whether you're choosing your first beginner guitar amp or learning the basics, our beginner's hub has everything you need to start your guitar journey and unlock your full potential.",
            },
            {
              img: "/assets/img/img2.png",
              title: "DREAM NAILS: A BOLD NEW PUNK FORCE",
              desc: "This London trio have quickly become a standout force in British punk, evolving from DIY beginnings to a heavier, boundary-pushing sound. Their music inspires hope and explores deeper emotions, with community at its core.",
            },
          ].map((block, idx) => (
            <motion.div
              key={idx}
              style={{ maxWidth: "600px", color: "#eee", fontSize: "14px" }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <img
                src={block.img}
                alt={block.title}
                style={{
                  width: "100%",
                  display: "block",
                  borderRadius: "8px",
                }}
              />
              <div style={{ marginTop: "10px" }}>
                <b>{block.title}</b>
                <p style={{ marginTop: "8px", lineHeight: "1.4" }}>{block.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
}

export default HomePage;
