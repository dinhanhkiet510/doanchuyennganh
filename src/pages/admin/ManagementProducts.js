import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toast, Modal, Button, Form, Pagination, InputGroup } from "react-bootstrap";
import { FaSearch, FaPlus } from "react-icons/fa";

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: "",
    stock: "",
    img: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Load products
  const fetchProducts = () => {
    axios.get("http://localhost:5000/products")
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter + Search
  useEffect(() => {
    let filtered = products;

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const parseNumber = (str) => {
      if (!str) return NaN;
      return parseFloat(str.replace(/,/g, ""));
    };

    const min = parseNumber(priceRange.min);
    const max = parseNumber(priceRange.max);

    if (!isNaN(min)) filtered = filtered.filter(p => p.price >= min);
    if (!isNaN(max)) filtered = filtered.filter(p => p.price <= max);

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchTerm, priceRange]);

  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const normalized = priceStr.replace(/,/g, "");
    return parseFloat(normalized);
  };

  // Modal actions
  const openAddForm = () => {
    setFormData({ id: "", name: "", price: "", stock: "", img: "" });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditForm = (product) => {
    setFormData({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      stock: product.stock,
      img: product.img || ""
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const addProduct = (e) => {
    e.preventDefault();
    axios.post("http://localhost:5000/products", {
      name: formData.name,
      price: parsePrice(formData.price),
      stock: parseInt(formData.stock),
      img: formData.img
    })
      .then(() => {
        fetchProducts();
        setToast({ show: true, message: "✅ Product added successfully!", variant: "success" });
        setShowModal(false);
      })
      .catch(() => setToast({ show: true, message: "❌ Failed to add product.", variant: "danger" }));
  };

  const updateProduct = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:5000/products/${formData.id}`, {
      name: formData.name,
      price: parsePrice(formData.price),
      stock: parseInt(formData.stock),
      img: formData.img
    })
      .then(() => {
        fetchProducts();
        setToast({ show: true, message: "✅ Product updated successfully!", variant: "success" });
        setShowModal(false);
      })
      .catch(() => setToast({ show: true, message: "❌ Failed to update product.", variant: "danger" }));
  };

  const confirmDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const deleteProduct = () => {
    axios.delete(`http://localhost:5000/products/${productToDelete.id}`)
      .then(() => {
        fetchProducts();
        setToast({ show: true, message: "🗑️ Product deleted!", variant: "success" });
      })
      .catch(() => setToast({ show: true, message: "❌ Failed to delete product.", variant: "danger" }))
      .finally(() => {
        setShowDeleteModal(false);
        setProductToDelete(null);
      });
  };

  // Reset form
  const resetForm = () => {
    if (isEditing) {
      const prod = products.find(p => p.id === formData.id);
      if (prod) {
        setFormData({
          id: prod.id,
          name: prod.name,
          price: prod.price.toString(),
          stock: prod.stock,
          img: prod.img || ""
        });
      }
    } else {
      setFormData({ id: "", name: "", price: "", stock: "", img: "" });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginationItems = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationItems.push(
      <Pagination.Item
        key={i}
        active={i === currentPage}
        onClick={() => setCurrentPage(i)}
      >
        {i}
      </Pagination.Item>
    );
  }

  return (
    <div className="container py-4 mt-5" style={{ backgroundColor: "#121212", minHeight: "100vh", color: "white" }}>
      <h2 className="mb-4 text-center fw-bold">Product Management</h2>

      {/* Search Bar */}
      <div className="row mb-4 g-2 align-items-center">
        <div className="col-md-8">
          <InputGroup>
            <InputGroup.Text className="bg-primary text-white"><FaSearch /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
        <div className="col-md-2">
          <Form.Control
            type="text"
            placeholder="Min price"
            value={priceRange.min}
            onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
          />
        </div>
        <div className="col-md-2">
          <Form.Control
            type="text"
            placeholder="Max price"
            value={priceRange.max}
            onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
          />
        </div>
      </div>

      {/* Add product button */}
      <div className="text-end mb-3">
        <Button variant="success" className="fw-bold px-4 rounded-pill" onClick={openAddForm}>
          <FaPlus className="me-2" /> Add Product
        </Button>
      </div>

      {/* Products grid */}
      <div className="row g-4">
        {currentProducts.length === 0 && (
          <p className="text-center text-muted">No products found.</p>
        )}
        {currentProducts.map(product => (
          <div key={product.id} className="col-md-4">
            <div className="card h-100 shadow-lg rounded-4" style={{ backgroundColor: "#1e1e1e", color: "white" }}>
              {product.img
                ? <img src={`/${product.img}`} alt={product.name} className="card-img-top" style={{ height: "320px", objectFit: "cover" }} />
                : <div className="bg-secondary text-center p-5">No Image</div>
              }
              <div className="card-body d-flex flex-column">
                <h5 className="card-title fw-bold">{product.name}</h5>
                <p className="mb-1"><b>Price:</b> ${product.price.toLocaleString()}</p>
                <p className="mb-1"><b>Stock:</b> {product.stock}</p>
                <div className="mt-auto d-flex gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => openEditForm(product)}>Edit</Button>
                  <Button variant="outline-danger" size="sm" onClick={() => confirmDeleteProduct(product)}>Delete</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="justify-content-center mt-4">
          {paginationItems}
        </Pagination>
      )}

      {/* Add/Edit modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={isEditing ? updateProduct : addProduct}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditing ? "Edit Product" : "Add New Product"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Product Name</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price ($)</Form.Label>
              <Form.Control type="text" name="price" value={formData.price} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stock</Form.Label>
              <Form.Control type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control type="text" name="img" value={formData.img} onChange={handleChange} />
              {formData.img && <img src={`/${formData.img}`} alt="product" style={{ maxWidth: "100%", marginTop: "10px" }} />}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={resetForm}>Reset</Button>
            <Button variant={isEditing ? "warning" : "success"} type="submit">
              {isEditing ? "Update" : "Add"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to delete product <b>{productToDelete?.name}</b>?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={deleteProduct}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Toast */}
      <Toast show={toast.show} bg={toast.variant} onClose={() => setToast(prev => ({ ...prev, show: false }))} delay={3000} autohide
        style={{ position: "fixed", top: 20, right: 20, minWidth: 200, zIndex: 9999 }}>
        <Toast.Body className="text-white">{toast.message}</Toast.Body>
      </Toast>
    </div>
  );
}

export default ProductManagement;
