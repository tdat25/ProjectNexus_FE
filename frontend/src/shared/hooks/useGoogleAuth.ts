import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/**
 * Hook khởi tạo Google Identity Services và trả về hàm trigger popup.
 * @param onCredential - callback nhận ID token (JWT) từ Google khi người dùng chọn tài khoản
 */
export function useGoogleAuth(onCredential: (idToken: string) => void) {
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID) return;

    const init = () => {
      window.google?.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => callbackRef.current(response.credential),
        auto_select: false,
      });
    };

    // GSI script có thể chưa load xong khi component mount
    if (window.google) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          init();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const signInWithGoogle = () => {
    if (!CLIENT_ID) {
      console.warn("VITE_GOOGLE_CLIENT_ID chưa được cấu hình trong .env");
      return;
    }
    window.google?.accounts.id.prompt();
  };

  return { signInWithGoogle, isConfigured: !!CLIENT_ID };
}
