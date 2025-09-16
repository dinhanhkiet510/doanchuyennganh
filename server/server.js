require("dotenv").config();
const passport = require('passport');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require("nodemailer");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require("mysql2/promise");
const http = require("http");
const { Server } = require("socket.io");
// Thêm thư viện Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Middleware
const app = express();
app.set('trust proxy', 1);

app.use(bodyParser.json());

app.use(cors({
  origin: "https://doanchuyennganh.vercel.app",
  methods: ["GET","POST","PUT","PATCH","DELETE"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
}));

// MySQL session store
const sessionStore = new MySQLStore({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT || 3306,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 86400000
});

// Express session
app.use(session({
  key: "session_cookie_name",
  secret: process.env.SESSION_SECRET || "secretKey",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,  // chỉ lưu session khi có dữ liệu
  cookie: {
    httpOnly: true,
    secure: true,          // bắt buộc HTTPS → đúng với Vercel + Render
    sameSite: "none",      // cross-site cookie
    maxAge: 24*60*60*1000
  }
}));


app.use(passport.initialize());
app.use(passport.session());

let db;
// Kết nối MySQL
async function main() {
   db = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    ssl: { rejectUnauthorized: false }
  });

  console.log("MySQL connected");
}

main();

// Hàm helper để query MySQL với promise
function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Serialize / Deserialize ---
passport.serializeUser((user, done) => done(null, user.id)); // chỉ lưu id
passport.deserializeUser(async (id, done) => {
  try {
    const results = await query("SELECT id, name, email, provider FROM customers WHERE id = ?", [id]);
    done(null, results[0]);
  } catch (err) {
    done(err, null);
  }
});

/**
 * GOOGLE LOGIN
 */
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.CALLBACK_URL}/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;

    let existing = await query("SELECT * FROM customers WHERE email = ?", [email]);

    let userId;
    if (existing.length > 0) {
      await query("UPDATE customers SET provider='google', provider_id=? WHERE email=?", [profile.id, email]);
      userId = existing[0].id;
    } else {
      const insertResult = await query(
        "INSERT INTO customers (name, email, provider, provider_id) VALUES (?, ?, 'google', ?)",
        [profile.displayName, email, profile.id]
      );
      userId = insertResult.insertId;
    }

    done(null, { id: userId, name: profile.displayName, email, provider: 'google' });
  } catch (err) {
    done(err, null);
  }
}));

