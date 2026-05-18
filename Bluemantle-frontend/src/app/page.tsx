"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { KnowledgeCard, CardHeader, CardBody } from "@/components/KnowledgeCard";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";
import { apiRequest, clearBrowserAuthSession, persistBrowserAuthSession } from "@/lib/api";

type LoginResponse = {
  success?: boolean;
  requireOtp?: boolean;
  token?: string;
  user?: {
    role?: string;
    name?: string;
    userId?: string;
  };
};

const dashboardPathByRole: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
  owner: "/admin",
};

function completeLogin(data: LoginResponse) {
  persistBrowserAuthSession(data);
  const role = data?.user?.role;
  const dashboardPath = role ? dashboardPathByRole[role] : undefined;
  window.location.assign(dashboardPath || "/");
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isOtpStep, setIsOtpStep] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data: LoginResponse = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ userId: email, password }),
      });

      if (data.requireOtp) {
        setIsOtpStep(true);
      } else if (data.success) {
        completeLogin(data);
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials or unauthorized account.");
    } finally {
      setLoading(false);
    }
  };

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const otp = otpDigits.join("");
      const data: LoginResponse = await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ userId: email, otp }),
      });

      if (data.success) {
        completeLogin(data);
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("switch") === "1") {
      clearBrowserAuthSession();
      window.history.replaceState(null, "", "/");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#071019] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,162,207,0.24),transparent_32%),radial-gradient(circle_at_84%_78%,rgba(96,198,255,0.16),transparent_30%)]" />
      <div className="absolute inset-y-0 left-0 hidden w-[46vw] bg-[#050b13] lg:block" />
      <div className="absolute inset-y-0 left-0 hidden w-[46vw] overflow-hidden border-r border-cyan-300/10 lg:block">
        <Image
          src="/BLUEMANTLE LOGO.png"
          alt=""
          width={900}
          height={900}
          priority
          className="absolute left-1/2 top-[44%] w-[31rem] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-25 drop-shadow-[0_0_55px_rgba(0,162,207,0.34)]"
        />
        <div className="absolute inset-x-14 bottom-16 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200">Bluemantle</p>
          <h2 className="mt-4 max-w-md text-4xl font-manrope font-black leading-tight text-white">Academic Atelier</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
            Secure access for live classes, recorded lessons, notes, and progress tracking.
          </p>
        </div>
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 lg:ml-[46vw]">
        <KnowledgeCard className="w-full max-w-[430px] rounded-[28px] border border-cyan-300/20 bg-[#09131f]/92 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.48),0_0_44px_rgba(0,162,207,0.12)] backdrop-blur-xl md:p-10">
        <CardHeader className="text-center mb-9">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-cyan-300/20 bg-white shadow-[0_18px_55px_rgba(0,162,207,0.32)]">
            <Image
              src="/BLUEMANTLE LOGO.png"
              alt="Bluemantle"
              width={92}
              height={92}
              priority
              className="h-20 w-20 object-contain"
            />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Bluemantle</p>
          <h1 className="text-3xl font-manrope font-black tracking-tight mb-2 text-white">Academic Atelier</h1>
          <p className="text-sm text-slate-400">
            {isOtpStep ? "Device Verification required" : "Sign in to your learning portal"}
          </p>
        </CardHeader>
        
        <CardBody>
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-400/25 rounded-xl text-red-200 text-sm font-bold flex items-center gap-3 animate-shake">
               <ShieldAlert className="w-5 h-5" />
               {error}
            </div>
          )}
          {!isOtpStep ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-bold mb-2 text-slate-100">User ID</label>
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-cyan-300/12 bg-[#0d1b2a] px-4 py-3.5 text-white shadow-sm outline-none transition-all placeholder:text-slate-500 focus:border-cyan-300/50 focus:bg-[#102033] focus:ring-4 focus:ring-cyan-300/10"
                  placeholder="Enter your unique ID"
                  suppressHydrationWarning
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-bold mb-2 text-slate-100 flex justify-between">
                  Password
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-cyan-300 hover:text-cyan-100 text-xs font-black uppercase transition-colors"
                    suppressHydrationWarning
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-cyan-300/12 bg-[#0d1b2a] px-4 py-3.5 text-white shadow-sm outline-none transition-all focus:border-cyan-300/50 focus:bg-[#102033] focus:ring-4 focus:ring-cyan-300/10"
                  suppressHydrationWarning
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={cn(
                    "brand-glow-button w-full rounded-2xl bg-[#00a2cf] px-4 py-3.5 text-sm font-black text-white shadow-[0_18px_42px_rgba(0,162,207,0.28)] transition-all duration-300 hover:bg-[#18bce8] hover:shadow-[0_20px_48px_rgba(0,162,207,0.38)] active:scale-[0.98]",
                    loading && "opacity-70 pointer-events-none"
                  )}
                  suppressHydrationWarning
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-6">
              <p className="text-xs text-slate-300 text-center mb-6 border border-cyan-300/20 bg-cyan-300/5 p-3 rounded-lg">
                We detected a login from a new device. Please enter the 6-digit code sent to your registered email.
              </p>
              
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                     key={idx}
                     type="text"
                     maxLength={1}
                     value={digit}
                     onChange={(e) => {
                       const newDigits = [...otpDigits];
                       newDigits[idx] = e.target.value;
                       setOtpDigits(newDigits);
                       // Auto-focus next input
                       if (e.target.value && idx < 5) {
                         const nextInput = e.target.nextElementSibling as HTMLInputElement;
                         if (nextInput) nextInput.focus();
                       }
                     }}
                     className="h-14 w-12 rounded-2xl border border-cyan-300/12 bg-[#0d1b2a] text-center font-manrope text-xl font-bold text-white outline-none transition-all focus:border-cyan-300/50 focus:bg-[#102033] focus:ring-4 focus:ring-cyan-300/10"
                     suppressHydrationWarning
                  />
                ))}
              </div>
              
              <div className="pt-6">
                 <button 
                  type="submit" 
                  disabled={loading}
                  className={cn(
                    "brand-glow-button w-full rounded-2xl bg-[#00a2cf] px-4 py-3.5 text-sm font-black text-white shadow-[0_18px_42px_rgba(0,162,207,0.28)] transition-all duration-300 hover:bg-[#18bce8] hover:shadow-[0_20px_48px_rgba(0,162,207,0.38)] active:scale-[0.98]",
                    loading && "opacity-70 pointer-events-none"
                  )}
                  suppressHydrationWarning
                >
                  {loading ? "Verifying..." : "Verify Device"}
                </button>
              </div>
              
              <div className="text-center mt-4">
                 <button type="button" className="text-sm font-bold text-cyan-300 hover:text-cyan-100 hover:underline" suppressHydrationWarning>Resend OTP</button>
              </div>
            </form>
          )}
          
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Don&apos;t have an account? <a href="#" className="font-semibold text-cyan-300 hover:text-cyan-100 ml-1">Request Access</a>
            </p>
          </div>
        </CardBody>
      </KnowledgeCard>
      </main>
    </div>
  );
}
