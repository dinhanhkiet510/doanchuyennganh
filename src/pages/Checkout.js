import React, { useState } from "react";

function Checkout() {
  const [formData, setFormData] = useState({
    fullname: "",
    shipping_address: "",
    phone: "",
    email: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const customerId = localStorage.getItem("customerId") || null;

    // Chuẩn hóa dữ liệu gửi đi
    const dataToSend = {
      fullname: formData.fullname.trim(),
      shipping_address: formData.shipping_address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      customer_id: customerId
    };

    // Check dữ liệu trống trước khi gửi
    if (!dataToSend.fullname || !dataToSend.shipping_address || !dataToSend.phone || !dataToSend.email) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Checkout info saved! ID: ${data.id}`);
      } else {
        alert('Failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Checkout - Shipping Information</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="fullname" style={styles.label}>Full Name</label>
          <input
            id="fullname"
            type="text"
            name="fullname"
            placeholder="Enter your full name"
            required
            value={formData.fullname}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="shipping_address" style={styles.label}>Shipping Address</label>
          <textarea
            id="shipping_address"
            name="shipping_address"
            placeholder="Enter your shipping address"
            required
            value={formData.shipping_address}
            onChange={handleChange}
            style={{ ...styles.input, height: 80, resize: "vertical" }}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="phone" style={styles.label}>Phone Number</label>
          <input
            id="phone"
            type="tel"
            name="phone"
            placeholder="Enter your phone number"
            required
            value={formData.phone}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Enter your email address"
            required
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <button type="submit" style={styles.button}>Place Order</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 1000,
    margin: "200px auto",
    padding: 20,
    boxShadow: "0 0 15px rgba(0,0,0,0.1)",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
    color: "#555",
    fontSize: 14,
  },
  input: {
    padding: "10px 14px",
    fontSize: 16,
    borderRadius: 5,
    border: "1.5px solid #ccc",
    outline: "none",
    transition: "border-color 0.3s ease",
  },
  button: {
    marginTop: 10,
    padding: "14px",
    fontSize: 18,
    fontWeight: "600",
    backgroundColor: "#ff6b35",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  }
};

export default Checkout;
