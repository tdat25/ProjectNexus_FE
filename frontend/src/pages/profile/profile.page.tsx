import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateProfile } from "@shared/api/auth";
import type { UpdateProfileData } from "@shared/api/auth";
import { getOrders } from "@shared/api/commerce";
import { useAuth } from "@app/providers/AuthContext";
import LoadingSpinner from "@shared/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Award,
  Camera,
  Save,
  XCircle,
  Sparkles,
  Link as LinkIcon,
  Upload,
  ShoppingBag,
  Package,
  Truck,
  Star,
  ChevronRight,
  Crown,
  Settings,
  Users,
  Gavel,
  LayoutDashboard,
  Store,
} from "lucide-react";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
];

/* ── Tier system ─────────────────────────────────────────────────────────── */
const TIERS = [
  { name: "Đồng",     min: 0,    color: "from-amber-700 to-amber-500",  text: "text-amber-800",  bg: "bg-amber-50",  border: "border-amber-300" },
  { name: "Bạc",      min: 50,   color: "from-gray-400 to-gray-300",    text: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-300"  },
  { name: "Vàng",     min: 100,  color: "from-yellow-500 to-amber-400", text: "text-yellow-800", bg: "bg-yellow-50", border: "border-yellow-400" },
  { name: "Kim Cương",min: 200,  color: "from-cyan-500 to-blue-500",    text: "text-blue-900",   bg: "bg-blue-50",   border: "border-blue-300"  },
];
function getTier(score: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}
function getNextTier(score: number) {
  for (let i = 0; i < TIERS.length; i++) {
    if (score < TIERS[i].min) return TIERS[i];
  }
  return null;
}

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["my-orders-summary"],
    queryFn: () => getOrders({ page: 1, pageSize: 100 }),
    enabled: authUser?.role === "BUYER",
  });

  const [formData, setFormData] = useState<UpdateProfileData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    gender: "Other",
    address: "",
    dateOfBirth: "",
    avatarUrl: "",
  });

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");

  // Sync form when profile data loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || "",
        gender: profile.gender || "Other",
        address: profile.address || "",
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
          : "",
        avatarUrl: profile.avatarUrl || "",
      });
      setCustomAvatarUrl(profile.avatarUrl || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => {
      if (!profile?.id) throw new Error("Không tìm thấy thông tin tài khoản.");
      return updateProfile(profile.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      // Cập nhật lại AuthContext
      updateUser({
        displayName: formData.fullName,
        email: formData.email,
        avatarUrl: formData.avatarUrl,
      });
      toast.success("Cập nhật thông tin thành công!");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại!"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    updateMutation.mutate({
      ...formData,
      dateOfBirth: formData.dateOfBirth
        ? new Date(formData.dateOfBirth).toISOString()
        : new Date("2000-01-01").toISOString(),
    });
  };

  // Xử lý upload ảnh từ máy tính (convert sang base64 data url)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP)!");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa là 2MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({ ...prev, avatarUrl: base64 }));
      setShowAvatarModal(false);
      toast.success("Đã chọn ảnh đại diện mới. Bấm 'Lưu thay đổi' để hoàn tất!");
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <XCircle className="mx-auto text-red-500 mb-3" size={48} />
        <h2 className="text-xl font-bold text-gray-800">Không thể tải hồ sơ</h2>
        <p className="text-gray-500 text-sm mt-1">
          Vui lòng thử đăng nhập lại hoặc kiểm tra kết nối mạng.
        </p>
      </div>
    );
  }

  const role = profile.role || authUser?.role || "BUYER";
  const roleColor =
    role === "ADMIN"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : role === "SELLER"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  const score = profile.reputationScore ?? 100;
  const tier = getTier(score);
  const nextTier = getNextTier(score);
  const tierProgress = nextTier
    ? Math.round(((score - getTier(score).min) / (nextTier.min - getTier(score).min)) * 100)
    : 100;

  const orders = ordersData?.items ?? [];
  const orderCounts = {
    pending:   orders.filter(o => ["Pending", "Processing"].includes(o.status)).length,
    packing:   orders.filter(o => o.status === "ReadyToShip").length,
    shipping:  orders.filter(o => ["Shipping", "OutForDelivery"].includes(o.status)).length,
    review:    orders.filter(o => ["Delivered", "Completed"].includes(o.status)).length,
  };

  const ORDER_TABS = [
    { label: "Chờ xác nhận", count: orderCounts.pending,  icon: ShoppingBag, status: "Pending",     color: "text-orange-500" },
    { label: "Chờ lấy hàng", count: orderCounts.packing,  icon: Package,     status: "ReadyToShip", color: "text-blue-500"   },
    { label: "Chờ giao hàng",count: orderCounts.shipping, icon: Truck,       status: "Shipping",    color: "text-nexus-600"  },
    { label: "Đánh giá",     count: orderCounts.review,   icon: Star,        status: "Delivered",   color: "text-yellow-500" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ── Header Banner ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-nexus-700 via-nexus-600 to-nexus-800 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Sparkles size={180} />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          {/* Avatar with edit button */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/30 overflow-hidden shadow-md bg-nexus-900 flex items-center justify-center">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {formData.fullName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-0 right-0 bg-white text-gray-700 p-2 rounded-full shadow-lg hover:bg-nexus-50 transition-all hover:scale-105"
              title="Đổi ảnh đại diện"
            >
              <Camera size={16} />
            </button>
          </div>

          {/* User Basic Info */}
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-bold">{formData.fullName || "Tài khoản Nexus"}</h1>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleColor} bg-white`}
              >
                {role}
              </span>
            </div>
            <p className="text-nexus-100 text-sm">{formData.email}</p>

            {/* Badges / Stats */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                <Shield size={14} className="text-emerald-400" />
                Độ tin cậy: <b className="font-semibold">{profile.trustLevel || "STANDARD"}</b>
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                <Award size={14} className="text-amber-400" />
                Điểm uy tín: <b className="font-semibold">{profile.reputationScore ?? 100}/100</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ADMIN: Quick Access Panel (thay thế tier + đơn mua) ─────────── */}
      {role === "ADMIN" ? (
        <div className="bg-gradient-to-br from-purple-50 to-nexus-50 border border-purple-200 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-purple-600" />
            <h2 className="font-bold text-purple-800 text-sm">Truy cập nhanh — Quản trị hệ thống</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Tổng quan",    to: "/admin",             icon: LayoutDashboard, color: "text-nexus-600",  bg: "bg-nexus-50  hover:bg-nexus-100"  },
              { label: "Sản phẩm",     to: "/admin#products",    icon: Package,         color: "text-emerald-600",bg: "bg-emerald-50 hover:bg-emerald-100" },
              { label: "Người dùng",   to: "/admin#users",       icon: Users,           color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100"  },
              { label: "Đấu giá",      to: "/admin#auctions",    icon: Gavel,           color: "text-amber-600",  bg: "bg-amber-50  hover:bg-amber-100"   },
            ].map(item => (
              <Link key={item.to} to={item.to}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border border-white shadow-sm ${item.bg} transition-colors group`}>
                <item.icon size={24} className={`${item.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>
          <p className="text-xs text-purple-400 mt-3 text-center">
            Tài khoản Admin không tham gia mua hàng hay đấu giá
          </p>
        </div>
      ) : (
        <>
          {/* ── VIP Tier Banner (chỉ BUYER/SELLER) ─────────────────────── */}
          <div className={`rounded-2xl border ${tier.border} ${tier.bg} p-4 mb-5 flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shrink-0 shadow`}>
              <Crown size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold text-sm ${tier.text}`}>Nexus {tier.name}</span>
                {nextTier && (
                  <span className="text-xs text-gray-400">→ {nextTier.name}: còn {nextTier.min - score} điểm</span>
                )}
                {!nextTier && <span className="text-xs text-gray-400">Hạng cao nhất</span>}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full bg-gradient-to-r ${tier.color} transition-all duration-700`}
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-xl font-bold ${tier.text}`}>{score}</p>
              <p className="text-xs text-gray-400">Điểm uy tín</p>
            </div>
          </div>

          {/* ── Đơn mua (chỉ BUYER) ──────────────────────────────────── */}
          {role === "BUYER" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 text-sm">Đơn mua</h2>
                <Link to="/orders" className="text-xs text-nexus-600 hover:underline flex items-center gap-0.5">
                  Xem lịch sử mua hàng <ChevronRight size={13} />
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {ORDER_TABS.map((tab) => (
                  <Link key={tab.status} to={`/orders?status=${tab.status}`}
                    className="flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-gray-50 transition group">
                    <div className="relative">
                      <tab.icon size={28} className={`${tab.color} group-hover:scale-110 transition-transform`} />
                      {tab.count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {tab.count > 99 ? "99+" : tab.count}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-600 text-center leading-tight">{tab.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Đăng ký bán hàng (chỉ BUYER) ────────────────────────── */}
          {role === "BUYER" && (
            <div className="bg-nexus-50 border border-nexus-200 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <Store size={16} className="text-nexus-600" /> Trở thành người bán
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Mở shop, đăng sản phẩm và tạo phiên đấu giá trên Nexus.</p>
                </div>
                <Link to="/seller/register"
                  className="shrink-0 bg-nexus-600 hover:bg-nexus-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          )}

          {/* ── Kênh bán hàng (chỉ SELLER) ───────────────────────────── */}
          {role === "SELLER" && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard size={16} className="text-blue-600" />
                <h2 className="font-bold text-gray-800 text-sm">Kênh bán hàng</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { to: "/seller/dashboard", icon: <Package size={22} className="text-nexus-500"/>, label: "Sản phẩm" },
                  { to: "/seller/dashboard", icon: <Gavel size={22} className="text-amber-500"/>, label: "Voucher" },
                  { to: "/seller/dashboard", icon: <Settings size={22} className="text-blue-500"/>, label: "Thống kê" },
                ].map((item) => (
                  <Link key={item.label} to={item.to}
                    className="flex flex-col items-center gap-2 py-3 rounded-xl bg-white border border-blue-100 hover:border-blue-300 hover:shadow-sm transition group">
                    <div className="group-hover:scale-110 transition-transform">{item.icon}</div>
                    <span className="text-[11px] text-gray-600 text-center">{item.label}</span>
                  </Link>
                ))}
              </div>
              <Link to="/seller/dashboard"
                className="mt-3 flex items-center justify-center gap-1 text-xs text-blue-600 hover:underline w-full">
                Đến kênh bán hàng <ChevronRight size={13}/>
              </Link>
            </div>
          )}
        </>
      )}

      {/* ── Main Profile Form ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Thông tin cá nhân</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Quản lý và chỉnh sửa thông tin hồ sơ của bạn trên Nexus
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-nexus-600" /> Họ và tên *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Nguyễn Văn A"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                <Mail size={14} className="text-nexus-600" /> Địa chỉ Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 transition-all"
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                <Phone size={14} className="text-nexus-600" /> Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phoneNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="0901234567"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 transition-all"
              />
            </div>

            {/* Giới tính */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                Giới tính
              </label>
              <select
                value={formData.gender || "Other"}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 bg-white transition-all"
              >
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-nexus-600" /> Ngày sinh
              </label>
              <input
                type="date"
                value={formData.dateOfBirth || ""}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 bg-white transition-all"
              />
            </div>

            {/* Link ảnh đại diện trực tiếp */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                <LinkIcon size={14} className="text-nexus-600" /> Link ảnh đại diện (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.avatarUrl || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, avatarUrl: e.target.value })
                  }
                  placeholder="https://... ảnh đại diện"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Chọn ảnh
                </button>
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} className="text-nexus-600" />
                {role === "SELLER" ? "Địa chỉ kinh doanh / cư trú" : "Địa chỉ giao hàng / cư trú"}
              </label>
              <textarea
                rows={3}
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 resize-none transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-nexus-600 hover:bg-nexus-700 disabled:bg-gray-300 text-white font-medium px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all hover:shadow"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} /> Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Modal Chọn / Tải ảnh đại diện ─────────────────────────────────── */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Camera size={18} className="text-nexus-600" /> Cập nhật ảnh đại diện
              </h3>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Tải từ thiết bị */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                1. Tải ảnh từ thiết bị của bạn
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-nexus-300 hover:border-nexus-500 bg-nexus-50/50 hover:bg-nexus-50 py-4 rounded-xl flex flex-col items-center justify-center gap-1.5 text-nexus-700 transition-colors"
              >
                <Upload size={22} />
                <span className="text-xs font-semibold">Bấm để chọn file ảnh</span>
                <span className="text-[10px] text-gray-400">PNG, JPG, WEBP tối đa 2MB</span>
              </button>
            </div>

            {/* Hoặc nhập link ảnh */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                2. Hoặc dán link ảnh trực tuyến
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-nexus-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarUrl.trim()) {
                      setFormData((prev) => ({ ...prev, avatarUrl: customAvatarUrl.trim() }));
                      setShowAvatarModal(false);
                      toast.success("Đã chọn link ảnh mới!");
                    }
                  }}
                  className="bg-nexus-600 text-white text-xs px-3 py-2 rounded-xl font-medium hover:bg-nexus-700"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Chọn từ mẫu có sẵn */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                3. Hoặc chọn nhanh mẫu có sẵn
              </p>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, avatarUrl: preset }));
                      setShowAvatarModal(false);
                      toast.success("Đã chọn ảnh mẫu!");
                    }}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                      formData.avatarUrl === preset
                        ? "border-nexus-600 ring-2 ring-nexus-400"
                        : "border-gray-200 hover:border-nexus-400"
                    }`}
                  >
                    <img src={preset} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
