import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  // Lấy danh sách đơn hàng từ API
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/orders`)
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.error("Error fetching orders:", err));
  }, []);

  // Hàm cập nhật trạng thái
  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Cập nhật lại UI
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 fw-bold text-light">Order Management</h2>

      {orders.map((order) => (
        <div
          key={order.id}
          className="card border-0 shadow-sm mb-4 rounded-3 bg-dark text-light"
        >
          <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
            <span className="fw-semibold">
              Order #{order.id} — {order.customer_name}
            </span>
            <small className="text-muted">{order.order_date}</small>
          </div>

          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <strong className="me-2">Status:</strong>
              <select
                className="form-select w-auto bg-dark text-light border-secondary"
                value={order.status}
                onChange={(e) => updateStatus(order.id, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle text-center mb-0">
                <thead>
                  <tr className="text-secondary">
                    <th style={{ width: "40%" }}>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="text-start">{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price}</td>
                      <td className="fw-bold">${item.quantity * item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-end mt-3">
              <h5 className="fw-bold text-success">
                Total: $
                {order.items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                )}
              </h5>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
