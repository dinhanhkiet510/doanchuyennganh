import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Header from './components/Header';
import './css/Home.css';
import HomePage from './pages/HomePage';
import Footer from './components/Footer';
import Products from './pages/products';
import ProductDetails from './pages/ProductsDetails';
import { CartProvider } from './pages/CartContext';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ProductManagement from './pages/admin/ManagementProducts';
import Customers from './pages/admin/ManagementCustomers';
import Orders from './pages/admin/ManagementOrder';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './pages/AuthContext';
import AdminPage from './pages/admin/AdminPage';
import Contact from './pages/Contact';
import AboutMarshall from './pages/Aboutus';
import OAuthSuccess from './pages/OAuthSuccess';
import ProfilePage from './pages/ProfilePage';
import ChatbotWidget from './pages/ChatbotWidget';
import AdminChat from './pages/admin/AdminChat';
import ManagementStatistics from './pages/admin/ManagementStatistics';

function AppContent() {
  const location = useLocation();

  // Các path KHÔNG hiển thị chatbot
  const hiddenPaths = ["/login", "/register"];
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHiddenRoute = hiddenPaths.includes(location.pathname) || isAdminRoute;

  return (
    <>
      {/* Chỉ hiện chatbot khi không phải admin, login, register */}
      {!isHiddenRoute && <ChatbotWidget />}

      <Routes>
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        {/* ================== Giao diện người dùng ================== */}
        <Route path="/" element={
          <>
            <Header />
            <HomePage />
            <Footer />
          </>
        } />
        <Route path="/profile" element={
          <>
            <Header />
            <ProfilePage />
            <Footer />
          </>
        } />
        <Route path="/products/category/:categoryId" element={
          <>
            <Header />
            <Products />
            <Footer />
          </>
        } />

        <Route path="/about" element={
          <>
            <Header />
            <AboutMarshall />
            <Footer />
          </>
        } />

        <Route path="/products/:id" element={
          <>
            <Header />
            <ProductDetails />
            <Footer />
          </>
        } />

        <Route path="/cart" element={
          <>
            <Header />
            <Cart />
            <Footer />
          </>
        } />

        <Route path="/contact" element={
          <>
            <Header />
            <Contact />
            <Footer />
          </>
        } />

        <Route path="/checkout" element={
          <>
            <Header />
            <Checkout />
            <Footer />
          </>
        } />

        <Route path="/login" element={
          <>
            <Header />
            <Login />
            <Footer />
          </>
        } />

        <Route path="/register" element={
          <>
            <Header />
            <Register />
            <Footer />
          </>
        } />

        {/* ================== Giao diện Admin ================== */}
        <Route path="/admin/products" element={
          <AdminPage>
            <ProductManagement />
          </AdminPage>
        } />

        <Route path="/admin/orders" element={
          <AdminPage>
            <Orders />
          </AdminPage>
        } />

        <Route path="/admin/customers" element={
          <AdminPage>
            <Customers />
          </AdminPage>
        } />
        <Route path="/admin/statistics" element={
          <AdminPage>
            <ManagementStatistics />
          </AdminPage>
        } />

        <Route path="/admin/chat" element={
          <AdminPage>
            <AdminChat />
          </AdminPage>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
