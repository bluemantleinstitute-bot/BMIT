export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/, "");
  }
})();

const AUTH_COOKIE_MAX_AGE = 24 * 60 * 60;

type AuthSessionResponse = {
  token?: string;
  user?: {
    role?: string;
    name?: string;
    userId?: string;
  };
};

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function secureCookieAttribute() {
  return isBrowser() && window.location.protocol === "https:" ? "; Secure" : "";
}

export function getBrowserCookie(name: string) {
  if (!isBrowser()) return "";

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
}

function setBrowserCookie(name: string, value: string, maxAge = AUTH_COOKIE_MAX_AGE) {
  if (!isBrowser()) return;

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureCookieAttribute()}`;
}

export function clearBrowserAuthSession() {
  if (!isBrowser()) return;

  ["token", "user_role", "user_name"].forEach((name) => {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secureCookieAttribute()}`;
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=None${secureCookieAttribute()}`;
  });
  localStorage.removeItem("bluemantle_session");
}

export async function logoutBrowserSession() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch (_) {
    // Local cleanup still runs even if the network request is blocked.
  } finally {
    clearBrowserAuthSession();
  }
}

export function persistBrowserAuthSession(data: AuthSessionResponse) {
  if (!data?.token || !data?.user?.role) return;

  setBrowserCookie("token", data.token);
  setBrowserCookie("user_role", data.user.role);
  setBrowserCookie("user_name", data.user.name || "");

  if (isBrowser()) {
    localStorage.setItem(
      "bluemantle_session",
      JSON.stringify({
        role: data.user.role,
        name: data.user.name || "",
        userId: data.user.userId || "",
        savedAt: Date.now(),
      })
    );
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const isServer = typeof window === "undefined";
  const authHeaders: Record<string, string> = {};

  if (isServer) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;
      if (token) {
        authHeaders["Cookie"] = `token=${token}`;
      }
    } catch (e) {
      console.warn("Could not import next/headers on server:", e);
    }
  } else {
    const token = getBrowserCookie("token");
    if (token) {
      authHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    credentials: "include", 
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Don't redirect on auth endpoints — let the login form handle the error message
      const isAuthEndpoint = endpoint.startsWith("/auth/login") || endpoint.startsWith("/auth/verify-otp");

      if (!isAuthEndpoint && (response.status === 401 || response.status === 403)) {
        if (!isServer) {
          clearBrowserAuthSession();
        }
        if (isServer) {
          const { redirect } = await import("next/navigation");
          redirect("/");
        } else {
          window.location.href = "/";
        }
      }
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error: any) {
    // Next.js redirect throws an error called NEXT_REDIRECT. We MUST NOT catch and swallow it.
    if (error.digest && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error(`API Error (${endpoint}):`, error.message);
    throw error;
  }
}
