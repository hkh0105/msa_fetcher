import Cookies from "universal-cookie";

const cookies = new Cookies();
let accessToken = "";
let refreshToken = "";
let refreshingPromise: Promise<void> | null = null;

export function initTokens() {
  accessToken =
    localStorage.getItem("accessToken") || cookies.get("accessToken") || "";
  refreshToken =
    localStorage.getItem("refreshToken") || cookies.get("refreshToken") || "";
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setTokens(newAccessToken: string, newRefreshToken: string) {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  localStorage.setItem("accessToken", newAccessToken);
  localStorage.setItem("refreshToken", newRefreshToken);
  cookies.set("accessToken", newAccessToken, { path: "/" });
  cookies.set("refreshToken", newRefreshToken, { path: "/" });
}

export async function refreshAccessToken(): Promise<void> {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    try {
      const res = await fetch("/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        logout();
        throw new Error("Refresh token failed");
      }

      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
    } catch (error) {
      logout();
      throw error;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

export function logout() {
  accessToken = "";
  refreshToken = "";
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  cookies.remove("accessToken", { path: "/" });
  cookies.remove("refreshToken", { path: "/" });
  window.location.href = "/signout";
}
