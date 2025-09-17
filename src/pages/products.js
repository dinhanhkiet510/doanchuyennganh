import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { CartContext } from "./CartContext";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Products() {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const { addToCart } = useContext(CartContext);
  const [sortType, setSortType] = useState("");
  const [loading, setLoading] = useState(false);
  const [clickedId, setClickedId] = useState(null);
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/products/category/${categoryId}`,
          { params: { sort: sortType } }
        );
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setProducts(data);
      } catch (error) {
        console.error(error);
        setProducts([]); // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId, sortType]);


  const banners = {
    "1": {
      img: "/assets/img/amps-all_plp-desktop.png",
      text: "AMPS",
      title: "POWERING YOUR SOUND, ELEVATING YOUR PERFORMANCE.",
      desc: "Your amplifier is the heartbeat of your performance, boosting your input and enhancing sound quality and volume.",
    },
    "2": {
      img: "/assets/img/speakers-all_plp-desktop.png",
      text: "SPEAKERS",
      title: "ENJOY MARSHALL SOUND AT HOME OR ON THE ROAD",
      desc: "Experience Marshall signature sound in the comfort of your home or outdoors on the road.",
    },
    "3": {
      img: "/assets/img/headband_headphones_desktop-banner.png",
      text: "HEADPHONES",
      title: "EXPLORE THE DIVERSE WORLD OF MARSHALL HEADPHONES",
      desc: "Discover the perfect pair that suits your preferences. Your music, your way.",
    },
  };

  const { img, text, title, desc } = banners[categoryId] || {};

  const handleAddToCart = (product) => {
    setClickedId(product.id);
    addToCart(product);

    toast.success(
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <i className="fas"></i>
        <span>Product has been added to your cart!</span>
      </div>,
      {
        position: "top-right",
        autoClose: 2000,
        theme: "colored",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );

    setTimeout(() => setClickedId(null), 600);
  };

  return (
    <>
      <ToastContainer style={{ zIndex: 9999 }} />

      {/* Banner */}
      <motion.div
        className="speakerbanner position-relative mb-5"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <img src={img} alt="banner" className="img-fluid w-100" />
        <p className="text-banner">{text}</p>
      </motion.div>

      <div className="container">
        <motion.h2 className="product-title text-center text-white">{title}</motion.h2>
        <motion.p className="product-subtitle text-center">{desc}</motion.p>

        <p className="product-count text-center">{products.length} ITEMS</p>

        {/* Sort filter */}
        <div className="sort-filter mb-4 text-center">
          <label htmlFor="sort-select" className="me-2 fw-bold text-white">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="form-select w-auto d-inline-block"
          >
            <option value="">-- None --</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                className="col-12 col-sm-6 col-lg-4"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.4 }}
                viewport={{ once: true }}
              >
                <div className="product-card">
                  <div className="product-img-wrapper position-relative">
                    <img
                      src={`/${product.img}`}
                      alt={product.name}
                      className="product-img img-fluid"
                    />

                    <motion.div
                      className="overlay d-flex flex-column justify-content-center align-items-center"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.button
                        className="btn btn-dark mb-2 btn-main"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        animate={
                          clickedId === product.id
                            ? { scale: [1, 0.8, 1.2, 1], rotate: [0, -5, 5, 0] }
                            : {}
                        }
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      >
                        <i className="fas fa-shopping-cart me-2"></i>
                        Add to Cart
                      </motion.button>

                      <Link
                        to={`/products/${product.id}`}
                        className="btn btn-outline-light"
                      >
                        Details
                      </Link>
                    </motion.div>
                  </div>

                  <div className="product-info text-center mt-3">
                    <h5 className="product-name">{product.name}</h5>
                    <p className="product-price">
                      FROM {product.price.toLocaleString()} $
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Products;
