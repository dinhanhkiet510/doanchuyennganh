require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const nodemailer = require("nodemailer");
const mysql = require("mysql2/promise");
const http = require("http");
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.set("trust proxy", 1);

// =================== MIDDLEWARE ===================
app.use(bodyParser.json());
app.use(cors({
  origin: "https://doanchuyennganh.vercel.app",
  credentials: true,
  allowedHeaders: ["Content-Type"],
  methods: ["GET","POST","PUT","DELETE","OPTIONS"]
}));

app.options("*", (req, res) => {
  res.sendStatus(200); // trả về OK cho preflight
});

// =================== DATABASE ===================
let db;

async function initDB() {
  db = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    ssl: { rejectUnauthorized: false }
  });
  console.log("✅ MySQL connected");
}

async function query(sql, params = []) {
  if (!db) throw new Error("DB not connected");
  const safeParams = params.map(p => (p === undefined ? null : p));
  const [rows] = await db.execute(sql, safeParams);
  return rows;
}


// Query raw (cho lệnh không hỗ trợ prepared statements)
async function queryRaw(sql) {
  if (!db) throw new Error("DB not connected");
  const [rows] = await db.query(sql); // dùng query thay vì execute
  return rows;
}

// =================== SESSION ===================
const sessionStore = new MySQLStore({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT || 3306,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE
});

app.use(session({
  key: "session_cookie_name",
  secret: process.env.SESSION_SECRET || "secretKey",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24*60*60*1000
  }
}));

  // =================== EMBEDDING & SIMILARITY ===================
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  async function getEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values; // array float
  }

  function cosineSimilarity(a, b) {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  }

// =================== PASSPORT ===================
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const results = await query("SELECT id, name, email, provider FROM customers WHERE id = ?", [id]);
    done(null, results[0] || null);
  } catch(err) { done(err,null); }
});

// Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const existing = await query("SELECT * FROM customers WHERE email = ?", [email]);
    let userId;
    if (existing.length) {
      await query("UPDATE customers SET provider='google', provider_id=? WHERE email=?", [profile.id,email]);
      userId = existing[0].id;
    } else {
      const result = await query(
        "INSERT INTO customers (name,email,provider,provider_id) VALUES (?,?, 'google', ?)",
        [profile.displayName,email,profile.id]
      );
      userId = result.insertId;
    }
    done(null, { id: userId, name: profile.displayName, email, provider: "google" });
  } catch(err) { done(err,null); }
}));

// Facebook OAuth
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL,
  profileFields: ["id","displayName","emails"]
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || `fb_${profile.id}@noemail.com`;
    const existing = await query("SELECT * FROM customers WHERE email=?", [email]);
    let userId;
    if (existing.length) {
      await query("UPDATE customers SET provider='facebook', provider_id=? WHERE email=?", [profile.id,email]);
      userId = existing[0].id;
    } else {
      const result = await query(
        "INSERT INTO customers (name,email,provider,provider_id) VALUES (?,?, 'facebook', ?)",
        [profile.displayName,email,profile.id]
      );
      userId = result.insertId;
    }
    done(null, { id: userId, name: profile.displayName, email, provider: "facebook" });
  } catch(err) { done(err,null); }
}));

// OAuth routes
app.get("/auth/google", passport.authenticate("google",{scope:["profile","email"]}));
app.get("/auth/google/callback", passport.authenticate("google",{failureRedirect:"/"}), (req,res) => {
  req.session.user = req.user;
  res.redirect(process.env.FRONTEND_URL);
});

app.get("/auth/facebook", passport.authenticate("facebook",{scope:["email"]}));
app.get("/auth/facebook/callback", passport.authenticate("facebook",{failureRedirect:"/"}), (req,res) => {
  req.session.user = req.user;
  res.redirect(process.env.FRONTEND_URL);
});