/**
 * FACEBOOK LOGIN
 */
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.CALLBACK_URL}/facebook/callback`,
  profileFields: ['id', 'displayName', 'emails']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails ? profile.emails[0].value : `fb_${profile.id}@noemail.com`;

    let existing = await query("SELECT * FROM customers WHERE email = ?", [email]);

    let userId;
    if (existing.length > 0) {
      await query("UPDATE customers SET provider='facebook', provider_id=? WHERE email=?", [profile.id, email]);
      userId = existing[0].id;
    } else {
      const insertResult = await query(
        "INSERT INTO customers (name, email, provider, provider_id) VALUES (?, ?, 'facebook', ?)",
        [profile.displayName, email, profile.id]
      );
      userId = insertResult.insertId;
    }

    done(null, { id: userId, name: profile.displayName, email, provider: 'facebook' });
  } catch (err) {
    done(err, null);
  }
}));

// --- OAuth routes ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Lưu user vào session
    req.session.user = req.user; // req.user = { id, name, email, provider }
    res.redirect('http://localhost:3000');
  }
);

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => {
    req.session.user = req.user;
    res.redirect('http://localhost:3000');
  }
);

// --- API trả về user cho React ---
app.get("/api/current_user", (req, res) => {
  if (!req.session.user) return res.json({ user: null });

  const { id } = req.session.user;
  const sql = "SELECT id, name, email, provider FROM customers WHERE id = ? LIMIT 1";
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn user:", err);
      return res.status(500).json({ user: null });
    }

    if (results.length === 0) return res.json({ user: null });
    res.json({ user: results[0] });
  });
});


// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.sendStatus(200);
});

// Cấu hình transporter Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dinhanhkiet510@gmail.com",      // Thay bằng email gửi
    pass: "tysp bcrx wsyh xmru",   // Thay bằng app password
  },
});

// API: Lấy sản phẩm theo category_id,sắp xếp theo param sort
app.get('/products/category/:categoryId', (req, res) => {
  const categoryId = req.params.categoryId;
  const sort = req.query.sort || '';  // Lấy tham số sort từ query string

  let orderByClause = '';
  switch(sort) {
    case 'price-asc':
      orderByClause = 'ORDER BY price ASC';
      break;
    case 'price-desc':
      orderByClause = 'ORDER BY price DESC';
      break;
    case 'name-asc':
      orderByClause = 'ORDER BY name ASC';
      break;
    case 'name-desc':
      orderByClause = 'ORDER BY name DESC';
      break;
    default:
      orderByClause = ''; // không sắp xếp nếu không truyền hoặc truyền sai
  }

  const query = `SELECT * FROM products WHERE category_id = ? ${orderByClause}`;

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

// API CHECKOUT
app.post('/checkout', async (req, res) => {
  let { fullname, shipping_address, phone, email, customer_id, order_items } = req.body;

  // Nếu customer_id không có, lấy từ session (đăng nhập bằng OAuth)
  if (!customer_id && req.session.user?.id) {
    customer_id = req.session.user.id;
  }

  if (!fullname || !shipping_address || !phone || !email || !order_items || order_items.length === 0) {
    return res.status(400).json({ message: "Missing required fields or empty order items" });
  }

  try {
    // --- Bắt đầu transaction ---
    await new Promise((resolve, reject) => db.beginTransaction(err => err ? reject(err) : resolve()));

    // 1. Lưu thông tin checkout
    const checkoutResult = await new Promise((resolve, reject) => {
      const sql = 'INSERT INTO checkout (fullname, shipping_address, phone, email, customer_id) VALUES (?, ?, ?, ?, ?)';
      db.query(sql, [fullname, shipping_address, phone, email, customer_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // 2. Lưu thông tin order
    const orderResult = await new Promise((resolve, reject) => {
      const sql = 'INSERT INTO orders (customer_id, customer_name, employee_id, order_date, status) VALUES (?, ?, NULL, NOW(), ?)';
      db.query(sql, [customer_id, fullname, 'pending'], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    const orderId = orderResult.insertId;

    // 3. Lưu order items
    const itemsData = order_items.map(item => [orderId, item.product_id, item.name, item.quantity, item.price]);
    await new Promise((resolve, reject) => {
      const sql = 'INSERT INTO order_items (order_id, product_id, name, quantity, price) VALUES ?';
      db.query(sql, [itemsData], (err) => err ? reject(err) : resolve());
    });

    // 4. Update stock
    for (let item of order_items) {
      await new Promise((resolve, reject) => {
        const sql = 'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?';
        db.query(sql, [item.quantity, item.product_id, item.quantity], (err, result) => {
          if (err) return reject(err);
          if (result.affectedRows === 0) return reject(new Error(`Insufficient stock for product ID ${item.product_id}`));
          resolve();
        });
      });
    }

    // --- Commit transaction ---
    await new Promise((resolve, reject) => db.commit(err => err ? reject(err) : resolve()));

    // --- Gửi email xác nhận ---
    const totalPrice = order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let itemsHtml = '';
    order_items.forEach(item => {
      itemsHtml += `<tr>
        <td style="padding:8px; border:1px solid #ddd;">${item.name}</td>
        <td style="padding:8px; border:1px solid #ddd; text-align:center;">${item.quantity}</td>
        <td style="padding:8px; border:1px solid #ddd; text-align:right;">${item.price.toLocaleString()} $</td>
        <td style="padding:8px; border:1px solid #ddd; text-align:right;">${(item.price * item.quantity).toLocaleString()} $</td>
      </tr>`;
    });

    const mailOptions = {
      from: '"SPEAKER STORE" <dinhanhkiet510@gmail.com>',
      to: email,
      subject: `Order Confirmation #${orderId}`,
      html: `
        <h3>Hello ${fullname},</h3>
        <p>Thank you for your order at our store. Below is your order information:</p>
        <h4>Customer Information:</h4>
        <p>
          <strong>Full Name:</strong> ${fullname}<br/>
          <strong>Shipping Address:</strong> ${shipping_address}<br/>
          <strong>Phone Number:</strong> ${phone}<br/>
          <strong>Email:</strong> ${email}
        </p>
        <h4>Order Details:</h4>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="padding:8px; border:1px solid #ddd;">Product</th>
              <th style="padding:8px; border:1px solid #ddd;">Quantity</th>
              <th style="padding:8px; border:1px solid #ddd; text-align:right;">Unit Price</th>
              <th style="padding:8px; border:1px solid #ddd; text-align:right;">Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr>
              <td colspan="3" style="padding:8px; border:1px solid #ddd; font-weight:bold; text-align:right;">Total Amount</td>
              <td style="padding:8px; border:1px solid #ddd; font-weight:bold; text-align:right;">${totalPrice.toLocaleString()} $</td>
            </tr>
          </tbody>
        </table>
        <p>We will contact you shortly to process your order.</p>
        <p>Best regards,<br/>The Store Team</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending mail:", error);
        return res.status(201).json({ order_id: orderId, message: "Order created but email not sent." });
      }
      console.log("Email sent: " + info.response);
      return res.status(201).json({ order_id: orderId, message: "Order created and email sent." });
    });

  } catch (err) {
    console.error(err);
    db.rollback(() => {});
    return res.status(500).json({ message: err.message || "Checkout failed" });
  }
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

// API đăng nhập
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("Login attempt:", { username, password });

    // --- ADMIN ---
    const adminResults = await queryAsync(
      "SELECT * FROM admin WHERE username = ? AND password_hash = ?",
      [username, password]
    );

    console.log("Admin results:", adminResults);

    if (adminResults.length > 0) {
      req.session.user = {
        id: adminResults[0].id,
        name: adminResults[0].name || adminResults[0].username,
        role: "admin"
      };

      await new Promise((resolve, reject) => 
        req.session.save(err => (err ? reject(err) : resolve()))
      );

      return res.json({ role: "admin", user: req.session.user });
    }

    // --- CUSTOMER ---
    const customerResults = await queryAsync(
      "SELECT * FROM customers WHERE username = ? AND password = ?",
      [username, password]
    );

    console.log("Customer results:", customerResults);

    if (customerResults.length > 0) {
      const user = customerResults[0];
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        provider: "local"
      };

      await new Promise((resolve, reject) => 
        req.session.save(err => (err ? reject(err) : resolve()))
      );

      return res.json({ role: "customer", user: req.session.user });
    }

    // --- KHÔNG TÌM THẤY ---
    return res.status(401).json({ message: "Wrong username or password" });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// API đăng ký
app.post("/register", (req, res) => {
  const { name, email, phone, address, username, password } = req.body;

  if (!name || !email || !phone || !address || !username || !password) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }

  db.query(
    "SELECT * FROM customers WHERE email = ? OR username = ?",
    [email, username],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Server error" });
      if (results.length > 0) return res.status(400).json({ message: "Email or username already exists." });

      db.query(
        "INSERT INTO customers (name, email, phone, address, username, password) VALUES (?, ?, ?, ?, ?, ?)",
        [name, email, phone, address, username, password],
        (err, result) => {
          if (err) return res.status(500).json({ error: "Server error" });

          // Lưu session với id từ insertId
          req.session.user = {
            id: result.insertId,
            name,
            email,
            username,
            provider: 'local'
          };

          res.json({ user: req.session.user, role: "customer" });
        }
      );
    }
  );
});

//API lấy danh sách khách hàng 
app.get("/customers", (req, res) => {
  db.query("SELECT * FROM customers", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// API lấy đơn hàng của khách
app.get("/api/orders/my-orders/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  const sql = `
    SELECT 
      o.id AS order_id,
      o.customer_id,
      c.name AS customer_name,
      o.order_date,
      o.status,
      oi.product_id,
      oi.name AS product_name,
      oi.quantity,
      oi.price,
      p.img AS product_img
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    JOIN customers c ON o.customer_id = c.id
    WHERE o.customer_id = ?
    ORDER BY o.id DESC
  `;

  db.query(sql, [customerId], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }

    // Gom nhóm sản phẩm cùng đơn hàng
    const ordersMap = {};
    results.forEach(row => {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          id: row.order_id,
          customer_name: row.customer_name,
          order_date: row.order_date,
          status: row.status,
          items: []
        };
      }
      ordersMap[row.order_id].items.push({
        product_id: row.product_id,
        name: row.product_name,
        quantity: row.quantity,
        price: parseFloat(row.price),
        img: row.product_img
      });
    });

    res.json(Object.values(ordersMap));
  });
});

// API lưu contact
app.post("/contact", (req, res) => {
  const { name, email, subject, message, customer_id } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const sql =
    "INSERT INTO contact (name, email, subject, message, customer_id) VALUES (?, ?, ?, ?, ?)";

  db.query(
    sql,
    [name, email, subject, message, customer_id || null],
    (err, result) => {
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      // Gửi mail cho người dùng
      const mailOptions = {
        from: '"SPEAKERSTORE" dinhanhkiet510@gmail.com ', // người gửi
        to: email, // người nhận
        subject: `Thank you for contacting us, ${name}!`,
        text: `Dear ${name},

