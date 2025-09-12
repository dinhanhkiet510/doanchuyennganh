import React, { useContext, useState } from "react";
import { CartContext } from "./CartContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Cart() {
  const { cartItems, updateQuantity, removeFromCart, totalPrice } = useContext(CartContext);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setTimeout(() => {
      removeFromCart(id);
      setDeletingId(null);
    }, 400); // Thời gian trùng với animation exit
  };

  if (cartItems.length === 0) {
    return (
      <>
        <div className="banner-cart d-flex align-items-center justify-content-center mb-5">
          <img src="/assets/img/banner-cart.png" className="img-fluid w-100" alt="Cart Banner" />
        </div>
        <div className="text-center text-light py-4">
          <h4>Your shopping cart is empty.</h4>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="banner-cart d-flex align-items-center justify-content-center mb-4">
        <img src="/assets/img/banner-cart.png" className="img-fluid w-100" alt="Cart Banner" />
      </div>

      <div className="container py-5 text-light">
        <h2 className="mb-4">🛒 Your Shopping Cart</h2>

        <div className="table-responsive">
          <table className="table table-dark table-striped align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                  >
                    <td className="d-flex align-items-center gap-2">
                      <img
                        src={`/${item.img}`}
                        alt={item.name}
                        style={{ width: 60, height: 60, objectFit: "contain" }}
                      />
                      <span>{item.name}</span>
                    </td>
                    <td>{item.price.toLocaleString()} $</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        className="form-control form-control-sm"
                        style={{ width: "70px" }}
                      />
                    </td>
                    <td>{(item.price * item.quantity).toLocaleString()} $</td>
                    <td>
                      <motion.button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        whileTap={{ scale: 0.9 }}
                        animate={{
                          opacity: deletingId === item.id ? 0.6 : 1,
                          scale: deletingId === item.id ? 0.95 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        Delete
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4">
          <h3>Total: {totalPrice.toLocaleString()} $</h3>
          <motion.button
            onClick={handleCheckout}
            className="btn btn-warning btn-lg px-4"
            whileTap={{ scale: 0.95 }}
            animate={{ scale: [1, 1.05, 1], y: [0, -3, 0] }}
            transition={{ duration: 0.4 }}
          >
            BUY
          </motion.button>
        </div>
      </div>
    </>
  );
}

export default Cart;
