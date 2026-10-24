// ============================================================
// Trang giỏ hàng chuẩn thương mại điện tử
// Hỗ trợ cả Guest (localStorage) và Logged-in (CommerceService/Fallback)
// Tính năng: Checkbox chọn món, tăng/giảm số lượng, kiểm tra tồn kho,
// tính tổng tiền theo món chọn, xóa từng món, xóa tất cả, điều hướng checkout
// ============================================================

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  type CartItem,
} from "@shared/api/commerce";
import { useAuth } from "@app/providers/AuthContext";
import { useCart, type GuestCartItem } from "@app/providers/CartContext";
import LoadingSpinner from "@shared/ui/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldCheck,
  Truck,
  AlertCircle,
  LogIn,
  RotateCcw,
} from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

// Interface thống nhất cho Cart Item giữa Guest và Logged-in
interface UnifiedCartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
  stockQuantity: number;
}

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuth();
  const {
    guestCart,
    updateGuestCartQuantity,
    removeFromGuestCart,
    clearGuestCart,
  } = useCart();

  // State cho checkbox chọn sản phẩm thanh toán
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Modal xác nhận xóa toàn bộ
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── Query giỏ hàng backend cho user đã đăng nhập ──────────────────────────
  const {
    data: backendCart,
    isLoading: backendLoading,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isLoggedIn,
    staleTime: 5000,
  });

  // ── Chuyển đổi sang UnifiedCartItem[] ────────────────────────────────────
  const items: UnifiedCartItem[] = useMemo(() => {
    if (isLoggedIn) {
      if (!backendCart?.items) return [];
      return backendCart.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        price: i.unitPrice,
        quantity: i.quantity,
        subtotal: i.subtotal || i.unitPrice * i.quantity,
        imageUrl: i.imageUrl,
        stockQuantity: i.stockQuantity ?? 25,
      }));
    } else {
      return guestCart.map((i: GuestCartItem) => ({
        productId: i.productId,
        productName: i.productName,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
        imageUrl: i.imageUrl,
        stockQuantity: i.stockQuantity ?? 25,
      }));
    }
  }, [isLoggedIn, backendCart?.items, guestCart]);

  // Tự động chọn tất cả sản phẩm khi vừa tải danh sách lần đầu
  useEffect(() => {
    if (items.length > 0) {
      setSelectedIds((prev) => {
        // Giữ lại các id còn tồn tại, nếu danh sách rỗng thì tick all
        const valid = prev.filter((id) => items.some((i) => i.productId === id));
        if (valid.length === 0 && prev.length === 0) {
          return items.map((i) => i.productId);
        }
        return valid;
      });
    } else {
      setSelectedIds([]);
    }
  }, [items]);

  // ── Mutations cho logged-in user ─────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    },
    onError: () => toast.error("Không thể xóa sản phẩm, vui lòng thử lại"),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateCartItemQuantity(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: () => toast.error("Không thể cập nhật số lượng"),
  });

  const clearCartMutation = useMutation({
    mutationFn: (ids?: string[]) => clearCart(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Đã làm trống giỏ hàng");
      setShowClearConfirm(false);
    },
    onError: () => toast.error("Không thể xóa toàn bộ giỏ hàng"),
  });

  // ── Handlers thao tác số lượng & tồn kho ──────────────────────────────────
  const handleQuantityChange = (productId: string, newQty: number, maxStock: number) => {
    if (newQty < 1) return;
    if (newQty > maxStock) {
      toast.error(`Kho chỉ còn ${maxStock} sản phẩm khả dụng!`, { icon: "⚠️" });
      return;
    }

    if (isLoggedIn) {
      updateQuantityMutation.mutate({ productId, quantity: newQty });
    } else {
      updateGuestCartQuantity(productId, newQty);
    }
  };

  const handleRemoveItem = (productId: string) => {
    if (isLoggedIn) {
      removeMutation.mutate(productId);
    } else {
      removeFromGuestCart(productId);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    }
    setSelectedIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleClearCart = () => {
    if (isLoggedIn) {
      clearCartMutation.mutate();
    } else {
      clearGuestCart();
      toast.success("Đã làm trống giỏ hàng");
      setShowClearConfirm(false);
    }
    setSelectedIds([]);
  };

  const handleRemoveSelected = () => {
    if (selectedIds.length === 0) return;
    if (isLoggedIn) {
      clearCartMutation.mutate(selectedIds);
    } else {
      selectedIds.forEach((id) => removeFromGuestCart(id));
      toast.success(`Đã xóa ${selectedIds.length} sản phẩm đã chọn`);
    }
    setSelectedIds([]);
  };

  // ── Checkbox Toggle Handlers ─────────────────────────────────────────────
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.productId));
    }
  };

  const handleToggleItem = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // ── Tính toán tổng tiền theo đúng sản phẩm được chọn ───────────────────────
  const selectedItems = useMemo(() => {
    return items.filter((i) => selectedIds.includes(i.productId));
  }, [items, selectedIds]);

  const selectedTotalAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems]);

  const selectedItemCount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);

  // Điều kiện Freeship từ 300k
  const isFreeShipEligible = selectedTotalAmount >= 300000;

  // ── Chuyển tiếp sang trang Checkout ──────────────────────────────────────
  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
      return;
    }

    const payloadForCheckout: CartItem[] = selectedItems.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      unitPrice: i.price,
      quantity: i.quantity,
      subtotal: i.price * i.quantity,
      imageUrl: i.imageUrl,
      stockQuantity: i.stockQuantity,
    }));

    if (!isLoggedIn) {
      // Nhắc nhở và chuyển sang login
      toast("Vui lòng đăng nhập để tiến hành đặt hàng!", { icon: "🔒" });
      navigate("/login", {
        state: {
          from: "/checkout",
          selectedItems: payloadForCheckout,
        },
      });
    } else {
      // Đã đăng nhập: chuyển trực tiếp sang checkout với danh sách sản phẩm đã tick
      navigate("/checkout", {
        state: {
          selectedItems: payloadForCheckout,
        },
      });
    }
  };

  if (isLoggedIn && backendLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/" className="hover:text-nexus-600 transition">
                Trang chủ
              </Link>
              <span>/</span>
              <span className="text-slate-700 font-medium">Giỏ hàng</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <ShoppingBag className="text-nexus-600" size={28} />
              Giỏ hàng của bạn
              {items.length > 0 && (
                <span className="text-sm font-semibold text-nexus-600 bg-nexus-50 border border-nexus-200 px-3 py-0.5 rounded-full">
                  {items.length} sản phẩm
                </span>
              )}
            </h1>
          </div>

          {/* Quick link quay lại mua sắm */}
          {items.length > 0 && (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-nexus-600 hover:text-nexus-700 transition"
            >
              <RotateCcw size={16} />
              Tiếp tục tìm kiếm sản phẩm
            </Link>
          )}
        </div>

        {/* Banner cảnh báo cho khách chưa đăng nhập */}
        {!isLoggedIn && items.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Bạn đang sử dụng giỏ hàng khách vãng lai
                </p>
                <p className="text-xs text-amber-700">
                  Đăng nhập tài khoản để tự động đồng bộ giỏ hàng, lưu địa chỉ và theo dõi hành trình đơn hàng.
                </p>
              </div>
            </div>
            <Link
              to="/login"
              state={{ from: "/cart" }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition shadow-sm shrink-0"
            >
              <LogIn size={16} />
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {/* Nội dung giỏ hàng */}
        {items.length === 0 ? (
          /* Empty State Onboarding: Giúp người dùng khám phá và bắt đầu mua sắm */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm max-w-3xl mx-auto my-6">
            <div className="w-20 h-20 bg-nexus-50 text-nexus-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
              <ShoppingBag size={40} strokeWidth={1.8} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
              Bạn chưa chọn món đồ nào. Giỏ hàng tại ProjectNexus giúp bạn lưu giữ các sản phẩm yêu thích, tự động tính ưu đãi Freeship và đồng bộ an toàn qua tài khoản.
            </p>


            {/* 3 Cam kết mua sắm an tâm */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-8 text-left">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <Truck className="text-nexus-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-bold text-slate-800">Miễn phí vận chuyển</p>
                  <p className="text-[11px] text-slate-500">Đơn hàng từ 300.000đ</p>
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <RotateCcw className="text-nexus-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-bold text-slate-800">Đổi trả 7 ngày</p>
                  <p className="text-[11px] text-slate-500">Miễn phí nếu lỗi nhà bán</p>
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <ShieldCheck className="text-nexus-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-bold text-slate-800">Bảo đảm chính hãng</p>
                  <p className="text-[11px] text-slate-500">Cam kết 100% authentic</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-nexus-600 hover:bg-nexus-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                Khám phá sản phẩm ngay
                <ArrowRight size={18} />
              </Link>
              {!isLoggedIn && (
                <Link
                  to="/login"
                  state={{ from: "/cart" }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
                >
                  <LogIn size={16} />
                  Đăng nhập để xem giỏ đã lưu
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột trái: Bảng sản phẩm & Controls (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Thanh điều khiển chọn tất cả & xóa nhanh */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-nexus-600 focus:outline-none"
                    aria-label="Chọn tất cả"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="text-nexus-600" size={22} />
                    ) : (
                      <Square className="text-slate-300 hover:text-slate-400" size={22} />
                    )}
                  </button>
                  <span className="text-sm font-semibold text-slate-800">
                    Chọn tất cả ({items.length} sản phẩm)
                  </span>
                </label>

                <div className="flex items-center gap-2 sm:gap-3">
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRemoveSelected}
                      className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-200 transition"
                    >
                      Xóa đã chọn ({selectedIds.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs text-slate-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>

              {/* Danh sách từng sản phẩm trong giỏ */}
              <div className="space-y-3">
                {items.map((item) => {
                  const isChecked = selectedIds.includes(item.productId);
                  const isMaxStock = item.quantity >= item.stockQuantity;

                  return (
                    <div
                      key={item.productId}
                      className={`bg-white rounded-2xl p-4 sm:p-5 border transition shadow-sm ${
                        isChecked
                          ? "border-nexus-300 ring-1 ring-nexus-100"
                          : "border-slate-200/80 opacity-90"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        {/* Checkbox item */}
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item.productId)}
                          className="mt-1 sm:mt-0 text-nexus-600 shrink-0 focus:outline-none"
                          aria-label={`Chọn ${item.productName}`}
                        >
                          {isChecked ? (
                            <CheckSquare className="text-nexus-600" size={22} />
                          ) : (
                            <Square className="text-slate-300 hover:text-slate-400" size={22} />
                          )}
                        </button>

                        {/* Thumbnail Image */}
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>

                        {/* Thông tin sản phẩm */}
                        <div className="flex-1 min-w-0 pr-2">
                          <Link
                            to={`/products/${item.productId}`}
                            className="font-bold text-slate-800 hover:text-nexus-600 text-sm sm:text-base line-clamp-2 transition"
                          >
                            {item.productName}
                          </Link>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              Chính hãng 100%
                            </span>
                            <span className="text-xs text-slate-400">
                              Kho: {item.stockQuantity}
                            </span>
                          </div>

                          <div className="mt-2 text-sm font-bold text-slate-700 sm:hidden">
                            {fmtVND(item.price)}
                          </div>
                        </div>

                        {/* Đơn giá (desktop) */}
                        <div className="hidden sm:block text-right min-w-[110px]">
                          <span className="text-xs text-slate-400 block">Đơn giá</span>
                          <span className="text-sm font-bold text-slate-700">
                            {fmtVND(item.price)}
                          </span>
                        </div>

                        {/* Tăng / Giảm số lượng & Kiểm tra tồn kho */}
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50/50 p-0.5 shadow-inner">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId,
                                  item.quantity - 1,
                                  item.stockQuantity
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                              title="Giảm số lượng"
                            >
                              <Minus size={14} />
                            </button>

                            <input
                              type="number"
                              min={1}
                              max={item.stockQuantity}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  handleQuantityChange(
                                    item.productId,
                                    val,
                                    item.stockQuantity
                                  );
                                }
                              }}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (isNaN(val) || val < 1) {
                                  handleQuantityChange(item.productId, 1, item.stockQuantity);
                                } else if (val > item.stockQuantity) {
                                  handleQuantityChange(item.productId, item.stockQuantity, item.stockQuantity);
                                }
                              }}
                              className="w-12 text-center bg-transparent text-sm font-bold text-slate-800 outline-none focus:bg-white"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId,
                                  item.quantity + 1,
                                  item.stockQuantity
                                )
                              }
                              disabled={isMaxStock}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                              title={
                                isMaxStock
                                  ? `Đã đạt giới hạn tồn kho (${item.stockQuantity})`
                                  : "Tăng số lượng"
                              }
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          {/* Thành tiền */}
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-extrabold text-nexus-600">
                              {fmtVND(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>

                        {/* Nút xóa item */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Xóa khỏi giỏ hàng"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Cảnh báo khi chạm mốc tồn kho tối đa */}
                      {isMaxStock && (
                        <div className="mt-2 text-[11px] text-amber-600 flex items-center gap-1 font-medium bg-amber-50/70 px-2.5 py-1 rounded-lg">
                          <AlertCircle size={13} />
                          Bạn đã chọn số lượng tối đa hiện có trong kho ({item.stockQuantity} sản phẩm).
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột phải: Summary Card & Nút Thanh Toán (4 cols) */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md sticky top-24 space-y-5">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Tóm tắt đơn hàng
                </h2>

                {/* Thanh tiến độ Freeship */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck
                      size={18}
                      className={isFreeShipEligible ? "text-emerald-500" : "text-nexus-500"}
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {isFreeShipEligible
                        ? "Đã đủ điều kiện Miễn phí vận chuyển! 🎉"
                        : `Mua thêm ${fmtVND(
                            300000 - selectedTotalAmount
                          )} để nhận FREESHIP`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isFreeShipEligible ? "bg-emerald-500" : "bg-nexus-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (selectedTotalAmount / 300000) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Chi tiết tính tiền */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Tổng sản phẩm trong giỏ:</span>
                    <span className="font-semibold">{items.length} món</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Sản phẩm đã chọn:</span>
                    <span className="font-semibold text-nexus-600">
                      {selectedItemCount} món ({selectedItems.length} loại)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính hàng chọn:</span>
                    <span className="font-semibold text-slate-800">
                      {fmtVND(selectedTotalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển dự kiến:</span>
                    <span className="font-semibold text-emerald-600">
                      {selectedTotalAmount === 0
                        ? "0 ₫"
                        : isFreeShipEligible
                        ? "Miễn phí (Freeship)"
                        : "30.000 ₫"}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                    <div>
                      <span className="text-base font-bold text-slate-900 block">
                        Tổng thanh toán:
                      </span>
                      <span className="text-xs text-slate-400">
                        (Đã bao gồm thuế VAT nếu có)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-nexus-600 block">
                        {fmtVND(
                          selectedTotalAmount +
                            (selectedTotalAmount === 0 || isFreeShipEligible ? 0 : 30000)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút bấm Đặt Hàng */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-nexus-600 to-nexus-700 hover:from-nexus-700 hover:to-nexus-800 text-white font-extrabold text-base shadow-lg shadow-nexus-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>Tiến hành đặt hàng ({selectedItemCount})</span>
                  <ArrowRight size={18} />
                </button>

                {/* Badge cam kết bảo mật & quyền lợi */}
                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                    <span>Cam kết 100% hàng chính hãng, bồi thường 200% nếu phát hiện giả</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw size={16} className="text-nexus-500 shrink-0" />
                    <span>Đổi trả miễn phí trong 7 ngày nếu lỗi từ nhà sản xuất</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xác Nhận Xóa Toàn Bộ Giỏ Hàng */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                Xóa tất cả sản phẩm?
              </h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Bạn có chắc chắn muốn làm trống toàn bộ giỏ hàng không? Thao tác này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm shadow-md shadow-red-500/20"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
