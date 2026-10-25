// ============================================================
// Trang đăng nhập Nexus — Thiết kế theo mockup Portal
// ============================================================
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@app/providers/AuthContext";
import { useCart } from "@app/providers/CartContext";
import { getCart } from "@shared/api/commerce";
import toast from "react-hot-toast";
import { ShieldCheck, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

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

export default function LoginPage() {
  const { login } = useAuth();
  const { mergeGuestCartToBackend } = useCart();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaChecked, setIsCaptchaChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trang sẽ redirect sau khi đăng nhập (mặc định về /)
  const redirectTo = (location.state as any)?.from ?? "/";
  const forwardState = (location.state as any)?.selectedItems
    ? {
        selectedItems: (location.state as any).selectedItems,
        checkoutSource: (location.state as any).checkoutSource,
      }
    : undefined;

  const handleGoogleLogin = () => {
    // Chưa có code BE nên không thực hiện gì
    toast("Tính năng đăng nhập với Google đang được phát triển!", {
      icon: "ℹ️",
      duration: 3500,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!account.trim() || !password) {
      const msg = "Vui lòng nhập tên tài khoản/email và mật khẩu.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!isCaptchaChecked) {
      const msg = "Vui lòng tích xác nhận 'I'm not a robot'.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await login(account.trim(), password);

      // Đồng bộ guest cart sau khi login và làm mới dữ liệu hiển thị trên Navbar/Cart.
      const syncResult = await mergeGuestCartToBackend().catch(() => ({
        syncedCount: 0,
        failedCount: 0,
      }));
      await queryClient.invalidateQueries({ queryKey: ["cart"] });

      if (redirectTo === "/checkout" && forwardState?.selectedItems) {
        if (syncResult.failedCount > 0) {
          toast.error("Một số sản phẩm chưa đồng bộ được. Vui lòng kiểm tra lại giỏ hàng.");
          navigate("/cart", { replace: true });
          return;
        }

        // Dùng dữ liệu mới nhất cho checkout từ Cart; với Buy Now vẫn giữ số lượng người dùng yêu cầu.
        const latestCart = await queryClient.fetchQuery({
          queryKey: ["cart"],
          queryFn: getCart,
        });
        const requestedItems = forwardState.selectedItems as Array<{
          productId: string;
          quantity: number;
        }>;
        const latestById = new Map(latestCart.items.map((item) => [item.productId, item]));
        const missingSelected = requestedItems.some((item) => !latestById.has(item.productId));

        if (missingSelected) {
          toast.error("Không tìm thấy một số sản phẩm sau khi đồng bộ. Vui lòng kiểm tra giỏ hàng.");
          navigate("/cart", { replace: true });
          return;
        }

        const refreshedSelectedItems = requestedItems.map((requested) => {
          const latest = latestById.get(requested.productId)!;
          const quantity = (location.state as any)?.checkoutSource === "cart"
            ? latest.quantity
            : requested.quantity;
          return {
            ...latest,
            quantity,
            subtotal: latest.unitPrice * quantity,
          };
        });

        toast.success("Đăng nhập thành công!");
        navigate("/checkout", {
          replace: true,
          state: { selectedItems: refreshedSelectedItems },
        });
        return;
      }

      toast.success("Đăng nhập thành công!");
      navigate(redirectTo, { replace: true, state: forwardState });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message ?? "Tài khoản hoặc mật khẩu không chính xác.";
      setErrorMsg(msg);
      if (status === 403) {
        toast.error(msg, { duration: 6000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-[480px]">
        {/* Card Container */}
        <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1F2] border border-[#FFE4E6] text-[#E11D48] text-xs font-bold tracking-wide mb-4">
            <ShieldCheck size={14} className="text-[#E11D48]" />
            <span>MEMBER LOGIN PORTAL</span>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Welcome Back
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 mb-7 leading-relaxed">
            Please enter your account and password to continue accessing.
          </p>

          {/* Quick login with Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2.5 transition active:scale-[0.99] shadow-sm"
          >
            <GoogleIcon />
            <span>Quick login with Google</span>
          </button>

          {/* Divider: OR BY ACCOUNT */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              OR BY ACCOUNT
            </span>
          </div>

          {/* Error alert if any */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Password
                </label>
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast("Vui lòng liên hệ quản trị viên để khôi phục mật khẩu.", { icon: "🔑" });
                  }}
                  className="text-xs font-semibold text-[#E11D48] hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock
                  className="absolute left-3.5 text-slate-400 pointer-events-none"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
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
              {loading ? "Đang đăng nhập..." : "Log in"}
            </button>
          </form>

          {/* Bottom link: Don't have an account yet? Register now! */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Don't have an account yet?{" "}
            <Link
              to="/register"
              className="font-bold text-[#E11D48] hover:underline"
            >
              Register now!
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
