// ============================================================
// Trang Seller Dashboard - Bảng điều khiển Kênh người bán
// Bao gồm: Thống kê doanh số, Quản lý đơn hàng, CRUD sản phẩm, Cài đặt Shop
// ============================================================
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from "@shared/api/catalog";
import type { Product } from "@shared/api/catalog";
import { useAuth } from "@app/providers/AuthContext";
import LoadingSpinner from "@shared/ui/LoadingSpinner";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  Truck,
  Clock,
  Store,
  DollarSign,
  ArrowUpRight,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

interface SellerOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  createdAt: string;
}

const INITIAL_SELLER_ORDERS: SellerOrder[] = [
  {
    orderId: "ORD-9821",
    customerName: "Nguyễn Hoàng Nam",
    customerPhone: "0912345678",
    productName: "MacBook Pro 16 inch M3 Pro (Space Black)",
    quantity: 1,
    totalAmount: 52990000,
    status: "Pending",
    createdAt: "2026-10-24 14:30",
  },
  {
    orderId: "ORD-9820",
    customerName: "Lê Minh Tuấn",
    customerPhone: "0987654321",
    productName: "Tai nghe Sony WH-1000XM5 Hi-Res",
    quantity: 2,
    totalAmount: 13780000,
    status: "Processing",
    createdAt: "2026-10-24 10:15",
  },
  {
    orderId: "ORD-9818",
    customerName: "Phạm Thúy Hằng",
    customerPhone: "0903456789",
    productName: "Bàn phím cơ không dây Keychron Q1 Pro",
    quantity: 1,
    totalAmount: 4350000,
    status: "Shipped",
    createdAt: "2026-10-23 16:40",
  },
  {
    orderId: "ORD-9815",
    customerName: "Trần Anh Đức",
    customerPhone: "0934567890",
    productName: "Chuột không dây Logitech MX Master 3S",
    quantity: 1,
    totalAmount: 2190000,
    status: "Delivered",
    createdAt: "2026-10-22 09:20",
  },
];

