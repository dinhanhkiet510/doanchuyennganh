import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";

// Kết nối socket
const socket = io("https://doanchuyennganh.onrender.com");

export default function AdminChat() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);

  // Lưu selectedCustomer cho socket listener
  const selectedCustomerRef = useRef(null);
  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  // Kết nối socket + listener
  useEffect(() => {
    socket.emit("join", { userId: 1, role: "admin" });

    socket.on("receiveMessage", ({ senderId, senderRole, message }) => {
      const currentCustomer = selectedCustomerRef.current;

      if (senderRole === "customer") {
        if (currentCustomer && senderId === currentCustomer.id) {
          setMessages((prev) => [
            ...prev,
            { sender_id: senderId, sender_role: senderRole, message },
          ]);
        } else {
          // Gắn badge tin nhắn mới
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === senderId ? { ...c, hasNewMessage: true } : c
            )
          );
        }
      }

      if (senderRole === "admin") {
        setMessages((prev) => [
          ...prev,
          { sender_id: senderId, sender_role: senderRole, message },
        ]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  // Auto scroll xuống cuối khi có tin nhắn
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Lấy danh sách khách hàng
  useEffect(() => {
    axios
      .get("https://doanchuyennganh.onrender.com/customers")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Lỗi lấy khách hàng:", err));
  }, []);

  // Chọn customer và load lịch sử chat
  const selectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/messages/${customer.id}`
      );
      setMessages(
        res.data.map((m) => ({
          sender_id: m.is_admin_sender ? "admin" : customer.id,
          sender_role: m.is_admin_sender ? "admin" : "customer",
          message: m.message,
        }))
      );
    } catch (err) {
      console.error("Lỗi lấy chat:", err);
      setMessages([]);
    }
  };

  // Gửi tin nhắn
  const sendMessage = () => {
    if (!selectedCustomer || !newMsg.trim()) return;

    socket.emit("sendMessage", {
      senderId: 1, // ID admin cố định
      senderRole: "admin",
      receiverId: selectedCustomer.id,
      receiverRole: "customer",
      message: newMsg,
      isAdminSender: true,
    });

    setNewMsg("");
  };

  return (
    <div className="d-flex vh-100" style={{ background: "#e9ecef" }}>
      {/* Sidebar khách hàng */}
      <div
        className="bg-white shadow-sm border-end p-3"
        style={{ width: "280px" }}
      >
        <h5 className="mb-3">Khách hàng</h5>
        <ul className="list-group list-group-flush">
          {customers.map((c) => (
            <li
              key={c.id}
              className={`list-group-item d-flex align-items-center justify-content-between ${
                selectedCustomer?.id === c.id
                  ? "active bg-primary text-white"
                  : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => {
                selectCustomer(c);
                setCustomers((prev) =>
                  prev.map((x) =>
                    x.id === c.id ? { ...x, hasNewMessage: false } : x
                  )
                );
              }}
            >
              <span>{c.name}</span>
              {c.hasNewMessage && (
                <span className="badge bg-danger rounded-pill">●</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Khung chat */}
      <div className="flex-grow-1 d-flex flex-column">
        <div className="p-3 border-bottom bg-light shadow-sm">
          <h5 className="mb-0">
            Chat với: {selectedCustomer ? selectedCustomer.name : "Chưa chọn"}
          </h5>
        </div>

        {/* Nội dung chat */}
        <div
          className="flex-grow-1 p-4 overflow-auto"
          style={{ background: "#f5f5f5" }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`d-flex mb-3 ${
                m.sender_role === "admin"
                  ? "justify-content-end"
                  : "justify-content-start"
              }`}
            >
              <div
                className={`p-2 rounded shadow-sm ${
                  m.sender_role === "admin"
                    ? "bg-primary text-white"
                    : "bg-white"
                }`}
                style={{ maxWidth: "60%", wordWrap: "break-word" }}
              >
                {m.message}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Ô nhập tin nhắn */}
        <div className="d-flex p-3 border-top bg-white">
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            className="form-control me-2 shadow-sm"
            placeholder="Nhập tin nhắn..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} className="btn btn-primary shadow-sm">
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
