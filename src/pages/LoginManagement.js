import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ id: "", name: "", price: "", stock: "" });
  const [isEditing, setIsEditing] = useState(false);

  // Load products
  const fetchProducts = () => {
    axios.get("http://localhost:5000/products")
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add product
  const addProduct = (e) => {
    e.preventDefault();
    axios.post("http://localhost:5000/products", {
      name: formData.name,
      price: formData.price,
      stock: formData.stock
    })
      .then(res => {
        fetchProducts();
        setFormData({ id: "", name: "", price: "", stock: "" });
      })
      .catch(err => console.error(err));
  };

  // Edit product
  const editProduct = (product) => {
    setFormData(product);
    setIsEditing(true);
  };

  // Update product
  const updateProduct = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:5000/products/${formData.id}`, {
      name: formData.name,
      price: formData.price,
      stock: formData.stock
    })
      .then(() => {
        fetchProducts();
        setFormData({ id: "", name: "", price: "", stock: "" });
        setIsEditing(false);
        alert("Product updated successfully!");
      })
      .catch(err => console.error(err));
  };

  // Delete product
  const deleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      axios.delete(`http://localhost:5000/products/${id}`)
        .then(() => fetchProducts())
        .catch(err => console.error(err));
    }
  };

  return (
    <div className="container py-5 mt-5">
      <h2 className="mb-4 text-center fw-bold text-white">Product Management</h2>

      {/* Form */}
      <form className="row g-3 mb-4" onSubmit={isEditing ? updateProduct : addProduct}>
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            type="number"
            className="form-control"
            placeholder="Price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            type="number"
            className="form-control"
            placeholder="Stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-2">
          <button type="submit" className={`btn w-100 ${isEditing ? "btn-warning" : "btn-success"}`}>
            {isEditing ? "Update" : "Add"}
          </button>
        </div>
      </form>

      {/* Table */}
      <table className="table table-hover table-bordered align-middle shadow-sm">
        <thead className="table-dark text-center">
          <tr>
            <th>ID</th>
            <th>Product Name</th>
            <th>Price ($)</th>
            <th>Stock</th>
            <th style={{ width: "150px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="text-center">{p.id}</td>
              <td>{p.name}</td>
              <td className="text-end">{p.price}</td>
              <td className="text-center">{p.stock}</td>
              <td className="text-center">
                <button className="btn btn-sm btn-primary me-2" onClick={() => editProduct(p)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => deleteProduct(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductManagement;
