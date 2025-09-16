import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { motion } from "framer-motion";

function Contact() {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState(""); // "" | "success" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, customer_id: user ? user.id : null };

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus("success");
        setStatusMessage("✅ Your message has been sent successfully!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        const errorData = await res.json();
        setStatus("error");
        setStatusMessage(`❌ ${errorData.message || "Failed to send message."}`);
      }
    } catch (error) {
      setStatus("error");
      setStatusMessage(`❌ ${error.message || "Network error."}`);
    }

    // 5 giây sau tự ẩn
    setTimeout(() => {
      setStatus("");
      setStatusMessage("");
    }, 5000);
  };

  return (
    <div
      className="position-relative min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundImage: "url('/assets/img/contact.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 0 }}
      ></div>

      {/* Form container */}
      <div
        className="position-relative"
        style={{ maxWidth: "600px", width: "90%", zIndex: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white p-5 rounded-4 shadow-lg"
        >
          <motion.h2
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center  mb-4 fw-bold"
          >
            Contact Us
          </motion.h2>

          <form onSubmit={handleSubmit}>
            {["name", "email", "subject"].map((field, i) => (
              <motion.div
                key={field}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="mb-3"
              >
                <label className="form-label text-secondary fw-semibold">
                  {field === "name"
                    ? "Full Name"
                    : field === "email"
                    ? "Email Address"
                    : "Subject"}
                </label>
                <input
                  type={field === "email" ? "email" : "text"}
                  name={field}
                  className="form-control"
                  placeholder={
                    field === "name"
                      ? "John Doe"
                      : field === "email"
                      ? "name@example.com"
                      : "Subject"
                  }
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-2"
            >
              <label className="form-label text-secondary fw-semibold">Message</label>
              <textarea
                name="message"
                rows="5"
                className="form-control"
                placeholder="Write your message..."
                value={formData.message}
                onChange={handleChange}
                required
              />
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="btn btn-primary w-100 fw-bold py-2 mb-2"
            >
              Send Message
            </motion.button>

            {/* Thông báo ngay dưới nút */}
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`text-center fw-bold ${status === "success" ? "text-success" : "text-danger"}`}
              >
                {statusMessage}
              </motion.div>
            )}
          </form>

          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center text-secondary small"
          >
            <p>
              <strong>Address:</strong> 6 Bùi Thị Xuân
            </p>
            <p>
              <strong>Phone:</strong> 0973154127
            </p>
            <p>
              <strong>Email:</strong> dinhanhkiet510@gmail.com
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Contact;