We have received your message with the subject: "${subject}".

Our team will get back to you as soon as possible.

Best regards,
Your Company Team`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending mail:", error);
          // Không bắt buộc phải lỗi gửi mail làm thất bại request
          return res.status(201).json({ message: "Contact saved, but email not sent." });
        } else {
          console.log("Email sent: " + info.response);
          return res.status(201).json({ message: "Contact saved and email sent.", id: result.insertId });
        }
      });
    }
  );
});

// ================= API LẤY DANH SÁCH ĐƠN HÀNG =================
app.get("/orders", (req, res) => {
  const sql = `
    SELECT 
      o.id AS order_id,
      o.customer_id,
      o.customer_name,
      o.order_date,
      o.status,
      oi.id AS item_id,
      oi.product_id,
      oi.name AS product_name,
      oi.quantity,
      oi.price,
      p.img AS product_img
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    ORDER BY o.order_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Lỗi lấy orders:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }

    // Gom nhóm sản phẩm theo từng đơn hàng
    const ordersMap = {};
    results.forEach(row => {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          id: row.order_id,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          order_date: row.order_date,
          status: row.status,
          items: []
        };
      }
      ordersMap[row.order_id].items.push({
        id: row.item_id,
        product_id: row.product_id,
        name: row.product_name,
        quantity: row.quantity,
        price: parseFloat(row.price),
        img: row.product_img
      });
    });

    res.json(Object.values(ordersMap));
  });
});

