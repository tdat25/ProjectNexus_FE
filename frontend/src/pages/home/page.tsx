import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { getProducts, getCategories } from "@shared/api/catalog";
import { getAuctions } from "@shared/api/auction";
import { addToCart, getCart } from "@shared/api/commerce";
import { useAuth } from "@app/providers/AuthContext";
import { useCart } from "@app/providers/CartContext";
import ProductCard from "@shared/ui/ProductCard";
import LoadingSpinner from "@shared/ui/LoadingSpinner";
import toast from "react-hot-toast";
import {
  Flame,
  Tag,
  ChevronRight,
  Gavel,
  Shield,
  Truck,
  RotateCcw,
  Clock,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Sparkles,
  ShoppingCart,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

// Category emoji icons
const CAT_ICONS: Record<string, string> = {
  "Laptop": "💻", "Điện thoại": "📱", "Gia dụng": "🏠", "Thời trang": "👗",
  "Đồ chơi": "🧸", "Sách": "📚", "Thể thao": "⚽", "Mỹ phẩm": "💄",
  "Đồng hồ": "⌚", "Túi xách": "👜", "Giày dép": "👟", "Thực phẩm": "🥗",
  "Điện tử": "🔌", "Nội thất": "🛋️", "Xe cộ": "🚗",
};
const defaultCatIcon = "🛍️";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const POPULAR_KEYWORDS = ["Laptop", "Điện thoại", "Tai nghe", "Bàn phím", "Đồng hồ", "Gia dụng"];

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  const { addToGuestCart, guestCart, guestCartCount } = useCart();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query giỏ hàng backend cho logged in user
  const { data: backendCart } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isLoggedIn,
    staleTime: 5000,
  });

  const backendCartItems = backendCart?.items ?? [];
  const backendCartCount = backendCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const backendProductIds = new Set(backendCartItems.map((item) => item.productId));
  const pendingGuestCount = guestCart
    .filter((item) => !backendProductIds.has(item.productId))
    .reduce((sum, item) => sum + item.quantity, 0);
  const totalCartCount = isLoggedIn
    ? backendCartCount + pendingGuestCount
    : guestCartCount;

  // Coordinated focal micro-interaction for cart acknowledgment
  const [isCartBumping, setIsCartBumping] = useState(false);
  const triggerCartBump = () => {
    setIsCartBumping(true);
    setTimeout(() => setIsCartBumping(false), 400);
  };

  const prevCountRef = useRef(totalCartCount);
  useEffect(() => {
    if (totalCartCount > prevCountRef.current) {
      triggerCartBump();
    }
    prevCountRef.current = totalCartCount;
  }, [totalCartCount]);

  const urlSearch = searchParams.get("search") ?? "";
  const urlCat = searchParams.get("cat") ?? "";
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Lọc giá & sắp xếp (Client side filter & sort)
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "name">("default");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [showAuctionGuide, setShowAuctionGuide] = useState(false);

  // Flash sale countdown timer
  const [flashSaleSeconds, setFlashSaleSeconds] = useState(3 * 3600 + 42 * 60 + 15);
  useEffect(() => {
    const timer = setInterval(() => {
      setFlashSaleSeconds((prev) => (prev > 0 ? prev - 1 : 4 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fsHours = String(Math.floor(flashSaleSeconds / 3600)).padStart(2, "0");
  const fsMinutes = String(Math.floor((flashSaleSeconds % 3600) / 60)).padStart(2, "0");
  const fsSecs = String(flashSaleSeconds % 60).padStart(2, "0");

  // Reset về trang 1 khi filter đổi
  useEffect(() => {
    setPage(1);
  }, [urlSearch, urlCat, priceRange, sortBy]);

  // Query danh sách sản phẩm
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", page, urlSearch, urlCat],
    queryFn: () =>
      getProducts({
        page,
        pageSize: PAGE_SIZE,
        search: urlSearch || undefined,
        categoryId: urlCat || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  // Query danh mục
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Query các phiên đấu giá nổi bật
  const { data: hotAuctions } = useQuery({
    queryKey: ["hot-auctions"],
    queryFn: () => getAuctions({ status: "Active", pageSize: 4 }),
    staleTime: 60 * 1000,
  });

  const handleAddToCart = async (productId: string) => {
    const product = data?.items?.find((p) => p.productId === productId);
    if (!isLoggedIn) {
      if (product) {
        addToGuestCart({
          productId: product.productId,
          productName: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
          stockQuantity: product.stockQuantity,
        });
        triggerCartBump();
        toast((t) => (
          <div className="flex items-center justify-between gap-3 min-w-[240px]">
            <span className="text-sm font-semibold text-slate-800">Đã thêm vào giỏ hàng!</span>
            <Link
              to="/cart"
              onClick={() => toast.dismiss(t.id)}
              className="text-xs font-bold bg-nexus-600 hover:bg-nexus-700 text-white px-3 py-1.5 rounded-lg transition shrink-0 shadow-sm"
            >
              Xem giỏ hàng →
            </Link>
          </div>
        ), { icon: "🛒", duration: 4000 });
      }
      return;
    }
    try {
      await addToCart({
        productId,
        productName: product?.name ?? "",
        unitPrice: product?.price ?? 0,
        quantity: 1,
        imageUrl: product?.imageUrl,
        stockQuantity: product?.stockQuantity,
      });
      triggerCartBump();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast((t) => (
        <div className="flex items-center justify-between gap-3 min-w-[240px]">
          <span className="text-sm font-semibold text-slate-800">Đã thêm vào giỏ hàng!</span>
          <Link
            to="/cart"
            onClick={() => toast.dismiss(t.id)}
            className="text-xs font-bold bg-nexus-600 hover:bg-nexus-700 text-white px-3 py-1.5 rounded-lg transition shrink-0 shadow-sm"
          >
            Xem giỏ hàng →
          </Link>
        </div>
      ), { icon: "🛒", duration: 4000 });
    } catch {
      toast.error("Không thể thêm vào giỏ, hãy thử lại");
    }
  };

  // Áp dụng lọc khoảng giá và sắp xếp
  const processedProducts = useMemo(() => {
    if (!data?.items) return [];
    let list = [...data.items];

    // Lọc giá
    if (priceRange === "under-1m") {
      list = list.filter((p) => p.price < 1_000_000);
    } else if (priceRange === "1m-5m") {
      list = list.filter((p) => p.price >= 1_000_000 && p.price <= 5_000_000);
    } else if (priceRange === "5m-15m") {
      list = list.filter((p) => p.price >= 5_000_000 && p.price <= 15_000_000);
    } else if (priceRange === "over-15m") {
      list = list.filter((p) => p.price > 15_000_000);
    }

    // Sắp xếp
    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [data?.items, priceRange, sortBy]);

  const totalPages = Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE);
  const isFiltered = !!urlSearch || !!urlCat || priceRange !== "all" || sortBy !== "default";
  const activeCatName = categories?.find((c) => c.categoryId === urlCat)?.name ?? "";

  const resetAllFilters = () => {
    setSearchParams({});
    setPriceRange("all");
    setSortBy("default");
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Hero / Promo Banner ────────────────────────────────────────── */}
      {!urlSearch && !urlCat && (
        <div className="bg-nexus-800 bg-gradient-to-r from-nexus-800 via-nexus-700 to-nexus-500 py-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
            <div className="text-white flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-nexus-200 text-xs font-bold mb-3">
                <Sparkles size={14} /> SÀN THƯƠNG MẠI & ĐẤU GIÁ HÀNG ĐẦU
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">
                Nexus Marketplace
              </h1>
              <p className="text-nexus-100 text-base mb-6 max-w-lg leading-relaxed">
                Mua sắm thông minh, tham gia đấu giá trực tuyến và nhận ưu đãi độc quyền. Giao nhanh toàn quốc, cam kết chính hãng 100%.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/auctions"
                  className="bg-white text-nexus-700 hover:bg-nexus-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Gavel size={16} /> Khám phá sàn đấu giá
                </Link>
                <button
                  onClick={() => setSearchParams({ search: "laptop" })}
                  className="border border-white/40 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-white/10 transition-colors"
                >
                  Sản phẩm công nghệ →
                </button>
              </div>
            </div>
            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {[
                { icon: <Truck size={18} />, label: "Giao hàng toàn quốc", sub: "Đơn hàng từ 30.000đ" },
                { icon: <Shield size={18} />, label: "Bảo đảm chính hãng", sub: "Cam kết 100% authentic" },
                { icon: <RotateCcw size={18} />, label: "Đổi trả trong 7 ngày", sub: "Miễn phí nếu lỗi từ shop" },
                { icon: <Tag size={18} />, label: "Giá cả cạnh tranh", sub: "So sánh giá tốt nhất thị trường" },
              ].map((b) => (
                <div
                  key={b.label}
                  className="bg-white/10 backdrop-blur rounded-2xl p-3 flex items-center gap-2 text-white border border-white/10"
                >
                  <span className="text-nexus-200">{b.icon}</span>
                  <div>
                    <p className="text-xs font-semibold">{b.label}</p>
                    <p className="text-[10px] text-nexus-200">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ── Category Icons Grid ────────────────────────────────────────── */}
        {!urlSearch && !urlCat && categories && categories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-base">Danh mục sản phẩm nổi bật</h2>
              <span className="text-xs text-gray-400 font-medium">
                {categories.length} ngành hàng
              </span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {categories.map((c) => (
                <button
                  key={c.categoryId}
                  onClick={() => setSearchParams({ cat: c.categoryId })}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-nexus-50 transition-colors group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {CAT_ICONS[c.name] ?? defaultCatIcon}
                  </span>
                  <span className="text-[10px] text-gray-600 text-center leading-tight line-clamp-2 font-medium">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Flash Sale với Countdown Timer ────────────────────────────── */}
        {!urlSearch && !urlCat && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-black text-red-600 text-lg flex items-center gap-2 tracking-tight">
                  <Flame size={22} className="text-red-600 fill-red-600" />
                  <span>FLASH SALE</span>
                </h2>
                {/* Countdown Timer */}
                <div className="flex items-center gap-1 text-xs font-mono font-bold">
                  <span className="bg-gray-900 text-white px-2 py-1 rounded-md">{fsHours}</span>
                  <span className="text-gray-900">:</span>
                  <span className="bg-gray-900 text-white px-2 py-1 rounded-md">{fsMinutes}</span>
                  <span className="text-gray-900">:</span>
                  <span key={fsSecs} className="bg-red-600 text-white px-2 py-1 rounded-md animate-second-tick inline-block">{fsSecs}</span>
                </div>
              </div>

              <Link
                to="/?cat="
                className="text-xs text-nexus-600 hover:text-nexus-700 font-semibold flex items-center gap-0.5"
              >
                Xem tất cả ưu đãi <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {data?.items.slice(0, 5).map((p, idx) => {
                const discount = 15 + (idx * 7) % 25;
                const soldPercent = 35 + (idx * 15) % 60;
                return (
                  <Link
                    key={p.productId}
                    to={`/products/${p.productId}`}
                    className="group relative bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-red-200 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                      -{discount}%
                    </div>
                    <div className="h-32 overflow-hidden bg-white">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-nexus-50">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-700 line-clamp-2 leading-tight mb-2 font-medium">
                        {p.name}
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-red-600">
                          {fmtVND(p.price)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2.5">
                        <div className="h-1.5 w-full bg-red-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                            style={{ width: `${soldPercent}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          Đã bán {soldPercent}%
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── KHỐI SẢN PHẨM ĐẤU GIÁ NỔI BẬT (HOT AUCTIONS) ──────────────── */}
        {!urlSearch && !urlCat && hotAuctions?.items && hotAuctions.items.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-900 via-nexus-900 to-slate-900 rounded-2xl shadow-md p-5 sm:p-6 mb-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400 text-gray-900 rounded-xl shadow-sm">
                  <Gavel size={20} />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
                    Sàn Đấu Giá Trực Tuyến Nổi Bật
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-subtle"></span> LIVE
                    </span>
                  </h2>
                  <p className="text-xs text-indigo-200">Đặt giá nhanh, sở hữu món đồ độc nhất với giá hời!</p>
                </div>
              </div>
              <Link
                to="/auctions"
                className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 self-start sm:self-auto bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
              >
                Xem tất cả {hotAuctions.total} phiên đấu giá <ChevronRight size={14} />
              </Link>
            </div>

            {/* Onboarding Guide: Hướng dẫn 3 bước cho người mới tham gia đấu giá */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-3.5 mb-5 border border-white/15 text-xs">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowAuctionGuide((v) => !v)}
              >
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <HelpCircle size={16} />
                  <span>Người mới tham gia đấu giá? Xem nhanh 3 bước để thắng thầu</span>
                </div>
                <span className="text-[11px] text-indigo-200 hover:text-white underline font-medium">
                  {showAuctionGuide ? "Thu gọn ▲" : "Xem hướng dẫn ▼"}
                </span>
              </div>
              {showAuctionGuide && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/15 text-indigo-100">
                  <div className="flex items-start gap-2.5 bg-black/20 p-2.5 rounded-lg border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-gray-900 font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <p className="font-semibold text-white">Chọn món & Đặt thầu</p>
                      <p className="text-[11px] text-indigo-200 mt-0.5">Đặt mức giá cao hơn giá hiện tại theo bước giá quy định của phiên.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-black/20 p-2.5 rounded-lg border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-gray-900 font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <p className="font-semibold text-white">Theo dõi trực tiếp</p>
                      <p className="text-[11px] text-indigo-200 mt-0.5">Hệ thống thông báo tức thì khi có người tham gia nâng mức giá thầu.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-black/20 p-2.5 rounded-lg border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-gray-900 font-black text-xs flex items-center justify-center shrink-0">3</span>
                    <div>
                      <p className="font-semibold text-white">Thắng thầu & Nhận hàng</p>
                      <p className="text-[11px] text-indigo-200 mt-0.5">Khi đồng hồ đếm về 0, người trả giá cao nhất sẽ thanh toán và nhận hàng an toàn.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hotAuctions.items.slice(0, 4).map((auc) => (
                <div
                  key={auc.id}
                  className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10 flex flex-col justify-between hover:bg-white/15 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-indigo-200 mb-2">
                      <span className="font-mono">Mã #{auc.id.slice(0, 8)}</span>
                      <span className="text-amber-300 font-semibold flex items-center gap-1">
                        <Clock size={12} /> Sắp kết thúc
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white line-clamp-1 mb-3 group-hover:text-amber-300 transition-colors">
                      Phiên đấu giá #{auc.id.slice(0, 6).toUpperCase()}
                    </p>
                    <div className="bg-black/30 rounded-lg p-2.5 mb-3 space-y-1">
                      <div className="text-[11px] text-gray-300">Giá hiện tại:</div>
                      <div className="text-lg font-extrabold text-amber-400">
                        {fmtVND(auc.currentPrice)}
                      </div>
                      <div className="text-[10px] text-indigo-200 flex justify-between">
                        <span>Khởi điểm: {fmtVND(auc.startingPrice)}</span>
                        <span>{auc.totalBids} lượt đặt giá</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/auctions/${auc.id}`}
                    className="w-full text-center py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 font-bold text-xs rounded-lg transition shadow-sm"
                  >
                    Tham gia đấu giá ngay
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BỘ LỌC NÂNG CAO & DANH SÁCH SẢN PHẨM ───────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
                {urlSearch ? (
                  <>
                    Kết quả tìm kiếm cho: "<span className="text-nexus-600">{urlSearch}</span>"
                  </>
                ) : urlCat ? (
                  <>
                    Danh mục: <span className="text-nexus-600">{activeCatName}</span>
                  </>
                ) : (
                  <>
                    <Tag size={18} className="text-nexus-600" /> Gợi ý hôm nay
                  </>
                )}
              </h2>
              {processedProducts.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Hiển thị {processedProducts.length} sản phẩm
                </p>
              )}
            </div>

            {/* Filter controls row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Lọc mức giá */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <SlidersHorizontal size={14} className="text-gray-400" />
                <span className="font-semibold text-gray-700">Khoảng giá:</span>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 outline-none focus:ring-1 focus:ring-nexus-500 font-medium cursor-pointer"
                >
                  <option value="all">Tất cả mức giá</option>
                  <option value="under-1m">Dưới 1 triệu</option>
                  <option value="1m-5m">1 triệu - 5 triệu</option>
                  <option value="5m-15m">5 triệu - 15 triệu</option>
                  <option value="over-15m">Trên 15 triệu</option>
                </select>
              </div>

              {/* Sắp xếp */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <ArrowUpDown size={14} className="text-gray-400" />
                <span className="font-semibold text-gray-700">Sắp xếp theo:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 outline-none focus:ring-1 focus:ring-nexus-500 font-medium cursor-pointer"
                >
                  <option value="default">Phổ biến nhất</option>
                  <option value="price-asc">Giá: Thấp đến cao</option>
                  <option value="price-desc">Giá: Cao đến thấp</option>
                  <option value="name">Tên sản phẩm: A - Z</option>
                </select>
              </div>

              {/* Nút Đặt lại bộ lọc */}
              {isFiltered && (
                <button
                  onClick={resetAllFilters}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 transition flex items-center gap-1"
                >
                  <span>✕</span> Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Product Grid Content */}
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <div className="text-center py-16 px-4 max-w-sm mx-auto">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1">Không thể tải danh sách sản phẩm</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Kết nối tới máy chủ bị gián đoạn. Vui lòng kiểm tra lại đường truyền và thử tải lại.
              </p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
                className="px-4 py-2 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
              >
                Thử tải lại dữ liệu
              </button>
            </div>
          ) : processedProducts.length === 0 ? (
            /* ── CẢI TIẾN EMPTY STATE KHI KHÔNG TÌM THẤY KẾT QUẢ ─────────── */
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-nexus-50 text-nexus-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <Search size={30} />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5 leading-relaxed">
                Rất tiếc, chúng tôi không tìm thấy kết quả nào với tiêu chí bạn chọn. Hãy thử tìm từ khóa khác hoặc điều chỉnh lại mức giá.
              </p>

              {/* Gợi ý từ khóa hot */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-md mx-auto">
                <span className="text-xs text-gray-400 font-medium">Gợi ý tìm kiếm:</span>
                {POPULAR_KEYWORDS.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => {
                      setSearchParams({ search: kw });
                      setPriceRange("all");
                    }}
                    className="text-xs bg-gray-100 hover:bg-nexus-50 hover:text-nexus-600 text-gray-600 px-3 py-1 rounded-full transition"
                  >
                    {kw}
                  </button>
                ))}
              </div>

              <button
                onClick={resetAllFilters}
                className="px-5 py-2 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <>
              {/* Product Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {processedProducts.map((p) => (
                  <ProductCard key={p.productId} product={p} onAddToCart={handleAddToCart} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-nexus-50 transition-colors"
                  >
                    ‹ Trước
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          p === page ? "bg-nexus-600 text-white font-bold" : "border hover:bg-nexus-50"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-nexus-50 transition-colors"
                  >
                    Tiếp ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Action Button: Nút xem giỏ hàng nhanh với micro-interaction */}
      <Link
        to="/cart"
        className={`fixed bottom-6 right-6 z-40 bg-nexus-600 hover:bg-nexus-700 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-xl shadow-nexus-900/15 flex items-center gap-2.5 transition-all duration-200 active:scale-95 group border border-white/20 ${
          isCartBumping ? "animate-cart-bump" : ""
        }`}
        title="Xem giỏ hàng của bạn"
        id="home-floating-cart-btn"
      >
        <div className="relative">
          <ShoppingCart size={22} className="group-hover:rotate-6 transition-transform duration-200" />
          {totalCartCount > 0 && (
            <span
              key={totalCartCount}
              className={`absolute -top-2.5 -right-2.5 bg-red-600 text-white text-xs font-black rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-white shadow-sm ${
                isCartBumping ? "animate-badge-pop" : ""
              }`}
            >
              {totalCartCount > 99 ? "99+" : totalCartCount}
            </span>
          )}
        </div>
        <span className="hidden sm:inline font-bold text-sm tracking-wide">
          Xem giỏ hàng {totalCartCount > 0 && `(${totalCartCount})`}
        </span>
      </Link>
    </div>
  );
}

