// ============================================================
// Trang chi tiết sản phẩm - thông tin đầy đủ + thêm vào giỏ & mua ngay
// Bao gồm: Image Gallery, Shop Info, Trust Badges, Reviews
// ============================================================
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProduct } from "@shared/api/catalog";
import { addToCart } from "@shared/api/commerce";
import { useAuth } from "@app/providers/AuthContext";
import { useCart } from "@app/providers/CartContext";
import LoadingSpinner from "@shared/ui/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Zap,
  Store,
  MessageCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  Clock,
  Star,
  CheckCircle2,
  Share2,
  Heart,
} from "lucide-react";
import { useState, useMemo } from "react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { addToGuestCart } = useCart();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"desc" | "reviews">("desc");
  const [isLiked, setIsLiked] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  // Tạo danh sách ảnh cho gallery
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const base = product.imageUrl;
    if (!base) return [];
    // Nếu API có mảng images thì dùng, nếu không tạo các góc nhìn mô phỏng
    return [
      base,
      `${base}?view=side`,
      `${base}?view=back`,
      `${base}?view=detail`,
    ];
  }, [product]);

  const currentImage = galleryImages[selectedImageIndex] || product?.imageUrl;

  // Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      if (isLoggedIn) {
        await addToCart({
          productId: product.productId,
          productName: product.name,
          unitPrice: product.price,
          quantity,
          imageUrl: product.imageUrl,
          stockQuantity: product.stockQuantity,
        });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ!`);
      } else {
        addToGuestCart({
          productId: product.productId,
          productName: product.name,
          price: product.price,
          quantity,
          imageUrl: product.imageUrl,
          stockQuantity: product.stockQuantity,
        });
        toast.success(`Đã thêm vào giỏ hàng! Đăng nhập để lưu đơn.`, {
          icon: "🛒",
        });
      }
    } catch {
      toast.error("Không thể thêm vào giỏ, hãy thử lại.");
    } finally {
      setAdding(false);
    }
  };

  // Mua ngay: Thêm vào giỏ và chuyển thẳng sang Checkout với sản phẩm đã chọn
  const handleBuyNow = async () => {
    if (!product) return;
    setBuyingNow(true);
    try {
      const singleItem = {
        productId: product.productId,
        productName: product.name,
        unitPrice: product.price,
        quantity,
        subtotal: product.price * quantity,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
      };

      if (isLoggedIn) {
        await addToCart({
          productId: product.productId,
          productName: product.name,
          unitPrice: product.price,
          quantity,
          imageUrl: product.imageUrl,
          stockQuantity: product.stockQuantity,
        });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        navigate("/checkout", { state: { selectedItems: [singleItem] } });
      } else {
        addToGuestCart({
          productId: product.productId,
          productName: product.name,
          price: product.price,
          quantity,
          imageUrl: product.imageUrl,
          stockQuantity: product.stockQuantity,
        });
        navigate("/login", {
          state: {
            from: "/checkout",
            selectedItems: [singleItem],
          },
        });
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBuyingNow(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Package size={56} className="mx-auto text-gray-300 mb-3" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy sản phẩm này</h2>
        <p className="text-gray-500 mb-6 text-sm">Sản phẩm có thể đã bị gỡ hoặc đường dẫn không chính xác.</p>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-sm font-medium transition"
        >
          Trở về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-nexus-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsLiked(!isLiked);
                toast.success(!isLiked ? "Đã lưu vào danh sách yêu thích" : "Đã bỏ yêu thích");
              }}
              className={`p-2 rounded-lg border transition ${
                isLiked ? "text-red-500 bg-red-50 border-red-200" : "text-gray-500 bg-white border-gray-200 hover:text-red-500"
              }`}
              title="Yêu thích"
            >
              <Heart size={18} className={isLiked ? "fill-red-500" : ""} />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Đã sao chép liên kết sản phẩm!");
              }}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-nexus-600 transition"
              title="Chia sẻ"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Main Product Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* ── CỘT TRÁI: Image Gallery ─────────────────────────────────── */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Main Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center group">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.style.display = "none";
                      t.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl">📦</div>';
                    }}
                  />
                ) : (
                  <Package size={80} className="text-nexus-200" />
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="bg-nexus-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <CheckCircle2 size={12} /> Chính hãng 100%
                  </span>
                  {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                    <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      Chỉ còn {product.stockQuantity} sản phẩm
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails row */}
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-gray-50 ${
                        selectedImageIndex === idx
                          ? "border-nexus-600 shadow-sm scale-105"
                          : "border-gray-200 hover:border-nexus-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Ảnh ${idx + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.src = product.imageUrl || "";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
                  <Truck size={18} className="text-nexus-600 shrink-0" />
                  <span>Miễn phí giao hàng đơn từ 200k</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
                  <RotateCcw size={18} className="text-nexus-600 shrink-0" />
                  <span>7 ngày đổi trả nếu có lỗi</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>Bảo hành chính hãng 12 tháng</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
                  <Clock size={18} className="text-amber-500 shrink-0" />
                  <span>Hỗ trợ tư vấn 24/7</span>
                </div>
              </div>
            </div>

            {/* ── CỘT PHẢI: Thông tin sản phẩm & Mua hàng ──────────────────── */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                {/* Category & Status */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {product.categoryName && (
                    <span className="text-xs font-semibold bg-nexus-100 text-nexus-700 px-3 py-1 rounded-full">
                      {product.categoryName}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-gray-800">4.9</span>
                    <span className="text-gray-400">(148 đánh giá)</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500">Đã bán 890+</span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
                  {product.name}
                </h1>

                {/* Price block */}
                <div className="p-4 rounded-2xl bg-nexus-50/70 border border-nexus-100 mb-6 flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-nexus-700 tracking-tight">
                    {fmtVND(product.price)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {fmtVND(Math.round(product.price * 1.15 / 1000) * 1000)}
                  </span>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                    -15%
                  </span>
                </div>

                {/* Description snippet */}
                <div className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-3">
                  {product.description || "Sản phẩm chính hãng với chất lượng đảm bảo, đầy đủ tem mác bảo hành và phụ kiện đi kèm theo tiêu chuẩn của nhà sản xuất."}
                </div>

                {/* Stock status */}
                <div className="flex items-center gap-2 text-sm mb-6">
                  <span className="text-gray-500">Tình trạng kho:</span>
                  {product.stockQuantity > 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Còn hàng ({product.stockQuantity} sản phẩm)
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold bg-red-50 px-2.5 py-0.5 rounded-full text-xs">
                      Tạm hết hàng
                    </span>
                  )}
                </div>

                {/* Quantity selector */}
                {product.stockQuantity > 0 && (
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3.5 py-2 hover:bg-gray-100 transition-colors text-gray-600 text-base font-bold"
                      >
                        −
                      </button>
                      <span className="px-4 py-2 text-sm font-semibold min-w-[48px] text-center text-gray-800">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                        className="px-3.5 py-2 hover:bg-gray-100 transition-colors text-gray-600 text-base font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Thêm vào giỏ & Mua ngay */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Button 1: Thêm vào giỏ */}
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stockQuantity === 0 || adding}
                    className="flex items-center justify-center gap-2 border-2 border-nexus-600 text-nexus-600 hover:bg-nexus-50 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-bold py-3.5 px-5 rounded-2xl transition-all text-sm sm:text-base shadow-sm"
                  >
                    <ShoppingCart size={18} />
                    {adding ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                  </button>

                  {/* Button 2: Mua ngay */}
                  <button
                    onClick={handleBuyNow}
                    disabled={product.stockQuantity === 0 || buyingNow}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 px-5 rounded-2xl transition-all text-sm sm:text-base shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    <Zap size={18} className="fill-white" />
                    {buyingNow ? "Đang chuyển hướng..." : "Mua ngay"}
                  </button>
                </div>

                {!isLoggedIn && product.stockQuantity > 0 && (
                  <p className="text-xs text-gray-400 text-center">
                    💡 Khách vãng lai vẫn có thể đặt hàng trực tiếp hoặc thêm vào giỏ.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── KHỐI THÔNG TIN SHOP / SELLER ───────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-nexus-700 to-nexus-500 text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-md">
              <Store size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-lg">Nexus Official Store</h3>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Official
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Online 10 phút trước • Phản hồi 99%</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                <span>Đánh giá: <b className="text-gray-900">4.9 / 5.0</b></span>
                <span>Sản phẩm: <b className="text-gray-900">120+</b></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => toast("Tính năng chat với shop đang được kết nối!", { icon: "💬" })}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 border border-nexus-600 text-nexus-600 rounded-xl text-xs font-semibold hover:bg-nexus-50 transition"
            >
              <MessageCircle size={15} /> Chat ngay
            </button>
            <Link
              to="/"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
            >
              <Store size={15} /> Xem Shop
            </Link>
          </div>
        </div>

        {/* ── TABS: MÔ TẢ CHI TIẾT & ĐÁNH GIÁ SẢN PHẨM ───────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex border-b border-gray-100 mb-6 gap-8">
            <button
              onClick={() => setActiveTab("desc")}
              className={`pb-3 font-bold text-base transition-colors relative ${
                activeTab === "desc" ? "text-nexus-600" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              Mô tả chi tiết
              {activeTab === "desc" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-nexus-600 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 font-bold text-base transition-colors relative ${
                activeTab === "reviews" ? "text-nexus-600" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              Đánh giá từ khách hàng (148)
              {activeTab === "reviews" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-nexus-600 rounded-full"></span>
              )}
            </button>
          </div>

          {activeTab === "desc" ? (
            <div className="prose max-w-none text-gray-700 text-sm leading-relaxed space-y-4">
              <p>{product.description || "Sản phẩm được nhập khẩu và phân phối chính thức bởi Nexus Marketplace."}</p>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
                <div className="grid grid-cols-3 py-1.5 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Mã sản phẩm</span>
                  <span className="col-span-2 text-gray-900 font-mono">{product.productId}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Danh mục</span>
                  <span className="col-span-2 text-gray-900">{product.categoryName || "Đang cập nhật"}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5">
                  <span className="text-gray-500 font-medium">Thời gian tạo</span>
                  <span className="col-span-2 text-gray-900">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString("vi-VN") : "Gần đây"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Review summary */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-amber-500">4.9</div>
                  <div className="flex text-amber-400 text-xs justify-center mt-1">★★★★★</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">148 đánh giá</div>
                </div>
                <div className="flex-1 text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <span>5 sao</span>
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full w-[90%]"></div>
                    </div>
                    <span>90%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>4 sao</span>
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full w-[8%]"></div>
                    </div>
                    <span>8%</span>
                  </div>
                </div>
              </div>

              {/* Sample Reviews */}
              <div className="divide-y divide-gray-100">
                {[
                  { name: "Nguyễn Văn H.", date: "Hôm qua", rating: 5, comment: "Đóng gói rất cẩn thận, sản phẩm đúng như mô tả, giao hàng nhanh 2 ngày là nhận được. Rất hài lòng!" },
                  { name: "Trần Thị M.", date: "3 ngày trước", rating: 5, comment: "Hàng chính hãng chuẩn xịn, có tem mác đầy đủ. Shop tư vấn nhiệt tình." },
                  { name: "Lê Minh K.", date: "1 tuần trước", rating: 4, comment: "Dùng ổn trong tầm giá, nhân viên giao hàng lịch sự." },
                ].map((rev, i) => (
                  <div key={i} className="py-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-800">{rev.name}</span>
                      <span className="text-xs text-gray-400">{rev.date}</span>
                    </div>
                    <div className="text-amber-400 text-xs">{"★".repeat(rev.rating)}</div>
                    <p className="text-sm text-gray-600">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

