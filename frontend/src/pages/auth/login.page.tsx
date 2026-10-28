// ============================================================
// Trang đăng nhập — sau khi login thành công:
//   1. Merge guest cart (localStorage) → backend
//   2. Redirect về trang trước hoặc trang chủ
// ============================================================
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@app/providers/AuthContext";
import { useCart } from "@app/providers/CartContext";
import { useGoogleAuth } from "@shared/hooks/useGoogleAuth";
import toast from "react-hot-toast";
import { Package, Eye, EyeOff, AlertCircle } from "lucide-react";

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

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { mergeGuestCartToBackend } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  const redirectTo = (location.state as any)?.from ?? "/";

  const handleGoogleCredential = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const u = await loginWithGoogle(idToken);
      if (u.role === "BUYER") await mergeGuestCartToBackend().catch(() => {});
      toast.success("Đăng nhập Google thành công!");
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Đăng nhập Google thất bại");
    } finally {
      setGoogleLoading(false);
    }
  };

  const { signInWithGoogle, isConfigured } = useGoogleAuth(handleGoogleCredential);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setEmailErr(null);
    setPasswordErr(null);

    let hasError = false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailErr("Vui lòng nhập địa chỉ email.");
      hasError = true;
    } else if (!emailRegex.test(email.trim())) {
      setEmailErr("Email không đúng định dạng (vd: user@example.com).");
      hasError = true;
    }

    if (!password) {
      setPasswordErr("Vui lòng nhập mật khẩu.");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordErr("Mật khẩu phải có ít nhất 6 ký tự.");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const u = await login(email.trim(), password);

      // Merge guest cart vào backend — chỉ cho BUYER
      if (u.role === "BUYER") await mergeGuestCartToBackend().catch(() => {});

      toast.success("Đăng nhập thành công!");
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Email hoặc mật khẩu không đúng.";
      if (status === 403) {
        setErrorMsg(msg + " Nếu bạn vừa đăng ký, vui lòng kiểm tra hộp thư email (hoặc mục Spam) để kích hoạt tài khoản.");
        toast.error(msg, { duration: 6000 });
      } else if (status === 401) {
        setErrorMsg("Email hoặc mật khẩu không chính xác.");
        toast.error("Email hoặc mật khẩu không chính xác.");
      } else {
        setErrorMsg(msg || "Không thể kết nối đến máy chủ.");
        toast.error(msg || "Đăng nhập thất bại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nexus-50 to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-nexus-600 rounded-2xl shadow-lg mb-4">
            <Package size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng nhập Nexus</h1>
          <p className="text-gray-500 text-sm mt-1">Chào mừng trở lại!</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md p-8 flex flex-col gap-4"
        >
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex gap-2.5 items-start">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailErr) setEmailErr(null);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="example@email.com"
              className={`border rounded-lg px-4 py-2.5 text-sm outline-none transition ${
                emailErr ? "border-red-400 focus:ring-2 focus:ring-red-400" : "border-gray-200 focus:ring-2 focus:ring-nexus-500 focus:border-transparent"
              }`}
              autoFocus
            />
            {emailErr && <span className="text-xs text-red-500 font-medium">{emailErr}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordErr) setPasswordErr(null);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="••••••••"
                className={`w-full border rounded-lg pl-4 pr-11 py-2.5 text-sm outline-none transition ${
                  passwordErr ? "border-red-400 focus:ring-2 focus:ring-red-400" : "border-gray-200 focus:ring-2 focus:ring-nexus-500 focus:border-transparent"
                }`}
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
            {passwordErr && <span className="text-xs text-red-500 font-medium">{passwordErr}</span>}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="mt-2 bg-nexus-600 hover:bg-nexus-700 disabled:bg-nexus-300 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">hoặc</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading || loading || !isConfigured}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-700 font-medium py-2.5 rounded-xl transition-all shadow-sm"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span>{googleLoading ? "Đang xác thực..." : "Đăng nhập với Google"}</span>
          </button>

          {!isConfigured && (
            <p className="text-center text-xs text-amber-600 bg-amber-50 rounded-lg py-2 px-3">
              Google OAuth chưa được cấu hình — xem hướng dẫn bên dưới
            </p>
          )}

          <p className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-nexus-600 font-medium hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
