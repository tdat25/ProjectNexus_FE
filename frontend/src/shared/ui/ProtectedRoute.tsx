import { Navigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[]; // nếu không truyền → chỉ cần đăng nhập
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role ?? ""))
    return <Navigate to="/" replace />;

  return <>{children}</>;
}
