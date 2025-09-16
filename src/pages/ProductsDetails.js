import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { CartContext } from "./CartContext";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [clicked, setClicked] = useState(false);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product);
    setClicked(true);

    toast.success(
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <i className="fas"></i>
        <span>Product has been added to your cart!</span>
      </div>,
      {
        position: "top-right",
        autoClose: 2000,
        theme: "colored",
      }
    );

    setTimeout(() => setClicked(false), 600);
  };

  if (!product) {
    return (
      <div className="text-center py-5 text-white">
        <div className="spinner-border text-light" role="status"></div>
        <p className="mt-3">Loading product details...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer style={{ zIndex: 9999 }} />

      {/* Banner */}
      <div className="product-detail-banner mb-5">
        <img
          src="/assets/img/details.png"
          alt="Details Banner"
          className="img-fluid w-100"
          style={{ objectFit: "cover", maxHeight: "1000px" }}
        />
      </div>

      {/* Product Details */}
      <div className="container text-white">
        <div className="row align-items-center">
          {/* Image */}
          <div className="col-md-6 mb-4">
            <motion.img
              src={`/${product.img}`}
              alt={product.name}
              className="img-fluid rounded shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Info */}
          <div className="col-md-6">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="fw-bold">{product.name}</h1>
              <h3 className="text-warning mb-3">
                From {product.price.toLocaleString()} $
              </h3>
              <p className="mb-3">{product.description}</p>
              <p className="mb-3">
                <strong>Stock:</strong>{" "}
                <span
                  className={product.stock > 0 ? "text-success" : "text-danger"}
                >
                  {product.stock > 0 ? product.stock : "Out of stock"}
                </span>
              </p>

              {/* Animated Buy Button */}
              <motion.button
                className="btn btn-dark btn-main btn-lg px-4 border-0"
                onClick={handleAddToCart}
                animate={
                  clicked
                    ? { scale: [1, 0.8, 1.2, 1], rotate: [0, -5, 5, 0] }
                    : {}
                }
                transition={{ duration: 0.6, ease: "easeInOut" }}
                disabled={product.stock === 0}
              >
                <i className="fas fa-shopping-cart me-2"></i>
                {product.stock === 0 ? "Out of Stock" : "BUY NOW"}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductDetails;
