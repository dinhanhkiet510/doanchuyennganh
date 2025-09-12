import React, { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Thêm sản phẩm vào giỏ
  const addToCart = (product) => {
    setCartItems((prev) => {
      const exist = prev.find(item => item.id === product.id);
      if (exist) {
        // tăng số lượng
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  // Xóa sản phẩm khỏi giỏ
  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter(item => item.id !== productId));
  };

  // Cập nhật số lượng
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems((prev) =>
        prev.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  // Xóa hết giỏ hàng
  const clearCart = () => {
    setCartItems([]);
  };

  // Tính tổng số lượng sản phẩm
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Tính tổng tiền
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,          // <-- Đưa clearCart vào đây
      totalQuantity,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}
