  import { useContext, useState, useRef, useEffect } from "react";
  import { AuthContext } from "./AuthContext";
  import axios from "axios";
  import { FaRobot, FaTimes } from "react-icons/fa";
  import { io } from "socket.io-client";
  import parse from "html-react-parser";

  // Kết nối socket
  const socket = io("https://doanchuyennganh.onrender.com", { transports: ["websocket"],  withCredentials: true});

  export default function ChatbotWidget() {
    const { user } = useContext(AuthContext);
    const userId = user?.id;

    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [mode, setMode] = useState("ai"); // "ai" hoặc "admin"
    const messagesEndRef = useRef(null);

    // Scroll xuống cuối khi có tin nhắn mới
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Join socket và nhận tin nhắn realtime
    useEffect(() => {
      if (!userId) return;

      socket.emit("join", { userId, role: "user" });

      socket.on("receiveMessage", ({ senderId, receiverId, senderRole, message }) => {
        // Không cần check receiverId === userId nữa
        setMessages((prev) => [...prev, { role: senderRole, content: message }]);
      });

      return () => {
        socket.off("receiveMessage");
      };
    }, [userId]);

    // Load lịch sử chat khi chuyển sang admin
    useEffect(() => {
      if (!userId) return;

      if (mode === "admin") {
        axios
          .get(`${process.env.REACT_APP_API_URL}/messages/${userId}`)
          .then((res) => {
            const mapped = res.data.map((m) => ({
              role: m.is_admin_sender ? "admin" : "user",
              content: m.message,
            }));
            setMessages(mapped);
          })
          .catch((err) => console.error("Load history error:", err));
      } else {
        setMessages([]); // reset khi quay lại AI
      }
    }, [mode, userId]);

    // Gửi tin nhắn
    const sendMessage = async () => {
      if (!input.trim()) return;
      const text = input.trim();
      setInput("");

      if (mode === "ai") {
        // Hiện tin nhắn user ngay lập tức
        setMessages((prev) => [...prev, { role: "user", content: text }]);

        try {
          const res = await axios.post(`${process.env.REACT_APP_API_URL}/chat`, { message: text });
          setMessages((prev) => [...prev, { role: "ai", content: res.data.reply }]);
        } catch (err) {
          console.error(err);
          setMessages((prev) => [...prev, { role: "ai", content: "Có lỗi xảy ra. Vui lòng thử lại." }]);
        }
      } else {
        // Hiện tin nhắn user ngay lập tức
        setMessages((prev) => [...prev, { role: "user", content: text }]);

        socket.emit("sendMessage", {
          senderId: userId,
          receiverId: 1, // ID admin cố định
          message: text,
        });
      }
    };


    return (
      <>
        {!open && (
          <div
            style={{
              position: "fixed",
              bottom: 20,
              right: 20,
              width: 60,
              height: 60,
              borderRadius: "50%",
              backgroundColor: "#0d6efd",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
              zIndex: 1000,
            }}
            onClick={() => setOpen(true)}
          >
            <FaRobot size={28} />
          </div>
        )}

        {open && (
          <div
            style={{
              position: "fixed",
              bottom: 20,
              right: 20,
              width: 360,
              height: 500,
              borderRadius: 12,
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1000,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: "#0d6efd",
                color: "#fff",
                padding: "12px",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: "bold",
              }}
            >
              <span>{mode === "ai" ? "AI Assistant" : "Chat với Admin"}</span>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setMode(mode === "ai" ? "admin" : "ai")}
                  style={{
                    background: "white",
                    color: "#0d6efd",
                    border: "none",
                    padding: "4px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {mode === "ai" ? "→ Admin" : "→ AI"}
                </button>
                <FaTimes style={{ cursor: "pointer" }} onClick={() => setOpen(false)} />
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: "12px",
                overflowY: "auto",
                background: "#f8f9fa",
              }}
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: m.role === "user" ? "right" : "left",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor:
                        m.role === "user"
                          ? "#0d6efd"
                          : m.role === "admin"
                          ? "#198754"
                          : "#6c757d",
                      color: "#fff",
                      padding: "8px 14px",
                      borderRadius: 18,
                      maxWidth: "80%",
                      wordBreak: "break-word",
                    }}
                  >
                    {m.role === "ai" ? parse(m.content) : m.content}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                display: "flex",
                padding: 10,
                borderTop: "1px solid #ddd",
                background: "#fff",
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="form-control"
                placeholder="Nhập tin nhắn..."
                style={{ flex: 1, marginRight: 8 }}
              />
              <button className="btn btn-primary" onClick={sendMessage}>
                Gửi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
