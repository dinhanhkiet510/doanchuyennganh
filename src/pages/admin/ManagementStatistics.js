import React, { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import axios from "axios";

// Đăng ký Chart.js
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

export default function ManagementStatistics() {
  const [orderStats, setOrderStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/statistics`)
      .then((res) => setOrderStats(res.data || []))
      .catch((err) => console.error("Lỗi lấy statistics:", err));

    axios
      .get(`${process.env.REACT_APP_API_URL}/api/statistics/top-products`)
      .then((res) => setTopProducts(res.data || []))
      .catch((err) => console.error("Lỗi lấy top products:", err));
  }, []);

  // Tổng doanh thu
  const totalRevenueAll = orderStats.reduce(
    (sum, item) => sum + Number(item.totalRevenue || 0),
    0
  );

  // Doanh thu tháng gần nhất
  const latestMonthRevenue =
    orderStats.length > 0 ? orderStats[orderStats.length - 1].totalRevenue : 0;

  // Tổng số đơn hàng
  const totalOrders = orderStats.reduce(
    (sum, item) => sum + (item.totalOrders || 0),
    0
  );

  // Dữ liệu cho Bar Chart
  const barData = {
    labels: orderStats.map((item) => item.month || ""),
    datasets: [
      {
        label: "Số đơn hàng",
        data: orderStats.map((item) => item.totalOrders || 0),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "Doanh thu ($)",
        data: orderStats.map((item) => item.totalRevenue || 0),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Thống kê đơn hàng & doanh thu theo tháng" },
    },
  };

  // Dữ liệu cho Line Chart
  const lineData = {
    labels: orderStats.map((item) => item.month || ""),
    datasets: [
      {
        label: "Doanh thu theo tháng",
        data: orderStats.map((item) => item.totalRevenue || 0),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Doanh thu theo tháng (Line Chart)" },
    },
  };

  // Dữ liệu cho Pie Chart
  const pieData = {
    labels: topProducts.map((item) => item.name || ""),
    datasets: [
      {
        label: "Số lượng bán",
        data: topProducts.map((item) => item.totalSold || 0),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "Top 5 sản phẩm bán chạy nhất" },
    },
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center fw-bold">Thống kê quản lý</h2>

      {/* Thông tin tổng quan */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body text-center">
              <h5 className="card-title text-primary">Tổng doanh thu</h5>
              <h3 className="fw-bold text-success">{totalRevenueAll.toLocaleString()} $</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body text-center">
              <h5 className="card-title text-primary">Doanh thu tháng gần nhất</h5>
              <h3 className="fw-bold text-warning">{latestMonthRevenue.toLocaleString()} $</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body text-center">
              <h5 className="card-title text-primary">Tổng số đơn hàng</h5>
              <h3 className="fw-bold text-info">{totalOrders}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="card shadow-sm border-0 p-3 mb-4">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
        <div className="col-md-8 mb-4">
          <div className="card shadow-sm border-0 p-3">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm border-0 p-3">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Sản phẩm bán chạy */}
      <div className="row mt-4">
        <div className="col">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Danh sách sản phẩm bán chạy</h5>
              <ul className="list-group list-group-flush">
                {topProducts.length > 0 ? (
                  topProducts.map((item, index) => (
                    <li
                      key={index}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      {item.name}
                      <span className="badge bg-success rounded-pill">{item.totalSold}</span>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item text-muted">Chưa có dữ liệu</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
