// ============================================================
// Trang đăng ký Nexus — Thiết kế theo mockup Portal
// ============================================================
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "@shared/api/auth";
import { useAuth } from "@app/providers/AuthContext";
import toast from "react-hot-toast";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Các trường chính theo mockup
  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCaptchaChecked, setIsCaptchaChecked] = useState(false);

  // Trường nâng cao (tuỳ chọn)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("Other");
  const [address, setAddress] = useState("");
  const [identifyNumber, setIdentifyNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Trạng thái xử lý
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  // Đánh giá độ mạnh mật khẩu (4 mức độ tương ứng 4 thanh gạch)
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8 && /[0-9]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(password);

  const handleGoogleSignUp = () => {
    // Chưa có code BE nên không thực hiện gì
    toast("Tính năng đăng ký với Google đang được phát triển!", {
      icon: "ℹ️",
      duration: 3500,
    });
  };

  // Trích xuất lỗi từ backend
  const parseErrors = (err: any): { summary: string; details: string[] } => {
    const details: string[] = [];
    let summary = "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.";

    if (err?.response?.data) {
      const data = err.response.data;
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
      if (data.message && typeof data.message === "string") {
        summary = data.message;
        return { summary, details };
      }
      if (data.title && typeof data.title === "string") {
        summary = data.title;
        return { summary, details };
      }
    }

    if (err?.message) summary = err.message;
    return { summary, details };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorDetails([]);

    if (!accountName.trim() || !email.trim() || !password) {
      const msg = "Vui lòng nhập đầy đủ Account name, Email và Password.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const msg = "Email không đúng định dạng (ví dụ: email@domain.com).";
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

    if (password !== confirmPassword) {
      const msg = "Re-enter password không khớp với mật khẩu đã nhập.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!isCaptchaChecked) {
      const msg = "Vui lòng tích xác nhận 'I'm not a robot'.";
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
        fullName: accountName.trim(),
      };

      if (phoneNumber.trim()) payload.phoneNumber = phoneNumber.trim();
      if (identifyNumber.trim()) payload.identifyNumber = identifyNumber.trim();
      if (gender) payload.gender = gender;
      if (address.trim()) payload.address = address.trim();
      if (dateOfBirth) payload.dateOfBirth = new Date(dateOfBirth).toISOString();

      await register(payload);

      toast.success("Đăng ký tài khoản thành công!");

      // Tự động đăng nhập
      try {
        await login(email.trim().toLowerCase(), password);
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } catch {
        toast.success("Tạo tài khoản thành công! Hãy đăng nhập để bắt đầu.");
        navigate("/login");
      }
    } catch (err: any) {
      const { summary, details } = parseErrors(err);
      setErrorMessage(summary);
      setErrorDetails(details);
      toast.error(summary);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-[560px]">
        {/* Card Container */}
        <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1F2] border border-[#FFE4E6] text-[#E11D48] text-xs font-bold tracking-wide mb-4">
            <UserPlus size={14} className="text-[#E11D48]" />
            <span>CREATE A NEW ACCOUNT</span>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Register an Account
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 mb-7 leading-relaxed">
            Fill in the information below to begin your experience.
          </p>

          {/* Sign up quickly with Google */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full py-3 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2.5 transition active:scale-[0.99] shadow-sm"
          >
            <GoogleIcon />
            <span>Sign up quickly with Google</span>
          </button>

          {/* Divider: OR FILL IN THE INFORMATION BELOW. */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase text-center">
              OR FILL IN THE INFORMATION BELOW.
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex gap-2.5 items-start">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold">{errorMessage}</div>
                {errorDetails.length > 0 && (
                  <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-[11px] text-red-700">
                    {errorDetails.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Row 1: Account name & Email address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Account name
                </label>
                <div className="relative flex items-center">
                  <User
                    className="absolute left-3.5 text-slate-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Enter account name"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                  />
                </div>
              </div>

              {/* Email address */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Email address
                </label>
                <div className="relative flex items-center">
                  <Mail
                    className="absolute left-3.5 text-slate-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Password & Re-enter password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock
                    className="absolute left-3.5 text-slate-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Security password"
                    className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* 4 small strength bars */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1 rounded-full transition-colors ${
                        passwordStrength >= step
                          ? passwordStrength <= 2
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Re-enter password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Re-enter password
                </label>
                <div className="relative flex items-center">
                  <Lock
                    className="absolute left-3.5 text-slate-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Collapsible Section: Thông tin thêm */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 py-1 focus:outline-none"
              >
                <span>Thêm thông tin cá nhân (tuỳ chọn)</span>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 mt-2 bg-slate-50/80 rounded-2xl border border-slate-200/70 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0912345678"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      CCCD / CMND
                    </label>
                    <input
                      type="text"
                      value={identifyNumber}
                      onChange={(e) => setIdentifyNumber(e.target.value)}
                      placeholder="Số CCCD 12 số"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Giới tính
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* reCAPTCHA Box */}
            <div className="my-2 flex justify-center">
              <div className="flex items-center justify-between border border-slate-200 bg-[#F9FAFB] rounded-lg px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] w-full max-w-[290px]">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCaptchaChecked}
                    onChange={(e) => setIsCaptchaChecked(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-400 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    I'm not a robot
                  </span>
                </label>
                <div className="flex flex-col items-center justify-center pl-2">
                  <svg
                    className="w-7 h-7 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                    reCAPTCHA
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-[0.99] text-sm mt-1"
            >
              {loading ? "Đang tạo tài khoản..." : "Register an Account"}
            </button>
          </form>

          {/* Bottom Link: Do you already have an account? Log in now! */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Do you already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-[#E11D48] hover:underline"
            >
              Log in now!
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
