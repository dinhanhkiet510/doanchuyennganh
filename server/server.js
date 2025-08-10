const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());  

// Kết nối MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "speaker_store"
});

db.connect((err) => {
  if (err) {
    console.error("Kết nối MySQL thất bại:", err);
    return;
  }
  console.log("Kết nối MySQL thành công!");
});

// API: Lấy sản phẩm theo category_id
app.get('/products/category/:categoryId', (req, res) => {
  const categoryId = req.params.categoryId;

  const query = "SELECT * FROM products WHERE category_id = ?";
  db.query(query, [categoryId], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
    res.json(results);
  });
});

// API tìm kiếm 
app.get('/api/products/search', (req, res) => {
    const q = req.query.q || "";
    const sql = `
        SELECT id, name, img
        FROM products
        WHERE name LIKE ?
        LIMIT 3
    `;
    db.query(sql, [`%${q}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        // Thêm đường dẫn đầy đủ cho ảnh
        const data = results.map(p => ({
            ...p,
            image: `http://localhost:5000/uploads/${p.img}`
        }));

        res.json(data);
    });
});

//API lấy sản phẩm theo id product ( details )
app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;

    // Ví dụ: query từ DB
    const sql = 'SELECT * FROM products WHERE id = ?';
    db.query(sql, [productId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(result[0]); // trả về 1 sản phẩm
    });
}); 


// API POST lưu checkout
app.post("/api/checkout", (req, res) => {
  const fullname = req.body.fullname || req.body.name;
  const shipping_address = req.body.shipping_address || req.body.address;
  const phone = req.body.phone;
  const email = req.body.email;
  const customer_id = req.body.customer_id || null;

  const sql = `
    INSERT INTO checkout (fullname, shipping_address, phone, email, customer_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [fullname, shipping_address, phone, email, customer_id],
    (err, result) => {
      if (err) {
        console.error("MySQL error:", err);
        return res
          .status(500)
          .json({ message: "Database error", error: err.sqlMessage });
      }
      res.json({ message: "Checkout created successfully", id: result.insertId });
    }
  );
});

// Lấy tất cả sản phẩm
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Thêm sản phẩm
app.post("/products", (req, res) => {
  const { name, price, stock } = req.body;
  db.query(
    "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
    [name, price, stock],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Thêm sản phẩm thành công", id: result.insertId });
    }
  );
});

// Sửa sản phẩm
app.put("/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, stock } = req.body;
  db.query(
    "UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?",
    [name, price, stock, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Cập nhật sản phẩm thành công" });
    }
  );
});

// Xóa sản phẩm
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Xóa sản phẩm thành công" });
  });
});

// Thêm sản phẩm mới
app.post("/products", (req, res) => {
  const { name, price, stock } = req.body;
  db.query(
    "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
    [name, price, stock],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Thêm sản phẩm thành công", id: result.insertId });
    }
  );
});

// API đăng nhập
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Admin login (không cần DB)
  if (username === "admin" && password === "admin") {
    return res.json({
      role: "admin",
      user: { username: "admin", name: "Administrator" }
    });
  }

  // Customer login (so sánh thẳng)
  db.query(
    "SELECT * FROM customers WHERE username = ? AND password = ?",
    [username, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });

      if (results.length === 0) {
        return res.status(401).json({ message: "Wrong user or password" });
      }

      res.json({
        role: "customer",
        user: results[0]
      });
    }
  );
});

// API đăng ký (lưu mật khẩu thẳng)
app.post("/register", (req, res) => {
  const { name, email, phone, address, username, password } = req.body;

  db.query(
    "INSERT INTO customers (name, email, phone, address, username, password) VALUES (?, ?, ?, ?, ?, ?)",
    [name, email, phone, address, username, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Đăng ký thành công!" });
    }
  );
});


// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
