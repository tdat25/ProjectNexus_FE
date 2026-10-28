// ============================================================
// AuthContext - quản lý trạng thái đăng nhập toàn ứng dụng
// Bao gồm: user info, JWT token, login/logout helper
// ============================================================
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { login as apiLogin, loginWithGoogle as apiLoginWithGoogle } from "@shared/api/auth";
import type { LoginResponse } from "@shared/api/auth";

// Type khai báo cho Google Identity Services (loaded qua script tag)
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean }) => void;
          prompt: () => void;
          renderButton: (el: HTMLElement, cfg: object) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface User {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

// Context mặc định trống - sẽ được fill bởi Provider
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lấy user/token từ localStorage khi load trang (nhớ đăng nhập)
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("nexus_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("nexus_token")
  );

  // Helper chung: nhận LoginResponse và lưu vào state + localStorage
  const saveSession = (res: LoginResponse): User => {
    const userData: User = {
      userId: res.userId,
      email: res.email,
      displayName: res.displayName,
      role: res.role,
      avatarUrl: res.avatarUrl ?? null,
    };
    setUser(userData);
    setToken(res.accessToken);
    localStorage.setItem("nexus_token", res.accessToken);
    if (res.refreshToken) localStorage.setItem("nexus_refresh", res.refreshToken);
    localStorage.setItem("nexus_user", JSON.stringify(userData));
    return userData;
  };

  // Đăng nhập email/password — trả về User để caller kiểm tra role
  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiLogin({ email, password });
    return saveSession(res);
  };

  // Đăng nhập Google — trả về User để caller kiểm tra role
  const loginWithGoogle = async (idToken: string): Promise<User> => {
    const res = await apiLoginWithGoogle(idToken);
    return saveSession(res);
  };

  // Cập nhật thông tin user trong local context & localStorage mà không cần đăng nhập lại
  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("nexus_user", JSON.stringify(updated));
      return updated;
    });
  };

  // Đăng xuất: xóa state và localStorage
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_refresh");
    localStorage.removeItem("nexus_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoggedIn: !!user, login, loginWithGoogle, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook tiện dùng trong component
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng bên trong AuthProvider");
  return ctx;
}