export default function SellerDashboard() {
  useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "settings">("overview");

  // Shop details from localStorage (or default)
  const [shopInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("nexus_seller_shop");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const shopName = shopInfo?.shopName || "Nexus Official Store";

  // ── 1. Query danh sách sản phẩm & danh mục ─────────────────────────────────
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", "seller"],
    queryFn: () => getProducts({ pageSize: 100 }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const allProducts = useMemo(() => productsData?.items ?? [], [productsData?.items]);

  // ── 2. Modal Thêm / Sửa sản phẩm ──────────────────────────────────────────
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "10",
    categoryId: "",
    imageUrl: "",
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      price: "",
      stockQuantity: "10",
      categoryId: categories?.[0]?.categoryId || "",
      imageUrl: "",
    });
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      stockQuantity: String(p.stockQuantity),
      categoryId: p.categoryId,
      imageUrl: p.imageUrl || "",
    });
    setIsProductModalOpen(true);
  };

  // Create Product Mutation
  const createMutation = useMutation({
    mutationFn: () =>
      createProduct({
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stockQuantity: Number(productForm.stockQuantity),
        categoryId: productForm.categoryId || (categories?.[0]?.categoryId ?? "cat-1"),
        imageUrl: productForm.imageUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Đã thêm sản phẩm mới thành công!");
      setIsProductModalOpen(false);
    },
    onError: () => toast.error("Thêm sản phẩm thất bại."),
  });

  // Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: () =>
      updateProduct(editingProduct!.productId, {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stockQuantity: Number(productForm.stockQuantity),
        categoryId: productForm.categoryId,
        imageUrl: productForm.imageUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Cập nhật thông tin sản phẩm thành công!");
      setIsProductModalOpen(false);
    },
    onError: () => toast.error("Cập nhật sản phẩm thất bại."),
  });

  // Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Đã xóa sản phẩm khỏi gian hàng.");
    },
    onError: () => toast.error("Không thể xóa sản phẩm này."),
  });

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.price) {
      toast.error("Vui lòng điền tên sản phẩm và giá bán!");
      return;
    }
    const priceNum = Number(productForm.price);
    const stockNum = Number(productForm.stockQuantity);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Giá bán sản phẩm phải lớn hơn 0 VNĐ!");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("Số lượng tồn kho không được âm!");
      return;
    }
    if (editingProduct) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  // ── 3. Quản lý Đơn hàng của Shop ──────────────────────────────────────────
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>(INITIAL_SELLER_ORDERS);
  const [orderFilter, setOrderFilter] = useState<string>("all");

  const filteredOrders = useMemo(() => {
    if (orderFilter === "all") return sellerOrders;
    return sellerOrders.filter((o) => o.status === orderFilter);
  }, [sellerOrders, orderFilter]);

  const handleUpdateOrderStatus = (orderId: string, nextStatus: SellerOrder["status"]) => {
    setSellerOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: nextStatus } : o))
    );
    toast.success(`Đã cập nhật trạng thái đơn ${orderId}!`);
  };

  // ── 4. Lọc & Tìm kiếm sản phẩm ────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("");

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchName = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = !selectedCatFilter || p.categoryId === selectedCatFilter;
      return matchName && matchCat;
    });
  }, [allProducts, productSearch, selectedCatFilter]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-nexus-900 via-nexus-800 to-nexus-700 rounded-3xl p-6 sm:p-8 text-white shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-gray-950 flex items-center justify-center font-extrabold text-2xl shadow-lg shrink-0">
              <Store size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold">{shopName}</h1>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Kênh Người Bán
                </span>
              </div>
              <p className="text-nexus-200 text-xs mt-1">
                Quản lý doanh thu, danh mục hàng hóa và đơn đặt hàng từ khách
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold backdrop-blur transition"
            >
              <ExternalLink size={15} /> Xem sàn mua sắm
            </Link>
            <button
              onClick={openCreateModal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold rounded-xl text-xs transition shadow-md"
            >
              <Plus size={16} /> Thêm sản phẩm
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {[
            { key: "overview", label: "Tổng quan & Thống kê", icon: <LayoutDashboard size={16} /> },
            { key: "products", label: `Sản phẩm (${allProducts.length})`, icon: <Package size={16} /> },
            { key: "orders", label: `Đơn hàng (${sellerOrders.length})`, icon: <ShoppingCart size={16} /> },
            { key: "settings", label: "Cài đặt Shop", icon: <Store size={16} /> },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                activeTab === t.key
                  ? "bg-nexus-600 text-white shadow-nexus-600/30"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: TỔNG QUAN & THỐNG KÊ ─────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-semibold">Doanh thu tháng này</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <DollarSign size={18} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-gray-900 mb-1">
                  {fmtVND(73310000)}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <ArrowUpRight size={14} /> +18.4% so với tháng trước
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-semibold">Tổng đơn hàng</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <ShoppingCart size={18} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-gray-900 mb-1">
                  128 đơn
                </div>
                <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold">
                  <ArrowUpRight size={14} /> 15 đơn phát sinh tuần này
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-semibold">Đơn chờ xác nhận</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-amber-600 mb-1">
                  {sellerOrders.filter((o) => o.status === "Pending").length} đơn
                </div>
                <div className="text-[11px] text-gray-400">Cần xác nhận để shipper lấy hàng</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-semibold">Tồn kho cảnh báo</span>
                  <div className="p-2 rounded-xl bg-red-50 text-red-600">
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-red-500 mb-1">
                  {allProducts.filter((p) => p.stockQuantity <= 5).length} sản phẩm
                </div>
                <div className="text-[11px] text-gray-400">Số lượng tồn kho dưới 5</div>
              </div>
            </div>

            {/* Biểu đồ doanh thu mô phỏng & Đơn hàng mới nhất */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Cột trái: Biểu đồ doanh thu tuần */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Thống kê doanh số tuần qua</h3>
                    <p className="text-xs text-gray-400">Doanh thu bán hàng từ Thứ 2 đến Chủ nhật</p>
                  </div>
                  <span className="text-xs font-bold text-nexus-600 bg-nexus-50 px-3 py-1 rounded-full">
                    Tuần 42/2026
                  </span>
                </div>

                {/* CSS Bar Chart */}
                <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-gray-100 pb-2">
                  {[
                    { day: "T2", val: 40, amt: "8.2tr" },
                    { day: "T3", val: 65, amt: "12.5tr" },
                    { day: "T4", val: 50, amt: "9.8tr" },
                    { day: "T5", val: 85, amt: "16.4tr" },
                    { day: "T6", val: 95, amt: "18.2tr" },
                    { day: "T7", val: 100, amt: "22.5tr" },
                    { day: "CN", val: 75, amt: "14.1tr" },
                  ].map((col) => (
                    <div key={col.day} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-semibold text-nexus-700 opacity-0 group-hover:opacity-100 transition">
                        {col.amt}
                      </span>
                      <div
                        className="w-full bg-nexus-100 group-hover:bg-nexus-600 rounded-t-xl transition-all duration-300"
                        style={{ height: `${col.val}%` }}
                      ></div>
                      <span className="text-xs font-medium text-gray-500">{col.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cột phải: Đơn hàng mới cần xử lý */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-base">Đơn hàng mới nhận</h3>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-xs font-semibold text-nexus-600 hover:underline flex items-center"
                    >
                      Xem tất cả <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {sellerOrders.slice(0, 3).map((o) => (
                      <div
                        key={o.orderId}
                        className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-800">{o.orderId}</span>
                            <span className="text-[10px] text-gray-400">• {o.customerName}</span>
                          </div>
                          <p className="text-xs text-gray-600 truncate mt-0.5">{o.productName}</p>
                          <span className="text-xs font-bold text-nexus-600 mt-1 block">
                            {fmtVND(o.totalAmount)}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            o.status === "Pending"
                              ? "bg-amber-100 text-amber-700"
                              : o.status === "Processing"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {o.status === "Pending" ? "Chờ duyệt" : o.status === "Processing" ? "Đang xử lý" : "Đã giao"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("orders")}
                  className="w-full mt-4 py-2 bg-nexus-50 hover:bg-nexus-100 text-nexus-700 font-bold text-xs rounded-xl transition"
                >
                  Xử lý đơn hàng ngay →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: QUẢN LÝ SẢN PHẨM (CRUD HOÀN CHỈNH) ──────────────────── */}
        {activeTab === "products" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Danh sách sản phẩm của Shop</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quản lý giá bán, số lượng tồn kho và tình trạng kinh doanh
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus size={16} /> Đăng sản phẩm mới
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
              <div className="sm:col-span-8 relative">
                <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm theo tên..."
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-nexus-400"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={selectedCatFilter}
                  onChange={(e) => setSelectedCatFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-nexus-400 bg-white"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories?.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Sản phẩm</th>
                    <th className="py-3 px-4">Danh mục</th>
                    <th className="py-3 px-4">Giá bán</th>
                    <th className="py-3 px-4">Tồn kho</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        Không tìm thấy sản phẩm nào trong kho.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.productId} className="hover:bg-gray-50/80 transition">
                        {/* Ảnh & Tên */}
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 line-clamp-1 max-w-xs">{p.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono">ID: {p.productId.slice(0, 8)}</p>
                          </div>
                        </td>

                        {/* Danh mục */}
                        <td className="py-3 px-4 text-gray-600">
                          {p.categoryName || "Đang cập nhật"}
                        </td>

                        {/* Giá */}
                        <td className="py-3 px-4 font-bold text-nexus-700">
                          {fmtVND(p.price)}
                        </td>

                        {/* Tồn kho */}
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${p.stockQuantity <= 5 ? "text-red-500" : "text-gray-800"}`}>
                            {p.stockQuantity} cái
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3 px-4">
                          {p.stockQuantity > 0 ? (
                            <span className="bg-emerald-50 text-emerald-600 font-semibold text-[11px] px-2.5 py-0.5 rounded-full">
                              Đang bán
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-500 font-semibold text-[11px] px-2.5 py-0.5 rounded-full">
                              Hết hàng
                            </span>
                          )}
                        </td>

                        {/* Hành động */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-nexus-600 hover:bg-nexus-50 rounded-lg transition"
                              title="Chỉnh sửa sản phẩm"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc chắn muốn xóa "${p.name}"?`)) {
                                  deleteMutation.mutate(p.productId);
                                }
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: QUẢN LÝ ĐƠN HÀNG CỦA SHOP ────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Quản lý đơn đặt hàng</h2>
                <p className="text-xs text-gray-500 mt-0.5">Xác nhận và chuẩn bị hàng để bàn giao cho bưu tá</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-gray-200 pb-3 mb-6 overflow-x-auto text-xs font-semibold">
              {[
                { key: "all", label: "Tất cả đơn" },
                { key: "Pending", label: "Chờ xác nhận" },
                { key: "Processing", label: "Đang đóng gói" },
                { key: "Shipped", label: "Đang vận chuyển" },
                { key: "Delivered", label: "Đã giao thành công" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setOrderFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                    orderFilter === f.key
                      ? "bg-nexus-600 text-white font-bold"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Không có đơn hàng nào ở trạng thái này.
                </div>
              ) : (
                filteredOrders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-5 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{ord.orderId}</span>
                        <span className="text-xs text-gray-400">• Đặt lúc: {ord.createdAt}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.status === "Pending"
                              ? "bg-amber-100 text-amber-700"
                              : ord.status === "Processing"
                              ? "bg-blue-100 text-blue-700"
                              : ord.status === "Shipped"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {ord.status === "Pending" && "Chờ xác nhận"}
                          {ord.status === "Processing" && "Đang đóng gói"}
                          {ord.status === "Shipped" && "Đang vận chuyển"}
                          {ord.status === "Delivered" && "Giao thành công"}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 font-medium">
                        Khách hàng: <b>{ord.customerName}</b> ({ord.customerPhone})
                      </p>
                      <p className="text-xs text-gray-500">
                        Sản phẩm: {ord.productName} (x{ord.quantity})
                      </p>
                      <p className="text-sm font-extrabold text-nexus-700">
                        Tổng tiền: {fmtVND(ord.totalAmount)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {ord.status === "Pending" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.orderId, "Processing")}
                          className="flex items-center gap-1 px-4 py-2 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          <CheckCircle size={14} /> Xác nhận đơn
                        </button>
                      )}

                      {ord.status === "Processing" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.orderId, "Shipped")}
                          className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          <Truck size={14} /> Bàn giao bưu tá
                        </button>
                      )}

                      <button
                        onClick={() => toast("Đã xuất phiếu giao hàng GHN/GHTK thành công!", { icon: "📄" })}
                        className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-medium transition"
                      >
                        In phiếu gửi
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: CÀI ĐẶT GIAN HÀNG ───────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Cài đặt hồ sơ Gian Hàng</h2>
            <p className="text-xs text-gray-500 mb-6">Thông tin công khai của Shop trên sàn Nexus</p>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tên gian hàng</label>
                <input
                  type="text"
                  defaultValue={shopName}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-nexus-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hotline chăm sóc khách hàng</label>
                <input
                  type="tel"
                  defaultValue={shopInfo?.hotline || "0901234567"}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-nexus-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ kho lấy hàng</label>
                <input
                  type="text"
                  defaultValue={shopInfo?.warehouseAddress || "Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh"}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-nexus-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tài khoản ngân hàng đối soát</label>
                <input
                  type="text"
                  disabled
                  defaultValue={`${shopInfo?.bankName || "Vietcombank"} - ${shopInfo?.bankAccountNumber || "0123456789"} (${shopInfo?.bankAccountName || "NEXUS SELLER"})`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => toast.success("Đã cập nhật cài đặt Shop!")}
                  className="px-6 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL THÊM / SỬA SẢN PHẨM ──────────────────────────────────────── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingProduct ? "Chỉnh sửa sản phẩm" : "Đăng bán sản phẩm mới"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs sm:text-sm">
              {/* Tên sản phẩm */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ví dụ: Bàn phím cơ không dây, iPhone 15..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-nexus-400"
                />
              </div>

              {/* Giá & Tồn kho */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="2500000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-nexus-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Số lượng trong kho *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-nexus-400"
                  />
                </div>
              </div>

              {/* Danh mục */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Danh mục sản phẩm *</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-nexus-400 bg-white"
                >
                  <option value="">-- Chọn danh mục phù hợp --</option>
                  {categories?.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Link hình ảnh */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Đường dẫn hình ảnh (URL)</label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-nexus-400"
                />
              </div>

              {/* Mô tả sản phẩm */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Mô tả công năng, chất liệu, phụ kiện đi kèm..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-nexus-400 resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Đang lưu..."
                    : editingProduct
                    ? "Cập nhật sản phẩm"
                    : "Đăng sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
