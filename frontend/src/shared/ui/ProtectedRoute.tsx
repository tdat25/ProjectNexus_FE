// Route bảo vệ - chỉ cho phép truy cập khi đã đăng nhập và đủ quyền (Role)
import { Navigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthContext";
import toast from "react-hot-toast";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRole, allowedRoles }: Props) {
  const { isLoggedIn, user } = useAuth();

  const isRoleDenied = Boolean(
    (requiredRole && user?.role !== requiredRole) ||
    (allowedRoles && allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role)))
  );

  useEffect(() => {
    if (isLoggedIn && isRoleDenied) {
      toast.error("Bạn không có quyền truy cập vào trang này!");
    }
  }, [isLoggedIn, isRoleDenied]);

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (isRoleDenied) return <Navigate to="/" replace />;

  return <>{children}</>;
}

