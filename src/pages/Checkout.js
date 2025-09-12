import React, { useState, useContext, useMemo } from "react";
import { CartContext } from "./CartContext";
import { motion } from "framer-motion";

function Checkout() {
  const { cartItems, clearCart } = useContext(CartContext);

  const [formData, setFormData] = useState({
    fullname: "",
    shipping_address: "",
    phone: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Tính tổng tiền
  const totalAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cartItems]
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      setStatusMessage("❌ Your cart is empty!");
      return;
    }

    const dataToSend = {
      fullname: formData.fullname.trim(),
      shipping_address: formData.shipping_address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      order_items: cartItems.map((item) => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    if (
      !dataToSend.fullname ||
      !dataToSend.shipping_address ||
      !dataToSend.phone ||
      !dataToSend.email
    ) {
      setStatusMessage("❌ Please fill in all fields!");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      const res = await fetch("http://localhost:5000/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage(
          `✅ Order placed successfully! Order ID: ${data.order_id}`
        );
        clearCart();
        setFormData({
          fullname: "",
          shipping_address: "",
          phone: "",
          email: "",
        });
      } else {
        setStatusMessage(`❌ Failed: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      setStatusMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(""), 5000);
    }
  };

  return (
    <div className="checkout-page">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="checkout-container"
      >
        {/* Form (Left) */}
        <div className="checkout-form-container">
          <h2 className="checkout-title">Checkout - Shipping Information</h2>
          <form onSubmit={handleSubmit} className="checkout-form">
            {["fullname", "shipping_address", "phone", "email"].map(
              (field, i) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="form-group"
                >
                  <label className="form-label">
                    {field === "fullname"
                      ? "Full Name"
                      : field === "shipping_address"
                      ? "Shipping Address"
                      : field === "phone"
                      ? "Phone Number"
                      : "Email Address"}
                  </label>
                  {field === "shipping_address" ? (
                    <textarea
                      name={field}
                      placeholder="Enter your shipping address"
                      value={formData[field]}
                      onChange={handleChange}
                      required
                      className="form-input textarea"
                    />
                  ) : (
                    <input
                      type={field === "email" ? "email" : "text"}
                      name={field}
                      placeholder={
                        field === "fullname"
                          ? "John Doe"
                          : field === "phone"
                          ? "097xxxxxxx"
                          : "name@example.com"
                      }
                      value={formData[field]}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  )}
                </motion.div>
              )
            )}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <div className="spinner"></div> : "Place Order"}
            </button>

            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`status-message ${
                  statusMessage.startsWith("✅") ? "success" : "error"
                }`}
              >
                {statusMessage}
              </motion.div>
            )}
          </form>
        </div>

        {/* Order Summary (Right) */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="order-summary"
        >
          <h3>Order Summary</h3>
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              <ul className="summary-list">
                {cartItems.map((item) => (
                  <li key={item.id} className="summary-item">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="summary-total">
                <strong>Total:</strong>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Styles */}
      <style jsx>{`
        .checkout-page {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          padding: 170px 20px;
          background: #f9f9f9;
        }
        .checkout-container {
          display: flex;
          gap: 40px;
          width: 100%;
          max-width: 1100px;
        }
        .checkout-form-container {
          flex: 2;
          background: #fff;
          padding: 30px 25px;
          border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }
        .order-summary {
          flex: 1;
          background: #fff;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
          height: fit-content;
        }
        .checkout-title {
          margin-bottom: 25px;
          font-weight: 700;
          font-size: 22px;
          color: #222;
        }
        .checkout-form {
          display: flex;
          flex-direction: column;
        }
        .form-group {
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
        }
        .form-label {
          font-weight: 600;
          margin-bottom: 6px;
          color: #555;
          font-size: 14px;
        }
        .form-input {
          padding: 12px 15px;
          font-size: 16px;
          border-radius: 6px;
          border: 1.5px solid #ccc;
          outline: none;
          transition: all 0.3s ease;
        }
        .form-input:focus {
          border-color: #ff6b35;
          box-shadow: 0 0 6px rgba(255, 107, 53, 0.3);
        }
        .textarea {
          height: 80px;
          resize: vertical;
        }
        .btn-submit {
          margin-top: 15px;
          padding: 14px;
          font-size: 18px;
          font-weight: 600;
          background-color: #ff6b35;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 50px;
          transition: all 0.3s ease;
        }
        .btn-submit:hover {
          background-color: #e65a1f;
        }
        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .status-message {
          margin-top: 15px;
          font-weight: 600;
          text-align: center;
        }
        .status-message.success {
          color: #28a745;
        }
        .status-message.error {
          color: #dc3545;
        }
        .order-summary h3 {
          margin-bottom: 20px;
          font-size: 20px;
          font-weight: 700;
        }
        .summary-list {
          list-style: none;
          padding: 0;
          margin: 0 0 15px 0;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
          font-size: 15px;
        }
        .summary-total {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: bold;
          padding-top: 12px;
        }
        @media (max-width: 768px) {
          .checkout-container {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default Checkout;
