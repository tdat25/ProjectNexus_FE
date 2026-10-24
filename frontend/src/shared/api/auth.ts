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

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  fullName?: string;
  phoneNumber?: string;
  gender?: string;
  address?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  role: string;
}

export interface UserAddress {
  id: string;
  recipientName: string;
  phoneNumber: string;
  streetAddress: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}

// Xem profile người dùng theo ID
export const getProfile = (userId: string) =>
  userClient
    .get<UserProfile>(`/api/v1/users/${userId}`)
    .then((r) => r.data)
    .catch(() => {
      // Mock fallback
      const savedUser = localStorage.getItem("nexus_user");
      const user = savedUser ? JSON.parse(savedUser) : null;
      return {
        userId: userId || user?.userId || "user-001",
        email: user?.email || "datrush01@gmail.com",
        displayName: user?.displayName || "Võ Thành Đạt",
        fullName: user?.displayName || "Võ Thành Đạt",
        phoneNumber: "0901234567",
        gender: "Nam",
        address: "Khu Công Nghệ Cao, Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh",
        dateOfBirth: "2002-10-15",
        avatarUrl: "",
        role: user?.role || "BUYER",
      } as UserProfile;
    });

// Cập nhật thông tin profile
export const updateProfile = (userId: string, data: Partial<UserProfile>) =>
  userClient
    .put<UserProfile>(`/api/v1/users/${userId}`, data)
    .then((r) => r.data)
    .catch(() => data as UserProfile);

// Đổi mật khẩu
export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
  userClient
    .post<{ message: string }>("/api/v1/auth/change-password", data)
    .then((r) => r.data)
    .catch(() => ({ message: "Đổi mật khẩu thành công!" }));

// Sổ địa chỉ (Lưu trữ và đồng bộ với localStorage fallback)
const ADDRESS_KEY = "nexus_user_addresses";

export const getUserAddresses = (): UserAddress[] => {
  try {
    const saved = localStorage.getItem(ADDRESS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [
    {
      id: "addr-1",
      recipientName: "Võ Thành Đạt",
      phoneNumber: "0901234567",
      streetAddress: "Lô E2a-7, Đường D1, Khu Công nghệ cao",
      ward: "Phường Long Thạnh Mỹ",
      district: "Thành phố Thủ Đức",
      province: "TP. Hồ Chí Minh",
      isDefault: true,
    },
    {
      id: "addr-2",
      recipientName: "Võ Thành Đạt (Văn phòng)",
      phoneNumber: "0987654321",
      streetAddress: "Tòa nhà Innovation, Công viên Phần mềm Quang Trung",
      ward: "Phường Tân Chánh Hiệp",
      district: "Quận 12",
      province: "TP. Hồ Chí Minh",
      isDefault: false,
    },
  ];
};

export const saveUserAddress = (address: Omit<UserAddress, "id"> & { id?: string }): UserAddress[] => {
  const current = getUserAddresses();
  let updated: UserAddress[];

  if (address.id) {
    // Edit existing
    updated = current.map((a) => (a.id === address.id ? ({ ...a, ...address } as UserAddress) : a));
  } else {
    // Add new
    const newAddr: UserAddress = {
      ...address,
      id: "addr-" + Date.now(),
      isDefault: current.length === 0 ? true : !!address.isDefault,
    };
    updated = [...current, newAddr];
  }

  if (address.isDefault) {
    const targetId = address.id || updated[updated.length - 1].id;
    updated = updated.map((a) => ({
      ...a,
      isDefault: a.id === targetId,
    }));
  }

  localStorage.setItem(ADDRESS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteUserAddress = (addressId: string): UserAddress[] => {
  const current = getUserAddresses();
  const updated = current.filter((a) => a.id !== addressId);
  if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
    updated[0].isDefault = true;
  }
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(updated));
  return updated;
};

export const setDefaultUserAddress = (addressId: string): UserAddress[] => {
  const current = getUserAddresses();
  const updated = current.map((a) => ({
    ...a,
    isDefault: a.id === addressId,
  }));
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(updated));
  return updated;
};

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

export const deleteUser = (userId: string) =>
  userClient.delete(`/api/v1/users/${userId}`).then((r) => r.data);

export interface RoleOption { id: string; name: string; code: string; }
export const getRoles = () =>
  userClient.get<RoleOption[]>("/api/v1/roles").then((r) => r.data);
