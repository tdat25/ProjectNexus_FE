// ============================================================
// Trang đăng ký - tạo tài khoản mới với thông báo lỗi chi tiết
// ============================================================
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "@shared/api/auth";
import { useAuth } from "@app/providers/AuthContext";
import { useCart } from "@app/providers/CartContext";
import { useGoogleAuth } from "@shared/hooks/useGoogleAuth";
import toast from "react-hot-toast";
import { Package, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

export default function RegisterPage() {
  const { login, loginWithGoogle } = useAuth();
  const { mergeGuestCartToBackend } = useCart();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleCredential = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const u = await loginWithGoogle(idToken);
      if (u.role === "BUYER") await mergeGuestCartToBackend().catch(() => {});
      toast.success("Đăng nhập Google thành công!");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Đăng nhập Google thất bại");
    } finally {
      setGoogleLoading(false);
    }
  };

  const { signInWithGoogle, isConfigured } = useGoogleAuth(handleGoogleCredential);

  // Các trường cơ bản
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Các trường mở rộng (tùy chọn)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gender, setGender] = useState("Other");
  const [address, setAddress] = useState("");
  const [identifyNumber, setIdentifyNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Trạng thái hiển thị
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Trích xuất toàn bộ lỗi từ API trả về (hỗ trợ ProblemDetails, validation errors list, etc.)
  const parseErrors = (err: any): { summary: string; details: string[] } => {
    const details: string[] = [];
    let summary = "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.";

    if (err?.response?.data) {
      const data = err.response.data;

      // 1. Nếu có dictionary errors từ ASP.NET Core Validation (ProblemDetails)
      if (data.errors && typeof data.errors === "object") {
        for (const [field, msgs] of Object.entries(data.errors)) {
          if (Array.isArray(msgs)) {
            msgs.forEach((m) => details.push(`${field}: ${m}`));
          } else if (typeof msgs === "string") {
            details.push(`${field}: ${msgs}`);
          }
        }
        if (details.length > 0) {
          summary = data.title || "Dữ liệu nhập vào chưa hợp lệ:";
          return { summary, details };
        }
      }

      // 2. Nếu có message trực tiếp từ API
      if (data.message && typeof data.message === "string") {
        summary = data.message;
        return { summary, details };
      }

      // 3. Nếu có title
      if (data.title && typeof data.title === "string") {
        summary = data.title;
        return { summary, details };
      }
    }

    if (err?.message) {
      summary = err.message;
    }

    return { summary, details };
  };

  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorDetails([]);
    setSuccessMessage(null);

    // Client-side validations
    if (!displayName.trim() || !email.trim() || !password) {
      const msg = "Vui lòng điền đầy đủ họ tên, email và mật khẩu.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const msg = "Email không đúng định dạng (ví dụ: yourname@domain.com).";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = "Mật khẩu phải có ít nhất 6 ký tự.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      const msg = "Xác nhận mật khẩu không khớp với mật khẩu đã nhập.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (phoneNumber.trim() && !/^\d{9,11}$/.test(phoneNumber.trim())) {
      const msg = "Số điện thoại phải gồm từ 9 đến 11 chữ số.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      // Chuẩn bị payload đăng ký
      const payload: {
        email: string;
        password: string;
        fullName: string;
        phoneNumber?: string;
        identifyNumber?: string;
        gender?: string;
        address?: string;
        dateOfBirth?: string;
      } = {
        email: email.trim().toLowerCase(),
        password,
        fullName: displayName.trim(),
      };

      if (phoneNumber.trim()) payload.phoneNumber = phoneNumber.trim();
      if (identifyNumber.trim()) payload.identifyNumber = identifyNumber.trim();
      if (gender) payload.gender = gender;
      if (address.trim()) payload.address = address.trim();
      if (dateOfBirth) payload.dateOfBirth = new Date(dateOfBirth).toISOString();

      // 1. Gọi đăng ký
      await register(payload);

      toast.success("Đăng ký tài khoản thành công! Vui lòng xác thực email.");
      setRegisteredEmail(email.trim().toLowerCase());
    } catch (err: any) {
      const { summary, details } = parseErrors(err);
      setErrorMessage(summary);
      setErrorDetails(details);
      toast.error(summary);
    } finally {
      setLoading(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nexus-50 via-gray-50 to-white flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h2>
          <p className="text-gray-600 text-sm mb-3 leading-relaxed">
            Chúng tôi đã gửi email kích hoạt tài khoản kèm đường link xác nhận tới địa chỉ:
          </p>
          <div className="bg-nexus-50 text-nexus-800 font-semibold py-2.5 px-4 rounded-xl text-base mb-5 border border-nexus-100 break-all">
            {registeredEmail}
          </div>
          <div className="p-4 bg-amber-50 rounded-xl text-left text-xs text-amber-800 border border-amber-200 mb-6 flex gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Hướng dẫn tiếp theo:</p>
              <p>Vui lòng mở hộp thư email của bạn và nhấn vào liên kết xác nhận để kích hoạt tài khoản trước khi đăng nhập. Nếu không thấy trong Hộp thư đến, vui lòng kiểm tra thư mục <strong>Spam / Thư rác</strong>.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="w-full bg-nexus-600 hover:bg-nexus-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-md block text-center"
            >
              Đến trang Đăng nhập
            </Link>
            <button
              onClick={() => setRegisteredEmail(null)}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Đăng ký bằng email khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-nexus-50 via-gray-50 to-white flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-nexus-600 rounded-2xl shadow-lg mb-3">
            <Package size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Tạo tài khoản Nexus</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng ký để mua sắm và tham gia đấu giá trực tuyến</p>
        </div>

        {/* Form Box */}
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
          {/* Thông báo lỗi chi tiết nếu có */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex gap-3 items-start animate-fade-in">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold">{errorMessage}</div>
                {errorDetails.length > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-red-700">
                    {errorDetails.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Thông báo thành công */}
          {successMessage && (
            <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex gap-3 items-center">
              <CheckCircle2 size={20} className="text-green-500 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Google Sign-In — đặt trước form để nổi bật */}
          <div className="mb-5">
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={googleLoading || !isConfigured}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-700 font-medium py-2.5 rounded-xl transition-all shadow-sm"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>{googleLoading ? "Đang xác thực..." : "Đăng ký / Đăng nhập với Google"}</span>
            </button>
            {!isConfigured && (
              <p className="text-center text-xs text-amber-600 mt-2">Google OAuth chưa được cấu hình</p>
            )}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">hoặc đăng ký bằng email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Họ và tên */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition"
                autoFocus
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition"
              />
            </div>

            {/* Số điện thoại */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                <span className="text-xs text-gray-400">Tùy chọn</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition"
              />
            </div>

            {/* Mật khẩu */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full border border-gray-200 rounded-lg pl-4 pr-11 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition"
              />
              {confirmPassword && password !== confirmPassword && (
                <span className="text-xs text-red-500">Mật khẩu xác nhận chưa trùng khớp.</span>
              )}
            </div>

            {/* Accordion mở rộng thông tin cá nhân */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-nexus-600 hover:text-nexus-700 font-medium flex items-center gap-1 transition"
              >
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showAdvanced ? "Thu gọn thông tin bổ sung" : "+ Điền thêm thông tin (Giới tính, Địa chỉ, CMND...)"}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-600">Giới tính</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-nexus-500"
                      >
                        <option value="Male">Nam</option>
                        <option value="Female">Nữ</option>
                        <option value="Other">Khác</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-600">Ngày sinh</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-nexus-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Số CMND / CCCD</label>
                    <input
                      type="text"
                      value={identifyNumber}
                      onChange={(e) => setIdentifyNumber(e.target.value)}
                      placeholder="12 chữ số CCCD"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-nexus-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Địa chỉ giao hàng</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                      className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-nexus-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Nút bấm Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-nexus-600 hover:bg-nexus-700 disabled:bg-nexus-300 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                "Đăng ký tài khoản"
              )}
            </button>

            {/* Link sang trang Đăng nhập */}
            <p className="text-center text-sm text-gray-500 mt-2">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-nexus-600 font-semibold hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
