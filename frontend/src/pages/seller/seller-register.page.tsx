// ============================================================
// Trang Đăng ký mở Shop (Seller Onboarding / Registration)
// Chuyển đổi vai trò từ BUYER sang SELLER với đầy đủ validation
// ============================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthContext";
import toast from "react-hot-toast";
import {
  Store,
  ShieldCheck,
  Building,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const VIETNAM_BANKS = [
  "Vietcombank (VCB)",
  "Techcombank (TCB)",
  "MB Bank (Quân Đội)",
  "VPBank (Việt Nam Thịnh Vượng)",
  "ACB (Á Châu)",
  "BIDV (Đầu tư & Phát triển)",
  "VietinBank (Công Thương)",
  "TPBank (Tiên Phong)",
  "HDBank",
  "Sacombank",
];

export default function SellerRegisterPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Step wizard: 1. Thông tin Shop | 2. Định danh & Kho hàng | 3. Ngân hàng & Xác nhận
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [form, setForm] = useState({
    shopName: "",
    shopDescription: "",
    hotline: "",
    businessEmail: user?.email || "",
    category: "Điện tử & Công nghệ",
    ownerName: user?.displayName || "",
    identifyNumber: "", // CCCD 12 số
    taxCode: "",
    province: "TP. Hồ Chí Minh",
    district: "",
    ward: "",
    warehouseAddress: "",
    bankName: "Vietcombank (VCB)",
    bankAccountNumber: "",
    bankAccountName: (user?.displayName || "").toUpperCase(),
    agreeTerms: false,
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nếu user đã là SELLER thì chuyển thẳng sang Dashboard
  useEffect(() => {
    if (user?.role === "SELLER") {
      navigate("/seller/dashboard", { replace: true });
    }
  }, [user?.role, navigate]);

  if (user?.role === "SELLER") {
    return null;
  }

  // Validate theo từng bước
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.shopName.trim() || form.shopName.trim().length < 3) {
      errs.shopName = "Tên Shop phải có từ 3 đến 50 ký tự.";
    }
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!form.hotline.trim() || !phoneRegex.test(form.hotline.trim())) {
      errs.hotline = "Số điện thoại không hợp lệ (cần 10 số, đầu 03, 05, 07, 08, 09).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.businessEmail.trim() || !emailRegex.test(form.businessEmail.trim())) {
      errs.businessEmail = "Email kinh doanh không đúng định dạng.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.ownerName.trim()) {
      errs.ownerName = "Vui lòng nhập họ và tên chủ shop.";
    }
    const cccdRegex = /^[0-9]{12}$/;
    if (!form.identifyNumber.trim() || !cccdRegex.test(form.identifyNumber.trim())) {
      errs.identifyNumber = "Số CCCD phải có đúng 12 chữ số.";
    }
    if (!form.district.trim()) {
      errs.district = "Vui lòng nhập Quận/Huyện.";
    }
    if (!form.ward.trim()) {
      errs.ward = "Vui lòng nhập Phường/Xã.";
    }
    if (!form.warehouseAddress.trim()) {
      errs.warehouseAddress = "Vui lòng nhập địa chỉ kho cụ thể.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!form.bankAccountNumber.trim() || form.bankAccountNumber.trim().length < 6) {
      errs.bankAccountNumber = "Số tài khoản ngân hàng không hợp lệ.";
    }
    if (!form.bankAccountName.trim()) {
      errs.bankAccountName = "Vui lòng nhập tên chủ tài khoản (viết hoa không dấu).";
    }
    if (!form.agreeTerms) {
      errs.agreeTerms = "Bạn cần đồng ý với Điều khoản dịch vụ người bán để tiếp tục.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Lưu thông tin shop vào localStorage
      const shopInfo = {
        shopId: "shop-" + Date.now(),
        sellerId: user?.userId || "seller-user",
        shopName: form.shopName,
        shopDescription: form.shopDescription,
        hotline: form.hotline,
        businessEmail: form.businessEmail,
        warehouseAddress: `${form.warehouseAddress}, ${form.ward}, ${form.district}, ${form.province}`,
        bankName: form.bankName,
        bankAccountNumber: form.bankAccountNumber,
        bankAccountName: form.bankAccountName,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("nexus_seller_shop", JSON.stringify(shopInfo));

      // Nâng cấp quyền người dùng thành SELLER
      updateUser({ role: "SELLER" });

      toast.success("Chúc mừng! Đăng ký mở Shop thành công. Chào mừng bạn đến Kênh người bán!", {
        duration: 5000,
        icon: "🎉",
      });

      navigate("/seller/dashboard", { replace: true });
    }, 1200);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Banner Top */}
        <div className="bg-gradient-to-r from-nexus-800 via-nexus-700 to-nexus-600 rounded-3xl p-8 text-white shadow-sm mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-nexus-200 text-xs font-bold mb-3">
              <Sparkles size={14} /> TRỞ THÀNH ĐỐI TÁC BÁN HÀNG CỦA NEXUS
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Đăng Ký Mở Shop Bán Hàng</h1>
            <p className="text-nexus-100 text-sm leading-relaxed">
              Tiếp cận hơn 500.000 khách hàng tiềm năng trên toàn quốc. Miễn phí mở shop, hỗ trợ vận chuyển và thanh toán nhanh chóng.
            </p>
          </div>
          <div className="absolute right-6 -bottom-6 opacity-20 hidden md:block">
            <Store size={180} />
          </div>
        </div>

        {/* Stepper Indicator */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-8">
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm font-semibold">
            <div
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
                step === 1 ? "bg-nexus-600 text-white shadow-sm" : step > 1 ? "text-emerald-600 bg-emerald-50" : "text-gray-400"
              }`}
            >
              <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                {step > 1 ? "✓" : "1"}
              </span>
              <span>Thông tin Shop</span>
            </div>

            <div
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
                step === 2 ? "bg-nexus-600 text-white shadow-sm" : step > 2 ? "text-emerald-600 bg-emerald-50" : "text-gray-400"
              }`}
            >
              <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                {step > 2 ? "✓" : "2"}
              </span>
              <span>Định danh & Kho hàng</span>
            </div>

            <div
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
                step === 3 ? "bg-nexus-600 text-white shadow-sm" : "text-gray-400"
              }`}
            >
              <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Ngân hàng & Cam kết</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10">
          {/* ── BƯỚC 1: THÔNG TIN SHOP ────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Store size={22} className="text-nexus-600" /> Bước 1: Thông tin thương hiệu & liên hệ
                </h2>
                <p className="text-xs text-gray-500 mt-1">Thông tin này sẽ được hiển thị công khai trên gian hàng của bạn.</p>
              </div>

              <div className="space-y-4">
                {/* Tên Shop */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tên Shop / Tên Gian Hàng *
                  </label>
                  <input
                    type="text"
                    value={form.shopName}
                    onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                    placeholder="Ví dụ: Nexus Tech Store, Thời Trang Hàng Hiệu..."
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${
                      errors.shopName ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-nexus-400"
                    }`}
                  />
                  {errors.shopName && <p className="text-red-500 text-xs mt-1">{errors.shopName}</p>}
                </div>

                {/* Ngành hàng chính */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Ngành hàng kinh doanh chính *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-400 bg-white"
                  >
                    <option value="Điện thoại & Phụ kiện">Điện thoại & Phụ kiện</option>
                    <option value="Điện tử & Công nghệ">Điện tử & Máy tính</option>
                    <option value="Thời trang & Phụ kiện">Thời trang nam & nữ</option>
                    <option value="Gia dụng & Đời sống">Đồ gia dụng & Nhà cửa</option>
                    <option value="Đồng hồ & Trang sức">Đồng hồ & Trang sức cao cấp</option>
                    <option value="Mỹ phẩm & Làm đẹp">Mỹ phẩm & Chăm sóc sắc đẹp</option>
                  </select>
                </div>

                {/* Hotline & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Số điện thoại Hotline CSKH *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-3 text-gray-400" />
                      <input
                        type="tel"
                        value={form.hotline}
                        onChange={(e) => setForm({ ...form, hotline: e.target.value })}
                        placeholder="0901234567"
                        className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition ${
                          errors.hotline ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-nexus-400"
                        }`}
                      />
                    </div>
                    {errors.hotline && <p className="text-red-500 text-xs mt-1">{errors.hotline}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email kinh doanh *
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3 text-gray-400" />
                      <input
                        type="email"
                        value={form.businessEmail}
                        onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
                        placeholder="shop@example.com"
                        className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition ${
                          errors.businessEmail ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-nexus-400"
                        }`}
                      />
                    </div>
                    {errors.businessEmail && <p className="text-red-500 text-xs mt-1">{errors.businessEmail}</p>}
                  </div>
                </div>

                {/* Mô tả Shop */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Mô tả giới thiệu Shop
                  </label>
                  <textarea
                    rows={3}
                    value={form.shopDescription}
                    onChange={(e) => setForm({ ...form, shopDescription: e.target.value })}
                    placeholder="Giới thiệu các dòng sản phẩm chủ lực, cam kết chất lượng của shop..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-400 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-sm font-bold shadow-md transition"
                >
                  Tiếp tục: Định danh & Kho hàng <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── BƯỚC 2: ĐỊNH DANH & KHO HÀNG ───────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Building size={22} className="text-nexus-600" /> Bước 2: Thông tin định danh & Địa chỉ kho lấy hàng
                </h2>
                <p className="text-xs text-gray-500 mt-1">Thông tin dùng để đối soát hợp pháp và để đơn vị vận chuyển (GHN/GHTK) đến lấy hàng.</p>
              </div>

              <div className="space-y-4">
                {/* Chủ shop & CCCD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Họ và tên người đại diện / Chủ shop *
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={form.ownerName}
                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition ${
                          errors.ownerName ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-nexus-400"
                        }`}
                      />
                    </div>
                    {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Số Căn Cước Công Dân (12 số) *
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={form.identifyNumber}
                      onChange={(e) => setForm({ ...form, identifyNumber: e.target.value })}
                      placeholder="079xxxxxxxxxx"
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none font-mono transition ${
                        errors.identifyNumber ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-nexus-400"
                      }`}
                    />
                    {errors.identifyNumber && <p className="text-red-500 text-xs mt-1">{errors.identifyNumber}</p>}
                  </div>
                </div>

                {/* Địa chỉ kho hàng */}
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                    <MapPin size={16} className="text-nexus-600" /> Địa chỉ kho hàng (Nơi shipper đến lấy đơn)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tỉnh / Thành phố *</label>
                      <input
                        type="text"
                        value={form.province}
                        onChange={(e) => setForm({ ...form, province: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Quận / Huyện *</label>
                      <input
                        type="text"
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        placeholder="Ví dụ: TP. Thủ Đức"
                        className={`w-full border rounded-xl px-3 py-2 text-sm outline-none transition ${
                          errors.district ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-nexus-400"
                        }`}
                      />
                      {errors.district && <p className="text-red-500 text-[11px] mt-1">{errors.district}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Phường / Xã *</label>
                      <input
                        type="text"
                        value={form.ward}
                        onChange={(e) => setForm({ ...form, ward: e.target.value })}
                        placeholder="Ví dụ: P. Bến Nghé"
                        className={`w-full border rounded-xl px-3 py-2 text-sm outline-none transition ${
                          errors.ward ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-nexus-400"
                        }`}
                      />
                      {errors.ward && <p className="text-red-500 text-[11px] mt-1">{errors.ward}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Số nhà, tên đường, tên tòa nhà *</label>
                    <input
                      type="text"
                      value={form.warehouseAddress}
                      onChange={(e) => setForm({ ...form, warehouseAddress: e.target.value })}
                      placeholder="Số 45 Đường D1, Khu Công nghệ cao..."
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${
                        errors.warehouseAddress ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-nexus-400"
                      }`}
                    />
                    {errors.warehouseAddress && <p className="text-red-500 text-xs mt-1">{errors.warehouseAddress}</p>}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-xl text-sm font-medium transition"
                >
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-sm font-bold shadow-md transition"
                >
                  Tiếp tục: Ngân hàng & Cam kết <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── BƯỚC 3: NGÂN HÀNG & XÁC NHẬN ──────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard size={22} className="text-nexus-600" /> Bước 3: Tài khoản nhận tiền thanh toán & Cam kết
                </h2>
                <p className="text-xs text-gray-500 mt-1">Doanh thu bán hàng sẽ được đối soát và chuyển tự động vào tài khoản này hàng tuần.</p>
              </div>

              <div className="space-y-4">
                {/* Ngân hàng */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Ngân hàng thụ hưởng *
                  </label>
                  <select
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-400 bg-white"
                  >
                    {VIETNAM_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Số TK & Chủ TK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Số tài khoản ngân hàng *
                    </label>
                    <input
                      type="text"
                      value={form.bankAccountNumber}
                      onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                      placeholder="Ví dụ: 0123456789"
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono outline-none transition ${
                        errors.bankAccountNumber ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-nexus-400"
                      }`}
                    />
                    {errors.bankAccountNumber && <p className="text-red-500 text-xs mt-1">{errors.bankAccountNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Tên chủ tài khoản (Viết hoa không dấu) *
                    </label>
                    <input
                      type="text"
                      value={form.bankAccountName}
                      onChange={(e) => setForm({ ...form, bankAccountName: e.target.value.toUpperCase() })}
                      placeholder="NGUYEN VAN A"
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm uppercase font-semibold outline-none transition ${
                        errors.bankAccountName ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-nexus-400"
                      }`}
                    />
                    {errors.bankAccountName && <p className="text-red-500 text-xs mt-1">{errors.bankAccountName}</p>}
                  </div>
                </div>

                {/* Summary box */}
                <div className="bg-nexus-50/60 rounded-2xl p-4 border border-nexus-100 text-xs text-gray-700 space-y-1.5">
                  <div className="font-bold text-nexus-800 text-sm mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Tóm tắt thông tin Shop đăng ký:
                  </div>
                  <div>• <b>Tên Shop:</b> {form.shopName} ({form.category})</div>
                  <div>• <b>Người đại diện:</b> {form.ownerName} - CCCD: {form.identifyNumber}</div>
                  <div>• <b>Kho hàng:</b> {form.warehouseAddress}, {form.ward}, {form.district}, {form.province}</div>
                  <div>• <b>Tài khoản nhận tiền:</b> {form.bankName} - {form.bankAccountNumber} ({form.bankAccountName})</div>
                </div>

                {/* Cam kết điều khoản */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.agreeTerms}
                      onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                      className="mt-0.5 rounded text-nexus-600 focus:ring-nexus-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      Tôi cam kết tất cả thông tin khai báo trên là chính xác. Tôi cam kết chỉ bán hàng chính hãng, không bán hàng giả, hàng nhái, tuân thủ chính sách bảo mật và tiêu chuẩn vận hành của <b>Nexus Marketplace</b>.
                    </span>
                  </label>
                  {errors.agreeTerms && <p className="text-red-500 text-xs mt-1.5 ml-6">{errors.agreeTerms}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-xl text-sm font-medium transition"
                >
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50"
                >
                  <Store size={18} />
                  {isSubmitting ? "Đang tạo gian hàng..." : "Hoàn tất đăng ký mở Shop"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