// API cập nhật trạng thái đơn hàng
app.put("/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  const sql = "UPDATE orders SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("Lỗi cập nhật đơn hàng:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated successfully" });
  });
});

//API cập nhập thông tin khách hàng
app.put("/api/customers/me", (req, res) => {
  const id = req.session.user?.id;
  if (!id) return res.status(401).json({ message: "Unauthorized" });

  const { name, phone, address, avatar } = req.body;
  const sql = "UPDATE customers SET name = ?, phone = ?, address = ?, avatar = ? WHERE id = ?";
  db.query(sql, [name, phone, address, avatar, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });
    res.json({ message: "Profile updated successfully" });
  });
});

//API thể hiện thông tin khách hàng
app.get("/api/customers/me", (req, res) => {
  const id = req.session.user?.id; // dùng id thay vì email
  if (!id) return res.status(401).json({ message: "Unauthorized" });

  const sql = "SELECT id, name, email, phone, address, username, avatar, provider FROM customers WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (results.length === 0) return res.status(404).json({ message: "Customer not found" });
    res.json(results[0]);
  });
});

// API: Cập nhật mật khẩu (plain text)
app.put("/api/customers/me/password", (req, res) => {
  const id = req.session.user?.id;
  if (!id) return res.status(401).json({ message: "Unauthorized" });

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: "Missing password fields" });

  const sqlGet = "SELECT password FROM customers WHERE id = ?";
  db.query(sqlGet, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (results.length === 0) return res.status(404).json({ message: "Customer not found" });

    const currentPassword = results[0].password;
    if (currentPassword !== oldPassword) return res.status(400).json({ message: "Old password incorrect" });

    const sqlUpdate = "UPDATE customers SET password = ? WHERE id = ?";
    db.query(sqlUpdate, [newPassword, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Server error" });
      res.json({ message: "Password updated successfully" });
    });
  });
});

