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
const util = require("util");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.set("trust proxy", 1);

// =================== MIDDLEWARE ===================
app.use(bodyParser.json());
app.use(cors({
  origin: 'https://doanchuyennganh.vercel.app',
  credentials: true,
  allowedHeaders: ['Content-Type'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS']
}));
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


// =================== DATABASE ===================
let db;
let queryAsync;

async function initDB() {
  db = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    ssl: { rejectUnauthorized: false }
  });
  queryAsync = util.promisify(db.query).bind(db);
  console.log("MySQL connected");
}
initDB();

// Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
async function callGeminiWithRetry(prompt, retries = 3, delay = 2000) {
  for(let i=0;i<retries;i++){
    try {
      const result = await model.generateContent({ contents:[{role:"user", parts:[{text:prompt}]}] });
      return result.response.text();
    } catch(err) {
      if(err.status===503 && i<retries-1) await new Promise(r=>setTimeout(r, delay));
      else throw err;
    }
  }
}

app.use(passport.initialize());
app.use(passport.session());

// Passport serialize/deserialize
passport.serializeUser((user, done)=> done(null, user.id));
passport.deserializeUser(async (id, done)=>{
  try{
    const results = await query("SELECT id, name, email, provider FROM customers WHERE id=?", [id]);
    done(null, results[0]);
  } catch(err){ done(err,null); }
});

// Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.CALLBACK_URL}/google/callback`
}, async (accessToken, refreshToken, profile, done)=>{
  try{
    const email = profile.emails[0].value;
    const existing = await query("SELECT * FROM customers WHERE email=?", [email]);
    let userId;
    if(existing.length>0){
      await query("UPDATE customers SET provider='google', provider_id=? WHERE email=?", [profile.id,email]);
      userId = existing[0].id;
    } else {
      const result = await query("INSERT INTO customers (name,email,provider,provider_id) VALUES (?,?, 'google', ?)", [profile.displayName,email,profile.id]);
      userId = result.insertId;
    }
    done(null, {id:userId, name:profile.displayName, email, provider:'google'});
  } catch(err){ done(err,null); }
}));

