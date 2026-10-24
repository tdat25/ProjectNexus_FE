// ============================================================
// Trang Quản lý Hồ sơ người dùng (User Profile Portal)
// Gồm: Thông tin cá nhân, Sổ địa chỉ giao hàng, Đổi mật khẩu
// ============================================================
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@app/providers/AuthContext";
import {
  getProfile,
  updateProfile,
  changePassword,
  getUserAddresses,
  saveUserAddress,
  deleteUserAddress,
  setDefaultUserAddress,
} from "@shared/api/auth";
import type { UserProfile, UserAddress } from "@shared/api/auth";
import LoadingSpinner from "@shared/ui/LoadingSpinner";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Shield,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Eye,
  EyeOff,
  Camera,
  Save,
  X,
  Store,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"info" | "address" | "password">("info");

  // ── 1. Tab Thông tin cá nhân ───────────────────────────────────────────────
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", user?.userId],
    queryFn: () => getProfile(user?.userId || ""),
  });

  const [formData, setFormData] = useState({
    displayName: "",
    phoneNumber: "",
    gender: "Nam",
    dateOfBirth: "",
    address: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || profile.fullName || "",
        phoneNumber: profile.phoneNumber || "",
        gender: profile.gender || "Nam",
        dateOfBirth: profile.dateOfBirth || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => updateProfile(user?.userId || "", data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      if (updated.displayName) {
        updateUser({ displayName: updated.displayName });
      }
      toast.success("Cập nhật thông tin thành công!");
    },
    onError: () => toast.error("Cập nhật thất bại, vui lòng thử lại."),
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      toast.error("Họ và tên không được để trống!");
      return;
    }
    if (formData.phoneNumber) {
      const cleanPhone = formData.phoneNumber.replace(/[\s.-]/g, "");
      const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
      if (!phoneRegex.test(cleanPhone)) {
        toast.error("Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 và gồm 10 chữ số)!");
        return;
      }
    }
    updateProfileMutation.mutate(formData);
  };

  // ── 2. Tab Sổ địa chỉ ──────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  const [addressForm, setAddressForm] = useState({
    recipientName: "",
    phoneNumber: "",
    streetAddress: "",
    ward: "",
    district: "",
    province: "",
    isDefault: false,
  });

  useEffect(() => {
    setAddresses(getUserAddresses());
  }, []);

  const openAddressModal = (addr?: UserAddress) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        recipientName: addr.recipientName,
        phoneNumber: addr.phoneNumber,
        streetAddress: addr.streetAddress,
        ward: addr.ward,
        district: addr.district,
        province: addr.province,
        isDefault: addr.isDefault,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        recipientName: formData.displayName || user?.displayName || "",
        phoneNumber: formData.phoneNumber || "",
        streetAddress: "",
        ward: "",
        district: "",
        province: "TP. Hồ Chí Minh",
        isDefault: addresses.length === 0,
      });
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.recipientName.trim() || !addressForm.phoneNumber.trim() || !addressForm.streetAddress.trim()) {
      toast.error("Vui lòng điền đầy đủ các thông tin địa chỉ bắt buộc!");
      return;
    }
    const cleanPhone = addressForm.phoneNumber.replace(/[\s.-]/g, "");
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      toast.error("Số điện thoại nhận hàng không hợp lệ (cần 10 chữ số, ví dụ 0901234567)!");
      return;
    }
    const updated = saveUserAddress({
      ...(editingAddress ? { id: editingAddress.id } : {}),
      ...addressForm,
      phoneNumber: cleanPhone,
    });
    setAddresses(updated);
    setIsAddressModalOpen(false);
    toast.success(editingAddress ? "Đã cập nhật địa chỉ!" : "Đã thêm địa chỉ mới!");
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      const updated = deleteUserAddress(id);
      setAddresses(updated);
      toast.success("Đã xóa địa chỉ.");
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = setDefaultUserAddress(id);
    setAddresses(updated);
    toast.success("Đã đặt làm địa chỉ mặc định!");
  };

  // ── 3. Tab Đổi mật khẩu ────────────────────────────────────────────────────
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const calculateStrength = (pass: string) => {
    if (!pass) return 0;
    let s = 0;
    if (pass.length >= 6) s++;
    if (pass.length >= 8 && /[0-9]/.test(pass)) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    return s;
  };
  const passStrength = calculateStrength(newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setChangingPass(true);
    try {
      await changePassword({ oldPassword, newPassword });
      toast.success("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Mật khẩu cũ không chính xác hoặc có lỗi xảy ra.");
    } finally {
      setChangingPass(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-nexus-800 via-nexus-700 to-nexus-600 rounded-3xl p-6 sm:p-8 text-white shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-5 w-full sm:w-auto">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center text-3xl font-extrabold text-white shadow-md overflow-hidden">
                {formData.displayName ? formData.displayName.charAt(0).toUpperCase() : <User size={36} />}
              </div>
              <button
                type="button"
                onClick={() => toast("Chức năng tải ảnh đại diện đã sẵn sàng!", { icon: "📸" })}
                className="absolute -bottom-1.5 -right-1.5 bg-nexus-500 hover:bg-nexus-400 p-1.5 rounded-xl border-2 border-nexus-800 shadow transition"
                title="Thay đổi avatar"
              >
                <Camera size={14} className="text-white" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold">{formData.displayName || user?.displayName}</h1>
                <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20 uppercase tracking-wider">
                  {user?.role || "BUYER"}
                </span>
              </div>
              <p className="text-nexus-200 text-xs mt-1 flex items-center gap-1.5">
                <Mail size={13} /> {user?.email}
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/orders"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold backdrop-blur border border-white/20 transition"
            >
              <Package size={15} /> Đơn mua của tôi
            </Link>
            {user?.role === "SELLER" ? (
              <Link
                to="/seller/dashboard"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-950 rounded-xl text-xs font-bold transition shadow"
              >
                <Store size={15} /> Kênh người bán
              </Link>
            ) : (
              <Link
                to="/seller/register"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-950 rounded-xl text-xs font-bold transition shadow"
              >
                <Store size={15} /> Mở Shop bán hàng
              </Link>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-1">
              <button
                onClick={() => setActiveTab("info")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeTab === "info"
                    ? "bg-nexus-50 text-nexus-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <User size={18} className={activeTab === "info" ? "text-nexus-600" : "text-gray-400"} />
                Thông tin cá nhân
              </button>

              <button
                onClick={() => setActiveTab("address")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeTab === "address"
                    ? "bg-nexus-50 text-nexus-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <MapPin size={18} className={activeTab === "address" ? "text-nexus-600" : "text-gray-400"} />
                Sổ địa chỉ
                <span className="ml-auto text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {addresses.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("password")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeTab === "password"
                    ? "bg-nexus-50 text-nexus-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Lock size={18} className={activeTab === "password" ? "text-nexus-600" : "text-gray-400"} />
                Đổi mật khẩu
              </button>
            </div>
          </div>

          {/* Tab Body */}
          <div className="lg:col-span-9">
            {/* ── TAB 1: THÔNG TIN CÁ NHÂN ───────────────────────────────── */}
            {activeTab === "info" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Hồ sơ cá nhân</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-2xl">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={user?.email || ""}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed pr-10"
                      />
                      <CheckCircle size={18} className="text-emerald-500 absolute right-3.5 top-3" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Email dùng để đăng nhập và nhận thông báo đơn hàng.</p>
                  </div>

                  {/* Họ và tên */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Họ và tên *
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3.5 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="Nhập họ và tên của bạn"
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-400 transition"
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3.5 top-3 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="Ví dụ: 0901234567"
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-400 transition"
                      />
                    </div>
                  </div>

                  {/* Giới tính */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Giới tính
                    </label>
                    <div className="flex items-center gap-6 text-sm text-gray-700">
                      {["Nam", "Nữ", "Khác"].map((g) => (
                        <label key={g} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={formData.gender === g}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="text-nexus-600 focus:ring-nexus-500 w-4 h-4"
                          />
                          <span>{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Ngày sinh */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Ngày sinh
                    </label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3.5 top-3 text-gray-400" />
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-400 transition bg-white"
                      />
                    </div>
                  </div>

                  {/* Địa chỉ liên hệ */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Địa chỉ liên hệ
                    </label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3.5 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Địa chỉ cư trú thường dùng"
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-400 transition"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center gap-2 px-6 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50"
                    >
                      <Save size={16} />
                      {updateProfileMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── TAB 2: SỔ ĐỊA CHỈ GIAO HÀNG ─────────────────────────────── */}
            {activeTab === "address" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Địa chỉ nhận hàng</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Địa chỉ dùng để tính phí vận chuyển và giao hàng nhanh</p>
                  </div>
                  <button
                    onClick={() => openAddressModal()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Plus size={16} /> Thêm địa chỉ mới
                  </button>
                </div>

                {/* List Addresses */}
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      Bạn chưa có địa chỉ nào. Hãy bấm nút thêm địa chỉ mới ở trên!
                    </div>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          addr.isDefault ? "border-nexus-500 bg-nexus-50/20 shadow-sm" : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-gray-900 text-sm">{addr.recipientName}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs text-gray-600 font-medium">{addr.phoneNumber}</span>
                            {addr.isDefault && (
                              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs text-gray-600 hover:text-nexus-600 font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-nexus-300 transition"
                            >
                              Đặt mặc định
                            </button>
                          )}
                          <button
                            onClick={() => openAddressModal(addr)}
                            className="p-1.5 text-gray-500 hover:text-nexus-600 hover:bg-nexus-50 rounded-lg transition"
                            title="Sửa địa chỉ"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Xóa địa chỉ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3: ĐỔI MẬT KHẨU ─────────────────────────────────────── */}
            {activeTab === "password" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Đổi mật khẩu tài khoản</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                  {/* Mật khẩu hiện tại */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Mật khẩu hiện tại *
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-3 text-gray-400" />
                      <input
                        type={showOldPass ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-400 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Mật khẩu mới *
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-3 text-gray-400" />
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-400 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password strength */}
                    {newPassword && (
                      <div className="mt-2.5 space-y-1">
                        <div className="flex gap-1.5 h-1.5 w-full">
                          <div className={`h-full flex-1 rounded-full ${passStrength >= 1 ? "bg-red-500" : "bg-gray-200"}`}></div>
                          <div className={`h-full flex-1 rounded-full ${passStrength >= 2 ? "bg-amber-500" : "bg-gray-200"}`}></div>
                          <div className={`h-full flex-1 rounded-full ${passStrength >= 3 ? "bg-blue-500" : "bg-gray-200"}`}></div>
                          <div className={`h-full flex-1 rounded-full ${passStrength >= 4 ? "bg-emerald-500" : "bg-gray-200"}`}></div>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Độ mạnh:{" "}
                          <span className="font-semibold">
                            {passStrength <= 1 && "Yếu"}
                            {passStrength === 2 && "Trung bình"}
                            {passStrength === 3 && "Khá"}
                            {passStrength >= 4 && "Rất mạnh"}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Xác nhận mật khẩu mới *
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-3 text-gray-400" />
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-400 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={changingPass}
                      className="flex items-center gap-2 px-6 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50"
                    >
                      <Shield size={16} />
                      {changingPass ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL THÊM / SỬA ĐỊA CHỈ ────────────────────────────────────────── */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ nhận hàng mới"}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Họ và tên người nhận *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phoneNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                    placeholder="0901234567"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tỉnh / Thành phố *</label>
                <input
                  type="text"
                  required
                  value={addressForm.province}
                  onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                  placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quận / Huyện *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    placeholder="Ví dụ: TP. Thủ Đức"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phường / Xã *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.ward}
                    onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                    placeholder="Ví dụ: Phường Bến Nghé"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ cụ thể *</label>
                <input
                  type="text"
                  required
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  placeholder="Số nhà, tên đường, tòa nhà/tầng..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-nexus-600 focus:ring-nexus-500 w-4 h-4"
                />
                <span className="text-xs text-gray-700 font-medium">Đặt làm địa chỉ nhận hàng mặc định</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {editingAddress ? "Lưu thay đổi" : "Thêm địa chỉ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
