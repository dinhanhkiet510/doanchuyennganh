import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import ProductManagement from './pages/LoginManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div>
            <Header />
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path="/products/category/:categoryId" element={<Products />} /> 
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path='/checkout' element={<Checkout />} />
              <Route path='/login' element={<Login />} />
              <Route path='/admin/products' element={<ProductManagement />} />
              <Route path='/register' element={<Register />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
