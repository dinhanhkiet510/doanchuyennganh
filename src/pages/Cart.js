import React, { useContext ,} from "react";
import { CartContext } from "./CartContext";
import Checkout from "./Checkout";
import { useNavigate } from "react-router-dom";

function Cart() {
  const { cartItems, updateQuantity, removeFromCart, totalPrice } = useContext(CartContext);
    const navigate = useNavigate();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return <><div className="banner-cart d-flex align-items-center justify-content-center mb-5">
                <img src="/assets/img/banner-cart.png" className="img-fluid w-100"></img>
            </div>
           <div className="text-clear" style={{ padding: 20 }}>Your shopping cart is empty.</div>
            </>
  }


  return (
    <>
    <div className="banner-cart d-flex align-items-center justify-content-center">
        <img src="/assets/img/banner-cart.png" className="img-fluid w-100"></img>
    </div>
      <div className="container-cart " style={{ maxWidth: 1000, margin: "auto", padding: 20, color: "white", paddingTop: "100px" }}>
             <h2>Your Shopping Cart</h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #ccc" }}>
                            <th>Product</th>
                            <th>Unit Price</th>
                            <th>Quantity</th>
                            <th>Total Price</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                      {cartItems.map(item => (
                          <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                              <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <img src={`/${item.img}`} alt={item.name} style={{ width: 60, height: 60, objectFit: "contain" }} />
                                  <span>{item.name}</span>
                              </td>
                              <td>{item.price.toLocaleString()} $</td>
                              <td>
                                  <input
                                      type="number"
                                      min={1}
                                      value={item.quantity}
                                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                                      style={{ width: 60 }} />
                              </td>
                              <td>{(item.price * item.quantity).toLocaleString()} $</td>
                              <td>
                                  <button
                                      onClick={() => removeFromCart(item.id)}
                                      style={{ background: "red", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
                                  >
                                      Delete
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table><h3 style={{ textAlign: "right", marginTop: 20 }}>
                      Total: {totalPrice.toLocaleString()} $
                  </h3><button
                      onClick={handleCheckout}
                      style={{
                          marginTop: 20,
                          padding: "12px 24px",
                          fontSize: 18,
                          backgroundColor: "#ff6b35",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          cursor: "pointer",
                      }}
                  >
                      BUY
                  </button>
          </div></>
  );
}

export default Cart;
