// ============================================================
// API calls cho UserService - đăng ký, đăng nhập, profile
// ============================================================
import { userClient } from "./client";

// Kiểu dữ liệu trả về khi login
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl?: string | null;
}

// Đăng ký tài khoản mới — backend nhận đủ trường (fullName, phoneNumber, ...)
export const register = (data: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  identifyNumber?: string;
  gender?: string;
  address?: string;
  dateOfBirth?: string;
}) => userClient.post<{ userId: string }>("/api/v1/users", data).then((r) => r.data);

// Đăng nhập - trả về JWT token
export const login = (data: { email: string; password: string }) =>
  userClient.post<LoginResponse>("/api/v1/auth/login", data).then((r) => r.data);

// Đăng nhập bằng Google — gửi ID token lên backend để xác thực
export const loginWithGoogle = (idToken: string) =>
  userClient.post<LoginResponse>("/api/v1/auth/google", { idToken }).then((r) => r.data);

// Xem profile người dùng theo ID
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  address?: string;
  dateOfBirth?: string;
  trustLevel?: string;
  reputationScore?: number;
  role?: string;
  avatarUrl?: string | null;
  roleId?: string;
}

export const getProfile = (userId: string) =>
  userClient.get<UserProfile>(`/api/v1/users/${userId}`).then((r) => r.data);

// Lấy thông tin tài khoản của chính mình (/api/v1/users/me)
export const getMyProfile = () =>
  userClient.get<UserProfile>("/api/v1/users/me").then((r) => r.data);

// Cập nhật thông tin profile của user (họ tên, email, sđt, giới tính, ngày sinh, địa chỉ, avatar)
export interface UpdateProfileData {
  fullName: string;
  gender?: string;
  address?: string;
  dateOfBirth?: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
}

export const updateProfile = (userId: string, data: UpdateProfileData) =>
  userClient.put(`/api/v1/users/${userId}`, data).then((r) => r.data);

// Refresh JWT access token using a stored refresh token
export const refreshToken = (token: string) =>
  userClient.post<{ accessToken: string; refreshToken: string }>(
    "/api/v1/auth/refresh", { token }
  ).then((r) => r.data);

// Xác thực email sau đăng ký
export const verifyEmail = (token: string) =>
  userClient.post<{ message: string }>("/api/v1/auth/verify-email", { token }).then((r) => r.data);

// ─── Admin user management ─────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  address: string;
  dateOfBirth: string;
  trustLevel: string;
  reputationScore: number;
  roleId: string;
  roleCode: string;
  isEmailVerified: boolean;
  avatarUrl?: string | null;
  isLocked?: boolean;
}

export interface UsersResult {
  items: UserSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export const getUsers = (params?: { search?: string; page?: number; pageSize?: number }) =>
  userClient.get<UsersResult>("/api/v1/users", { params }).then((r) => r.data);

export const changeUserRole = (userId: string, roleId: string) =>
  userClient.patch(`/api/v1/users/${userId}/role`, { roleId }).then((r) => r.data);

export const toggleLockUser = (userId: string) =>
  userClient
    .patch<{ isLocked: boolean; message: string }>(`/api/v1/users/${userId}/lock`)
    .then((r) => r.data);

export const deleteUser = (userId: string) =>
  userClient.delete(`/api/v1/users/${userId}`).then((r) => r.data);


export interface RoleOption { id: string; name: string; code: string; }

export const DEFAULT_ROLES: RoleOption[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Buyer", code: "BUYER" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Seller", code: "SELLER" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Admin", code: "ADMIN" },
];

export const getRoles = () =>
  userClient
    .get<RoleOption[]>("/api/v1/roles")
    .then((r) => (r.data && r.data.length > 0 ? r.data : DEFAULT_ROLES))
    .catch(() => DEFAULT_ROLES);

export interface SellerProfile {
  id: string;
  userId: string;
  shopName: string;
  shopSlug: string;
  description: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isVerified: boolean;
}

export const registerSeller = (data: { shopName: string; description: string }) =>
  userClient.post<{ profileId: string; message: string }>("/api/v1/seller/register", data).then((r) => r.data);

export const getMySellerProfile = () =>
  userClient.get<SellerProfile>("/api/v1/seller/profile").then((r) => r.data);