//API lấy đơn hàng của khách hàng kèm hình ảnh sản phẩm
app.get("/api/orders/my-orders/:id", async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const sql = `
    SELECT 
      o.id AS order_id,
      o.customer_id,
      o.customer_name,
      o.order_date,
      o.status,
      oi.product_id,
      oi.name AS product_name,
      oi.quantity,
      oi.price,
      p.img AS product_img
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.customer_id = ?
    ORDER BY o.id DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }

    // Gom nhóm sản phẩm cùng đơn hàng
    const ordersMap = {};
    results.forEach(row => {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          id: row.order_id,
          customer_name: row.customer_name,
          order_date: row.order_date,
          status: row.status,
          items: []
        };
      }
      ordersMap[row.order_id].items.push({
        product_id: row.product_id,
        name: row.product_name,
        quantity: row.quantity,
        price: parseFloat(row.price),
        img: row.product_img  // thêm ảnh sản phẩm
      });
    });

    res.json(Object.values(ordersMap));
  });
});

// Hàm gọi Gemini có retry
async function callGeminiWithRetry(prompt, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return result.response.text();
    } catch (err) {
      if (err.status === 503 && i < retries - 1) {
        console.warn(`Gemini quá tải, thử lại lần ${i + 1}/${retries}...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
}

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // 1. Tìm sản phẩm theo tên
    const sqlFind = "SELECT name, price, stock, img FROM products WHERE name LIKE ?";
    db.query(sqlFind, [`%${message}%`], async (err, productResults) => {
      if (err) {
        console.error("❌ Lỗi query DB:", err);
        return res.status(500).json({ error: "Lỗi DB" });
      }

      if (productResults.length > 0) {
        let reply = "<b>Thông tin sản phẩm bạn quan tâm:</b><br/>";
        productResults.forEach((p) => {
          reply += `- <b>${p.name}</b><br/>Giá: ${p.price} VND | SL: ${p.stock}<br/><img src="/${p.img}" alt="sản phẩm" style="max-width:120px"/><br/><br/>`;
        });
        return res.json({ reply });
      }

      // 2. Tìm theo danh mục
      const categoryMap = {
        "amp": 1,
        "amps": 1,
        "loa": 2,
        "speaker": 2,
        "speakers": 2,
        "tai nghe": 3,
        "headphone": 3,
        "headphones": 3,
      };

      let categoryId = null;
      for (const [kw, id] of Object.entries(categoryMap)) {
        if (message.toLowerCase().includes(kw)) {
          categoryId = id;
          break;
        }
      }

      if (categoryId) {
        const sqlCategory = "SELECT name, price, stock, img FROM products WHERE category_id = ? LIMIT 5";
        db.query(sqlCategory, [categoryId], (err, results) => {
          if (err) {
            console.error("❌ Lỗi query DB:", err);
            return res.status(500).json({ error: "Lỗi DB" });
          }

          if (results.length > 0) {
            let reply = "<b>Một số sản phẩm nổi bật trong danh mục bạn quan tâm:</b><br/>";
            results.forEach((p) => {
              reply += `- <b>${p.name}</b><br/>Giá: ${p.price} VND | SL: ${p.stock}<br/><img src="/${p.img}" alt="sản phẩm" style="max-width:120px"/><br/><br/>`;
            });
            return res.json({ reply });
          } else {
            return res.json({ reply: "⚠ Hiện chưa có sản phẩm nào trong danh mục này!" });
          }
        });
      } else {
        // 3. Nếu không tìm thấy gì thì hỏi Gemini
        try {
          const aiReply = await callGeminiWithRetry(
            `Người dùng hỏi: "${message}". Nếu liên quan sản phẩm, hãy trả lời gợi ý. Nếu không liên quan sản phẩm, trả lời như một trợ lý AI thân thiện.`
          );

          if (!aiReply) {
            return res.json({ reply: "🤖 Xin lỗi, tôi chưa có câu trả lời cho bạn." });
          }

          return res.json({ reply: aiReply });
        } catch (err) {
          console.error("❌ Gemini error:", err);
          return res.json({ reply: "🤖 Xin lỗi, hệ thống AI đang quá tải, vui lòng thử lại sau." });
        }
      }
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: "Chatbot bị lỗi" });
  }
});