// =================== MAIL ===================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// =================== API trả về user cho React ===================
app.get("/api/current_user", async (req, res) => {
  if (!req.session.user) return res.status(200).json({ user: null });
  try {
    const { id } = req.session.user;
    console.log("Session user:", req.session.user); // debug session

    const results = await query(
      `SELECT id, name, email, phone, address, username, provider, provider_id, avatar 
       FROM customers 
       WHERE id = ? 
       LIMIT 1`,
      [id]
    );

    res.status(200).json({ user: results[0] || null });
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ user: null });
  }
});


// =================== Logout ===================
app.post("/api/logout", async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy(err => err ? reject(err) : resolve());
    });
    res.clearCookie("session_cookie_name", { path: "/", sameSite: "none", secure: true });
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("❌ Logout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// =================== PRODUCTS ===================
/*
// Lấy tất cả sản phẩm
app.get("/products", async (req, res) => {
  try {
    const results = await query("SELECT * FROM products");
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Lấy sản phẩm theo category_id & sort
app.get("/products/category/:categoryId", async (req, res) => {
  const categoryId = req.params.categoryId;
  const sort = req.query.sort || '';
  let orderBy = '';
  switch (sort) {
    case 'price-asc': orderBy = 'ORDER BY price ASC'; break;
    case 'price-desc': orderBy = 'ORDER BY price DESC'; break;
    case 'name-asc': orderBy = 'ORDER BY name ASC'; break;
    case 'name-desc': orderBy = 'ORDER BY name DESC'; break;
  }

  try {
    const results = await query(`SELECT * FROM products WHERE category_id = ? ${orderBy}`, [categoryId]);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Tìm kiếm sản phẩm
app.get("/api/products/search", async (req, res) => {
  const q = req.query.q || "";
  try {
    const results = await query(
      `SELECT id, name, img FROM products WHERE name LIKE ? LIMIT 3`,
      [`%${q}%`]
    );
    res.json(results.map(p => ({ ...p, image: `${process.env.REACT_APP_API_URL}/uploads/${p.img}` })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Lấy sản phẩm theo id
app.get("/api/products/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const results = await query("SELECT * FROM products WHERE id = ?", [productId]);
    if (!results.length) return res.status(404).json({ error: "Product not found" });
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Thêm sản phẩm
app.post("/products", async (req, res) => {
  const { name, price, stock } = req.body;
  try {
    const result = await query("INSERT INTO products (name, price, stock) VALUES (?, ?, ?)", [name, price, stock]);
    res.json({ message: "Thêm sản phẩm thành công", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Sửa sản phẩm
app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, stock } = req.body;
  try {
    await query("UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?", [name, price, stock, id]);
    res.json({ message: "Cập nhật sản phẩm thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Xóa sản phẩm
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
*/

// =================== AUTH ===================

// Đăng ký
app.post("/register", async (req, res) => {
  const { name, email, phone, address, username, password } = req.body;
  if (!name || !email || !phone || !address || !username || !password)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const existing = await query("SELECT * FROM customers WHERE email = ? OR username = ?", [email, username]);
    if (existing.length) return res.status(400).json({ message: "Email hoặc username đã tồn tại" });

    const result = await query(
      "INSERT INTO customers (name, email, phone, address, username, password) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, phone, address, username, password]
    );

    req.session.user = { id: result.insertId, name, email, username, provider: "local" };
    res.json({ user: req.session.user, role: "customer" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Đăng nhập
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await query("SELECT * FROM admin WHERE username = ? AND password_hash = ?", [username, password]);
    if (admin.length) {
      req.session.user = { id: admin[0].admin_id, name: admin[0].name || admin[0].username, role: "admin" };
      return res.json({ role: "admin", user: req.session.user });
    }

    const customer = await query("SELECT * FROM customers WHERE username = ? AND password = ?", [username, password]);
    if (customer.length) {
      req.session.user = {
        id: customer[0].id,
        name: customer[0].name,
        email: customer[0].email,
        username: customer[0].username,
        provider: "local"
      };
      return res.json({ role: "customer", user: req.session.user });
    }

    res.status(401).json({ message: "Sai username hoặc password" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =================== CHECKOUT===================
app.post("/checkout", async (req, res) => {
  let { fullname, shipping_address, phone, email, customer_id, order_items } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!fullname || !shipping_address || !phone || !email || !order_items?.length) {
    return res.status(400).json({ message: "Missing required fields or empty order items." });
  }

  if (!customer_id && req.session.user?.id) {
    customer_id = req.session.user.id;
  }
  
  // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction(); // rollback thủ công khi stock không đủ, nhưng nó vẫn tiềm ẩn rủi ro. Nếu có lỗi xảy ra ở bước giữa (ví dụ: lỗi chèn order_items), các bản ghi đã thêm vào DB vẫn sẽ tồn tại.

    // 1️ Thêm checkout
    const [checkoutResult] = await connection.execute(
      "INSERT INTO checkout (fullname, shipping_address, phone, email, customer_id) VALUES (?, ?, ?, ?, ?)",
      [fullname, shipping_address, phone, email, customer_id ?? null]
    );

    // 2️ Thêm order
    const [orderResult] = await connection.execute(
      "INSERT INTO orders (customer_id, customer_name, employee_id, order_date, status) VALUES (?, ?, NULL, NOW(), ?)",
      [customer_id ?? null, fullname, 'pending']
    );
    const orderId = orderResult.insertId;

    // 3️ Thêm order_items & cập nhật stock
    for (const item of order_items) {
      // Cập nhật stock trước để kiểm tra tính hợp lệ
      const [stockResult] = await connection.execute(
        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [item.quantity, item.product_id, item.quantity]
      );

      if (stockResult.affectedRows === 0) {
        throw new Error(`Insufficient stock for product ID: ${item.product_id}`);
      }

      // Sau khi stock hợp lệ thì mới thêm order_item
      await connection.execute(
        "INSERT INTO order_items (order_id, product_id, name, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.product_id, item.name, item.quantity, item.price]
      );
    }

    // 4️ Commit transaction nếu mọi thứ đều thành công
    await connection.commit();

    // 5️ Gửi email xác nhận
    const totalPrice = order_items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0), 0);
    let itemsHtml = order_items.map(item =>
      `<tr>
        <td style="padding:8px; border:1px solid #ddd;">${item.name}</td>
        <td style="padding:8px; border:1px solid #ddd; text-align:center;">${item.quantity}</td>
        <td style="padding:8px; border:1px solid #ddd; text-align:right;">${(item.price ?? 0).toLocaleString()} $</td>
        <td style="padding:8px; border:1px solid #ddd; text-align:right;">${((item.price ?? 0)*(item.quantity ?? 0)).toLocaleString()} $</td>
      </tr>`).join('');

    const mailOptions = {
      from: '"SPEAKER STORE" <dinhanhkiet510@gmail.com>',
      to: email,
      subject: `Order Confirmation #${orderId}`,
      html: `
        <h3>Hello ${fullname},</h3>
        <p>Thank you for your order at our store. Below is your order information:</p>
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
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.status(201).json({ order_id: orderId, message: "Order created but email not sent." });
      res.status(201).json({ order_id: orderId, message: "Order created and email sent." });
    });
  } catch (err) {
    // Nếu có lỗi, transaction sẽ tự động rollback
    await connection.rollback();
    console.error("❌ Checkout error:", err);
    res.status(500).json({ message: err.message || "Checkout failed due to a server error." });
  } finally {
    // Luôn giải phóng kết nối
    connection.release();
  }
});

// =================== CONTACT ===================
app.post("/api/contact", (req, res) => {
  console.log("-> 1. Received POST request to /api/contact");
  const { name, email, subject, message, customer_id } = req.body;

  // 1. Validate data
  if (!name || !email || !subject || !message) {
    console.error("-> 2. Validation failed: Missing required fields.");
    return res.status(400).json({ message: "Missing required fields." });
  }

  const sql = `
    INSERT INTO contact (name, email, subject, message, customer_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  // 2. Insert into database
  try {
    db.query(
      sql,
      [name, email, subject, message, customer_id || null],
      (err, result) => {
        if (err) {
          console.error("-> 3. Database insert error:", err);
          return res.status(500).json({ message: "Internal server error." });
        }

        // Send a success response immediately after DB operation
        console.log("-> 4. Successfully inserted into DB. Sending response to client.");
        res.status(201).json({
          message: "Your message has been received and saved.",
          id: result.insertId,
        });

        // 3. Asynchronously send email confirmation
        const mailOptions = {
          from: '"SPEAKERSTORE" <dinhanhkiet510@gmail.com>',
          to: email,
          subject: `Thank you for contacting us, ${name}!`,
          text: `Dear ${name},\n\nWe have received your message with the subject: "${subject}".\nOur team will get back to you as soon as possible.\n\nBest regards,\nSPEAKERSTORE Team`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("-> 5. Error sending mail:", error);
          } else {
            console.log("-> 5. Email sent successfully:", info.response);
          }
        });
      }
    );
  } catch (error) {
    // Catch any unexpected errors before DB query
    console.error("-> An unexpected error occurred:", error);
    res.status(500).json({ message: "An unexpected error occurred." });
  }
});

// =================== API admin lấy toàn bộ đơn hàng ===================
app.get("/orders", async (req, res) => {
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

  try {
    const results = await query(sql);

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
  } catch (err) {
    console.error("❌ Error fetching all orders:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =================== API admin cập nhật trạng thái đơn hàng ===================
app.put("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "Status is required" });

  try {
    const result = await query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order status updated successfully" });
  } catch (err) {
    console.error("❌ Error updating order status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Lấy tất cả khách hàng
app.get("/customers", async (req, res) => {
  try {
    const customers = await query("SELECT id, name, email, phone, address, username FROM customers");
    res.json(customers);
  } catch (err) {
    console.error("❌ Error fetching customers:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// =================== API cập nhật thông tin khách hàng ===================
app.put("/api/customers/me", async (req, res) => {
  const id = req.session.user?.id;
  if (!id) return res.status(401).json({ message: "Unauthorized" });

  const { name, phone, address, avatar } = req.body;
  try {
    await query("UPDATE customers SET name = ?, phone = ?, address = ?, avatar = ? WHERE id = ?", [name, phone, address, avatar, id]);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =================== API lấy thông tin khách hàng ===================
app.get("/api/customers/me", async (req, res) => {
  const id = req.session.user?.id;
  if (!id) return res.status(401).json({ message: "Unauthorized" });

  try {
    const results = await query("SELECT id, name, email, phone, address, username, avatar, provider FROM customers WHERE id = ?", [id]);
    if (!results.length) return res.status(404).json({ message: "Customer not found" });
    res.json(results[0]);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =================== API cập nhật mật khẩu ===================
app.put("/api/customers/me/password", async (req, res) => {
  const id = req.session.user?.id;
  if (!id) return res.status(401).json({ message: "Unauthorized" });

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: "Missing password fields" });

  try {
    const results = await query("SELECT password FROM customers WHERE id = ?", [id]);
    if (!results.length) return res.status(404).json({ message: "Customer not found" });
    if (results[0].password !== oldPassword) return res.status(400).json({ message: "Old password incorrect" });

    await query("UPDATE customers SET password = ? WHERE id = ?", [newPassword, id]);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error updating password:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =================== API lấy đơn hàng của khách hàng ===================
app.get("/api/orders/my-orders/:customerId", async (req, res) => {
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

  try {
    const results = await query(sql, [userId]);
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
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// =================== API Chatbot với RAG ===================
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("Chat message:", message);

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 1. Tạo embedding cho câu hỏi (có try/catch riêng)
    let userEmbedding = null;
    try {
      userEmbedding = await getEmbedding(message);
    } catch (err) {
      console.error("Embedding API error:", err.message);
    }

    // 2. Lấy sản phẩm từ MySQL
    const products = await query(
      "SELECT id, name, price, stock, img, embedding FROM products"
    );

    if (products.length === 0) {
      return res.json({ reply: "⚠ Hiện chưa có dữ liệu sản phẩm trong DB!" });
    }

    // 3. Nếu có embedding thì tính similarity
    let topProducts = [];
    if (userEmbedding) {
      const ranked = products.map((p) => {
        let score = 0;
        if (p.embedding) {
          try {
            const prodEmbedding = JSON.parse(p.embedding);
            score = cosineSimilarity(userEmbedding, prodEmbedding);
          } catch (err) {
            console.error("Parse embedding error:", err);
          }
        }
        return { ...p, score };
      });

      ranked.sort((a, b) => b.score - a.score);
      topProducts = ranked.slice(0, 5);
    }

    // 4. Nếu có sản phẩm liên quan → tạo context + gọi Gemini
    if (topProducts.length > 0 && topProducts[0].score > 0.6) {
      const context = topProducts
        .map(
          (p) =>
            `Tên: ${p.name}, Giá: ${p.price} VND, SL: ${p.stock}, Mô tả: ${p.description}`
        )
        .join("\n");

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const aiResp = await model.generateContent(
        `Người dùng hỏi: "${message}".\n
        Đây là dữ liệu sản phẩm phù hợp:\n
        ${context}\n
        → Hãy trả lời thân thiện, gợi ý sản phẩm hợp lý cho người dùng.`
      );

      return res.json({ reply: aiResp.response.text() });
    }

    // 5. Nếu không tìm thấy gì hoặc embedding fail → fallback AI
    const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fallbackResp = await fallbackModel.generateContent(
      `Người dùng hỏi: "${message}".\n
       Không có dữ liệu sản phẩm liên quan hoặc quota embedding đã hết.\n
       Hãy trả lời như một trợ lý AI thân thiện.`
    );

    res.json({ reply: fallbackResp.response.text() });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: "Chatbot bị lỗi", detail: err.message });
  }
});


// ---------------- SOCKET.IO ----------------
// Map lưu userId -> socketId
const onlineUsers = new Map();
// Tạo server HTTP dựa trên express
const server = http.createServer(app);
// Khởi tạo io từ server HTTP
const io = new Server(server, {
  cors: {
    origin: "https://doanchuyennganh.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("join", ({ userId, role }) => {
    if (!userId || !role) return;
    socket.userId = userId;
    socket.role = role;
    onlineUsers.set(userId, socket.id);
    console.log(`${role} joined with ID: ${userId}`);
  });

  socket.on("sendMessage", async ({ receiverId, message }) => {
    if (!socket.userId || !socket.role) {
      console.log("User not joined, cannot send message");
      return;
    }

    const isAdminSender = socket.role === "admin";

    try {
      const result = await query(
        "INSERT INTO messages (sender_id, receiver_id, message, is_admin_sender) VALUES (?, ?, ?, ?)",
        [socket.userId, receiverId, message, isAdminSender]
      );

      console.log("Message saved:", message, "ID:", result.insertId);

      const payload = {
        id: result.insertId,
        senderId: socket.userId,
        receiverId,
        senderRole: isAdminSender ? "admin" : "user",
        message,
        created_at: new Date(),
      };

      // Gửi cho người nhận nếu online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId)
        io.to(receiverSocketId).emit("receiveMessage", payload);
      
      // Gửi lại cho người gửi
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
  if (!customerId) return res.status(400).json({ error: "Customer ID required" });

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
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== API THỐNG KÊ ====================

// Thống kê số đơn hàng & doanh thu theo tháng
app.get("/api/statistics", async (req, res) => {
  const sql = `
    SELECT 
      DATE_FORMAT(o.order_date, '%Y-%m') AS month,
      COUNT(DISTINCT o.id) AS totalOrders,
      SUM(oi.quantity * oi.price) AS totalRevenue
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.status = 'completed'
    GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
    ORDER BY month ASC
  `;

  try {
    const results = await query(sql);
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching statistics:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Thống kê top 5 sản phẩm bán chạy nhất
app.get("/api/statistics/top-products", async (req, res) => {
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

  try {
    const results = await query(sql);
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching top products:", err);
    res.status(500).json({ error: "Server error" });
  }
});




// Khởi động server
async function startServer() {
  try {
    await initDB(); // DB phải connect trước khi nhận request
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server đang chạy tại cổng ${PORT}`);
    });
  } catch(err) {
    console.error("Failed to start server:", err);
  }
}

startServer(); 
