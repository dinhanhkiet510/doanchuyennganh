import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AboutMarshall() {
  return (
    <div className="container-fluid p-0">

      {/* Hero Section */}
      <section
        className="text-center text-white p-5 position-relative"
        style={{ backgroundColor: "black", overflow: "hidden" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="container py-5"
        >
          <h1 className="display-4 fw-bold mt-5">We are Marshall</h1>
          <p className="lead">
            Musicians using Marshall amps. For over six decades, Marshall’s legacy
            has grown chord to chord, person to person, generation to generation.
          </p>
        </motion.div>
      </section>

      {/* About Section */}
      <section
        className="container-fluid py-5 text-white position-relative"
        style={{ backgroundColor: "black", overflow: "hidden" }}
      >
        <div className="container">
          <motion.p
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            It all began in 1962 in Hanwell, London, when Jim and Terry Marshall
            built their first-ever amp, laying the foundation for a sound that
            would define rock ’n’ roll. As demand grew, we moved to Bletchley in
            the late ’60s, where our factory remains to this day. We’ve never
            stopped amplifying music for artists and fans, continually honing our
            craft to uphold our reputation for legendary sound and iconic design.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            Our most iconic amps are still proudly built in Bletchley, UK. Today,
            the Marshall name stands for more than just legendary amps. It powers
            musicians and music lovers with professional equipment, consumer
            electronics, a record label, and a state-of-the-art recording studio,
            delivering exceptional audio experiences worldwide. We are the home of
            loud.
          </motion.p>
        </div>
      </section>

      {/* AMPS */}
      <section className="row align-items-center bg-light p-5">
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <img
            src="/assets/img/amps_about.png"
            alt="Marshall Amps"
            className="img-fluid rounded"
          />
        </motion.div>
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2>AMPS</h2>
          <p>
            With our legendary amps, you always take centre stage. They boost
            input and enhance sound quality, without fail. We offer various
            types and configurations to meet every playing need, from home
            practice to large venue performances.
          </p>
          <Link to="/products/category/1" className="btn btn-dark mt-2">
            Find your sound
          </Link>
        </motion.div>
      </section>

      {/* SPEAKERS */}
      <section className="row align-items-center p-5">
        <motion.div
          className="col-md-6 order-md-2"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <img
            src="/assets/img/speakers-all_plp-desktop.png"
            alt="Marshall Speakers"
            className="img-fluid rounded"
          />
        </motion.div>
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2 style={{ color: "white" }}>SPEAKERS</h2>
          <p style={{ color: "white" }}>
            Experience Marshall's signature sound anywhere and everywhere, with
            seamless wireless connectivity for hours of listening. Iconic in
            sound and design, the perfect speaker awaits.
          </p>
          <Link to="/products/category/2" className="btn btn-dark mt-2">
            Explore speakers
          </Link>
        </motion.div>
      </section>

      {/* HEADPHONES */}
      <section className="row align-items-center bg-light p-5">
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <img
            src="/assets/img/headphones_about.png"
            alt="Marshall Headphones"
            className="img-fluid rounded"
          />
        </motion.div>
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2>HEADPHONES</h2>
          <p>
            Get lost in sound and enjoy the freedom of listening on the move.
            Find your perfect pair of headphones by choosing between wireless
            convenience, wired reliability, or active noise cancellation. Your
            music, your way.
          </p>
          <Link to="/products/category/3" className="btn btn-dark mt-2">
            Explore headphones
          </Link>
        </motion.div>
      </section>

      {/* DRUMS */}
      <section className="row align-items-center p-5">
        <motion.div
          className="col-md-6 order-md-2"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <img
            src="/assets/img/drums_about.png"
            alt="Natal Drums"
            className="img-fluid rounded"
          />
        </motion.div>
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2 style={{ color: "white" }}>DRUMS</h2>
          <p style={{ color: "white" }}>
            Natal Drums, a British brand renowned for quality craftsmanship,
            makes professional-grade drum kits that blend innovation and
            tradition to offer a distinctive sound.
          </p>
          <Link to="/drums" className="btn btn-dark mt-2">
            Discover drums
          </Link>
        </motion.div>
      </section>

      {/* MERCH */}
      <section className="row align-items-center bg-light p-5">
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <img
            src="/assets/img/merch_about.png"
            alt="Marshall Merch"
            className="img-fluid rounded"
          />
        </motion.div>
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2>MERCH</h2>
          <p>
            Expand your music collection with the latest CD and vinyl releases
            from Marshall Records artists. Or showcase your love for Marshall
            and add a touch of rock 'n' roll flair to your life with our
            selection of accessories.
          </p>
          <Link to="/merch" className="btn btn-dark mt-2">
            Shop merch
          </Link>
        </motion.div>
      </section>

      {/* ARTIST SERVICES */}
      <section className="row align-items-center p-5">
        <motion.div
          className="col-md-6 order-md-2"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <img
            src="/assets/img/artist-services_desktop.png"
            alt="Marshall Artist Services"
            className="img-fluid rounded"
          />
        </motion.div>
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2 style={{ color: "white" }}>ARTIST SERVICES</h2>
          <p style={{ color: "white" }}>
            Driven by our commitment to supporting grassroots music, we launched
            Marshall Records. Our mission is to discover, nurture, develop, and
            deliver new music directly to you, empowering musicians to reach
            their full creative potential. To support this vision, we built the
            Marshall Studio, a cutting-edge recording space for musicians of all
            abilities.
          </p>
          <Link to="/artist-services" className="btn btn-dark mt-2">
            Discover how we support artists
          </Link>
        </motion.div>
      </section>

      {/* BACKSTAGE */}
      <section className="row align-items-center bg-light p-5">
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <img
            src="/assets/img/backstage.png"
            alt="Marshall Backstage"
            className="img-fluid rounded"
          />
        </motion.div>
        <motion.div
          className="col-md-6"
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2>BACKSTAGE</h2>
          <p>
            Behind the music, there’s a whole lot going on in the world of
            Marshall. Dive into the latest stories about our rich heritage,
            musicians and the vibrant communities that shape who we are.
          </p>
          <Link to="/backstage" className="btn btn-dark mt-2">
            Explore heritage, interviews & community
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