// ---------------- SOCKET.IO ----------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://doanchuyennganh.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Map userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Khi client join
  socket.on("join", ({ userId, role }) => {
    socket.userId = userId;
    socket.role = role;
    onlineUsers.set(userId, socket.id);
    console.log(`${role} joined with ID: ${userId}`);
  });

  // Gửi tin nhắn
  socket.on("sendMessage", async ({ receiverId, message }) => {
    if (!socket.userId || !socket.role) {
      console.log("User not joined, cannot send message");
      return;
    }

    const isAdminSender = socket.role === "admin";

    try {
      // 1. Lưu DB
      const result = await query(
        "INSERT INTO messages (sender_id, receiver_id, message, is_admin_sender) VALUES (?, ?, ?, ?)",
        [socket.userId, receiverId, message, isAdminSender]
      );
      console.log("💾 Message saved:", message, "ID:", result.insertId);

      const payload = {
        senderId: socket.userId,
        receiverId,
        senderRole: isAdminSender ? "admin" : "customer",
        message,
      };

      // 2. Gửi cho người nhận (nếu online)
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", payload);
      }

      // 3. Gửi lại cho chính người gửi (để hiển thị ngay)
      socket.emit("receiveMessage", payload);

    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    if (socket.userId) onlineUsers.delete(socket.userId);
  });
});

// API lấy toàn bộ chat giữa customer và admin
app.get("/messages/:customerId", async (req, res) => {
  const { customerId } = req.params;
  try {
    const rows = await query(
      `SELECT id, sender_id, receiver_id, message, is_admin_sender, created_at
       FROM messages
       WHERE sender_id = ? OR receiver_id = ?
       ORDER BY created_at ASC`,
      [customerId, customerId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==================== API THỐNG KÊ ====================

// Thống kê số đơn hàng & doanh thu theo tháng
app.get("/api/statistics", (req, res) => {
  const sql = `
    SELECT 
      DATE_FORMAT(o.order_date, '%Y-%m') AS month,
      COUNT(DISTINCT o.id) AS totalOrders,   -- mỗi đơn hàng chỉ tính 1 lần
      SUM(oi.quantity * oi.price) AS totalRevenue
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.status = 'completed'
    GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
    ORDER BY month ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi lấy statistics:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
    res.json(results);
  });
});

// Thống kê top 5 sản phẩm bán chạy nhất
app.get("/api/statistics/top-products", (req, res) => {
  const sql = `
    SELECT 
      oi.product_id,
      oi.name,
      SUM(oi.quantity) AS totalSold,
      SUM(oi.quantity * oi.price) AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'completed'
    GROUP BY oi.product_id, oi.name
    ORDER BY totalSold DESC
    LIMIT 5
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi lấy top products:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
    res.json(results);
  });
});



// Khởi động server
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});