// Facebook OAuth
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.CALLBACK_URL}/facebook/callback`,
  profileFields:['id','displayName','emails']
}, async (accessToken, refreshToken, profile, done)=>{
  try{
    const email = profile.emails?.[0]?.value || `fb_${profile.id}@noemail.com`;
    const existing = await query("SELECT * FROM customers WHERE email=?", [email]);
    let userId;
    if(existing.length>0){
      await query("UPDATE customers SET provider='facebook', provider_id=? WHERE email=?", [profile.id,email]);
      userId = existing[0].id;
    } else {
      const result = await query("INSERT INTO customers (name,email,provider,provider_id) VALUES (?,?, 'facebook', ?)", [profile.displayName,email,profile.id]);
      userId = result.insertId;
    }
    done(null, {id:userId,name:profile.displayName,email,provider:'facebook'});
  } catch(err){ done(err,null); }
}));

// OAuth routes
app.get('/auth/google', passport.authenticate('google',{scope:['profile','email']}));
app.get('/auth/google/callback', passport.authenticate('google',{failureRedirect:'/'}), (req,res)=>{
  req.session.user = req.user;
  res.redirect('http://localhost:3000');
});

app.get('/auth/facebook', passport.authenticate('facebook',{scope:['email']}));
app.get('/auth/facebook/callback', passport.authenticate('facebook',{failureRedirect:'/'}), (req,res)=>{
  req.session.user = req.user;
  res.redirect('http://localhost:3000');
});

// Cấu hình transporter Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dinhanhkiet510@gmail.com",      // Thay bằng email gửi
    pass: "tysp bcrx wsyh xmru",   // Thay bằng app password
  },
});

// --- API trả về user cho React ---
app.get("/api/current_user", async (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  try {
    const { id } = req.session.user;
    const results = await queryAsync("SELECT id, name, email, provider FROM customers WHERE id = ? LIMIT 1", [id]);
    res.json({ user: results[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ user: null });
  }
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.sendStatus(200);
});

// =================== PRODUCTS ===================
// Lấy sản phẩm theo category_id & sort
app.get('/products/category/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  const sort = req.query.sort || '';
  let orderBy = '';
  switch(sort) {
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
app.get('/api/products/search', async (req, res) => {
  const q = req.query.q || "";
  try {
    const results = await query(`
      SELECT id, name, img FROM products
      WHERE name LIKE ?
      LIMIT 3
    `, [`%${q}%`]);
    res.json(results.map(p => ({ ...p, image: `${process.env.REACT_APP_API_URL}/uploads/${p.img}` })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Lấy sản phẩm theo id
app.get('/api/products/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const results = await query('SELECT * FROM products WHERE id = ?', [productId]);
    if (!results.length) return res.status(404).json({ error: "Product not found" });
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
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
app.get("/products", async (req, res) => {
  try {
    const results = await query("SELECT * FROM products");
    res.json(results);
  } catch (err) {
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
    res.status(500).json({ error: "Server error" });
  }
});


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
      req.session.user = { id: admin[0].id, name: admin[0].name || admin[0].username, role: "admin" };
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

// ================= API lấy danh sách đơn hàng =================
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
    const results = await queryAsync(sql);

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
    console.error("❌ Lỗi lấy orders:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// ================= API cập nhật trạng thái đơn hàng =================
app.put("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "Status is required" });

  try {
    const result = await queryAsync("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order status updated successfully" });
  } catch (err) {
    console.error("Lỗi cập nhật đơn hàng:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// ================= API cập nhật thông tin khách hàng =================
app.put("/api/customers/me", async (req, res) => {
  const id = req.session.user?.id;
  if (!id) return res.status(401).json({ message: "Unauthorized" });

  const { name, phone, address, avatar } = req.body;
  try {
    await queryAsync("UPDATE customers SET name = ?, phone = ?, address = ?, avatar = ? WHERE id = ?", [name, phone, address, avatar, id]);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= API lấy thông tin khách hàng =================
app.get("/api/customers/me", async (req, res) => {
  const id = req.session.user?.id;
  if (!id) return res.status(401).json({ message: "Unauthorized" });

  try {
    const results = await queryAsync("SELECT id, name, email, phone, address, username, avatar, provider FROM customers WHERE id = ?", [id]);
    if (results.length === 0) return res.status(404).json({ message: "Customer not found" });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= API cập nhật mật khẩu =================
app.put("/api/customers/me/password", async (req, res) => {
  const id = req.session.user?.id;
  if (!id) return res.status(401).json({ message: "Unauthorized" });

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: "Missing password fields" });

  try {
    const results = await queryAsync("SELECT password FROM customers WHERE id = ?", [id]);
    if (results.length === 0) return res.status(404).json({ message: "Customer not found" });
    if (results[0].password !== oldPassword) return res.status(400).json({ message: "Old password incorrect" });

    await queryAsync("UPDATE customers SET password = ? WHERE id = ?", [newPassword, id]);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= API lấy đơn hàng của khách hàng =================
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

  try {
    const results = await queryAsync(sql, [userId]);
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
    console.error("Lỗi truy vấn:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// ================= API Chatbot =================
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // 1. Tìm sản phẩm theo tên
    const productResults = await queryAsync("SELECT name, price, stock, img FROM products WHERE name LIKE ?", [`%${message}%`]);
    if (productResults.length > 0) {
      let reply = "<b>Thông tin sản phẩm bạn quan tâm:</b><br/>";
      productResults.forEach(p => {
        reply += `- <b>${p.name}</b><br/>Giá: ${p.price} VND | SL: ${p.stock}<br/><img src="/${p.img}" alt="sản phẩm" style="max-width:120px"/><br/><br/>`;
      });
      return res.json({ reply });
    }

    // 2. Tìm theo danh mục
    const categoryMap = { amp: 1, amps: 1, loa: 2, speaker: 2, speakers: 2, "tai nghe": 3, headphone: 3, headphones: 3 };
    const categoryId = Object.entries(categoryMap).find(([kw]) => message.toLowerCase().includes(kw))?.[1];

    if (categoryId) {
      const catResults = await queryAsync("SELECT name, price, stock, img FROM products WHERE category_id = ? LIMIT 5", [categoryId]);
      if (catResults.length > 0) {
        let reply = "<b>Một số sản phẩm nổi bật trong danh mục bạn quan tâm:</b><br/>";
        catResults.forEach(p => {
          reply += `- <b>${p.name}</b><br/>Giá: ${p.price} VND | SL: ${p.stock}<br/><img src="/${p.img}" alt="sản phẩm" style="max-width:120px"/><br/><br/>`;
        });
        return res.json({ reply });
      } else {
        return res.json({ reply: "⚠ Hiện chưa có sản phẩm nào trong danh mục này!" });
      }
    }

    // 3. Nếu không tìm thấy gì thì gọi Gemini
    const aiReply = await callGeminiWithRetry(
      `Người dùng hỏi: "${message}". Nếu liên quan sản phẩm, hãy trả lời gợi ý. Nếu không liên quan sản phẩm, trả lời như một trợ lý AI thân thiện.`
    );
    res.json({ reply: aiReply || "🤖 Xin lỗi, tôi chưa có câu trả lời cho bạn." });

  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: "Chatbot bị lỗi" });
  }
});

// ---------------- SOCKET.IO ----------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://doanchuyennganh.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Map userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Khi client join
  socket.on("join", ({ userId, role }) => {
    if (!userId || !role) return;
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
      const result = await queryAsync(
        "INSERT INTO messages (sender_id, receiver_id, message, is_admin_sender) VALUES (?, ?, ?, ?)",
        [socket.userId, receiverId, message, isAdminSender]
      );
      console.log("💾 Message saved:", message, "ID:", result.insertId);

      const payload = {
        id: result.insertId,
        senderId: socket.userId,
        receiverId,
        senderRole: isAdminSender ? "admin" : "customer",
        message,
        created_at: new Date(),
      };

      // Gửi cho người nhận (nếu online)
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) io.to(receiverSocketId).emit("receiveMessage", payload);

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
    const rows = await queryAsync(
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
    const results = await queryAsync(sql);
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
    const results = await queryAsync(sql);
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching top products:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Khởi động server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});
