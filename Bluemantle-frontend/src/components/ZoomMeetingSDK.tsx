"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Maximize2,
  RotateCcw,
  Shield,
  Video,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type ZoomClient = {
  init: (args: Record<string, unknown>) => Promise<unknown>;
  join: (args: Record<string, unknown>) => Promise<unknown>;
  leaveMeeting?: () => Promise<unknown>;
  destroyClient?: () => void;
  on?: (event: string, callback: (payload: unknown) => void) => void;
  off?: (event: string, callback: (payload: unknown) => void) => void;
};

type ZoomClientViewGlobal = {
  setZoomJSLib?: (path: string, dir: string) => void;
  preLoadWasm?: () => void;
  prepareWebSDK?: () => void;
  i18n?: {
    load?: (language: string) => void;
    reload?: (language: string) => void;
  };
  init: (args: Record<string, unknown>) => void;
  join: (args: Record<string, unknown>) => void;
  leaveMeeting?: (args?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    ZoomMtg?: ZoomClientViewGlobal;
    __bluemantleZoomClientPromise?: Promise<ZoomClientViewGlobal>;
  }
}

interface ZoomMeetingProps {
  classId: string;
  meetingNumber: string;
  password?: string;
  userName: string;
  userEmail: string;
  role: number;
  leaveUrl: string;
  topic?: string;
  duration?: number;
}

const describeZoomError = (error: unknown) => {
  if (!error) return "Zoom could not start. Please try again.";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    const parsed = JSON.stringify(error);
    return parsed === "{}" ? "Zoom could not start. Please try again." : parsed;
  } catch {
    return "Zoom could not start. Please try again.";
  }
};

const ZOOM_SDK_VERSION = "3.13.2";
const zoomCdnStyles = [
  `https://source.zoom.us/${ZOOM_SDK_VERSION}/css/bootstrap.css`,
  `https://source.zoom.us/${ZOOM_SDK_VERSION}/css/react-select.css`,
];

const zoomCdnScripts = [
  `https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/vendor/react.min.js`,
  `https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/vendor/react-dom.min.js`,
  `https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/vendor/redux.min.js`,
  `https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/vendor/redux-thunk.min.js`,
  `https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/vendor/lodash.min.js`,
  `https://source.zoom.us/zoom-meeting-${ZOOM_SDK_VERSION}.min.js`,
];

const ZOOM_READY_SELECTORS = [
  ".meeting-app",
  ".meeting-client",
  ".main-layout",
  ".video-share-layout",
  ".gallery-video-container",
  ".participants-section-container",
  ".join-dialog",
];

const loadStyleOnce = (href: string) => {
  if (document.querySelector(`link[href="${href}"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
};

const loadScriptOnce = (src: string) => {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existingScript?.dataset.loaded === "true") {
      resolve();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });
};

const loadZoomClientView = async () => {
  if (window.ZoomMtg) return window.ZoomMtg;

  window.__bluemantleZoomClientPromise ??= (async () => {
    zoomCdnStyles.forEach(loadStyleOnce);

    for (const src of zoomCdnScripts) {
      await loadScriptOnce(src);
    }

    if (!window.ZoomMtg) {
      throw new Error("Zoom client did not initialize.");
    }

    window.ZoomMtg.setZoomJSLib?.(`https://source.zoom.us/${ZOOM_SDK_VERSION}/lib`, "/av");
    window.ZoomMtg.preLoadWasm?.();
    window.ZoomMtg.prepareWebSDK?.();
    window.ZoomMtg.i18n?.load?.("en-US");
    window.ZoomMtg.i18n?.reload?.("en-US");

    return window.ZoomMtg;
  })();

  return window.__bluemantleZoomClientPromise;
};

export default function ZoomMeetingSDK({
  classId,
  meetingNumber,
  password,
  userName,
  userEmail,
  role,
  leaveUrl,
  topic,
  duration,
}: ZoomMeetingProps) {
  const zoomRootRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<ZoomClient | null>(null);
  const mountedRef = useRef(true);
  const statusRef = useRef<"booting" | "joining" | "connected" | "closed" | "error">("booting");
  const joinFallbackTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"booting" | "joining" | "connected" | "closed" | "error">("booting");
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isHost = role === 1;
  const cleanedMeetingNumber = useMemo(() => String(meetingNumber || "").replace(/\D/g, ""), [meetingNumber]);
  const displayName = useMemo(() => (userName || (isHost ? "Faculty" : "Student")).trim(), [isHost, userName]);

  const applyZoomStageLayout = useCallback(() => {
    const stage = zoomRootRef.current;
    if (!stage) return null;

    let zoomRoot = document.getElementById("zmmtg-root");
    if (!zoomRoot) {
      zoomRoot = document.createElement("div");
      zoomRoot.id = "zmmtg-root";
    }

    if (zoomRoot.parentElement !== stage) {
      stage.appendChild(zoomRoot);
    }

    document.body.classList.add("bluemantle-zoom-active");
    document.body.classList.toggle("bluemantle-zoom-host", isHost);
    document.body.classList.toggle("bluemantle-zoom-student", !isHost);
    stage.classList.add("bluemantle-zoom-stage");

    Object.assign(zoomRoot.style, {
      display: "block",
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      minWidth: "100%",
      minHeight: "100%",
      zIndex: "2",
      background: "#000",
      overflow: "hidden",
    });

    return zoomRoot;
  }, [isHost]);

  const updateStatus = useCallback((nextStatus: typeof status) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const hasRenderedZoomUi = useCallback(() => {
    const zoomRoot = applyZoomStageLayout();
    if (zoomRoot?.children.length) return true;

    return ZOOM_READY_SELECTORS.some((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return false;

      const box = element.getBoundingClientRect();
      return box.width > 120 && box.height > 120;
    });
  }, [applyZoomStageLayout]);

  const markConnectedWhenZoomRenders = useCallback(() => {
    if (!mountedRef.current || statusRef.current !== "joining") return;
    if (hasRenderedZoomUi()) updateStatus("connected");
  }, [hasRenderedZoomUi, updateStatus]);

  const leaveRoom = useCallback(async () => {
    try {
      await clientRef.current?.leaveMeeting?.();
    } catch {
      // The SDK may already be disconnected. Navigation is still the desired result.
    } finally {
      window.location.href = leaveUrl;
    }
  }, [leaveUrl]);

  const enterFullscreen = useCallback(async () => {
    const root = zoomRootRef.current;
    if (!root || !document.fullscreenEnabled) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await root.requestFullscreen();
      }
    } catch {
      setError("Fullscreen is blocked by the browser for this tab.");
    }
  }, []);

  const startEmbeddedMeeting = useCallback(async () => {
    if (!classId || !cleanedMeetingNumber || !zoomRootRef.current) {
      updateStatus("error");
      setError("This class is missing Zoom meeting data. Please recreate the session or contact admin.");
      return;
    }

    updateStatus("joining");
    setError("");
    applyZoomStageLayout();
    if (joinFallbackTimerRef.current) {
      window.clearTimeout(joinFallbackTimerRef.current);
      joinFallbackTimerRef.current = null;
    }

    try {
      const [ZoomMtg, signatureRes] = await Promise.all([
        loadZoomClientView(),
        apiRequest("/zoom/generate-signature", {
          method: "POST",
          body: JSON.stringify({
            classId,
            meetingNumber: cleanedMeetingNumber,
            role: isHost ? 1 : 0,
          }),
        }),
      ]);

      if (!mountedRef.current) return;
      if (!signatureRes.success || !signatureRes.signature) {
        throw new Error(signatureRes.message || "Unable to authorize this Zoom session.");
      }

      const joinMeeting = () => {
        ZoomMtg.join({
          signature: signatureRes.signature,
          sdkKey: signatureRes.sdkKey,
          meetingNumber: signatureRes.meetingNumber || cleanedMeetingNumber,
          passWord: signatureRes.password ?? password ?? "",
          userName: displayName,
          userEmail: userEmail || "",
          tk: "",
          zak: isHost ? signatureRes.zak || "" : "",
          success: () => {
            if (mountedRef.current) updateStatus("connected");
          },
          error: (joinError: unknown) => {
            if (!mountedRef.current) return;
            updateStatus("error");
            setError(describeZoomError(joinError));
          },
        });

        joinFallbackTimerRef.current = window.setTimeout(() => {
          if (!mountedRef.current || statusRef.current !== "joining") return;
          if (hasRenderedZoomUi()) {
            updateStatus("connected");
            return;
          }

          updateStatus("error");
          setError("Zoom connected, but the classroom view did not mount on screen. Please retry the embedded room.");
        }, 18000);
      };

      ZoomMtg.init({
        leaveUrl: window.location.origin + leaveUrl,
        patchJsMedia: true,
        leaveOnPageUnload: true,
        success: joinMeeting,
        error: (initError: unknown) => {
          if (!mountedRef.current) return;
          updateStatus("error");
          setError(describeZoomError(initError));
        },
      });
    } catch (err) {
      console.error("Embedded Zoom failed:", err);
      if (!mountedRef.current) return;
      updateStatus("error");
      setError(describeZoomError(err));
    }
  }, [applyZoomStageLayout, classId, cleanedMeetingNumber, displayName, hasRenderedZoomUi, isHost, leaveUrl, password, updateStatus, userEmail]);

  useEffect(() => {
    mountedRef.current = true;
    applyZoomStageLayout();
    startEmbeddedMeeting();

    const fullscreenHandler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const zoomRenderObserver = new MutationObserver(markConnectedWhenZoomRenders);
    const zoomRenderPoller = window.setInterval(() => {
      applyZoomStageLayout();
      markConnectedWhenZoomRenders();
    }, 500);

    document.addEventListener("fullscreenchange", fullscreenHandler);
    zoomRenderObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mountedRef.current = false;
      document.removeEventListener("fullscreenchange", fullscreenHandler);
      zoomRenderObserver.disconnect();
      window.clearInterval(zoomRenderPoller);
      if (joinFallbackTimerRef.current) {
        window.clearTimeout(joinFallbackTimerRef.current);
        joinFallbackTimerRef.current = null;
      }
      document.body.classList.remove("bluemantle-zoom-active", "bluemantle-zoom-host", "bluemantle-zoom-student");
      window.ZoomMtg?.leaveMeeting?.({});
    };
  }, [applyZoomStageLayout, markConnectedWhenZoomRenders, startEmbeddedMeeting]);

  const busy = status === "booting" || status === "joining";

  return (
    <div className="fixed inset-0 z-[10000] bg-[#071019] text-white">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#08131f]/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={leaveRoom}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Leave classroom"
            title="Leave classroom"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white md:text-base">{topic || "Live Classroom"}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {isHost ? "Faculty host" : "Student participant"}
              {duration ? ` - ${duration} min` : ""}
              {cleanedMeetingNumber ? ` - Meeting ${cleanedMeetingNumber}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 sm:flex">
            {status === "connected" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : status === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
            )}
            {status === "connected" ? "Connected" : status === "error" ? "Needs attention" : "Joining"}
          </div>
          <button
            type="button"
            onClick={enterFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="grid h-[calc(100vh-4rem)] grid-rows-[1fr_auto]">
        <section className="relative min-h-0 overflow-hidden bg-black">
          <div ref={zoomRootRef} className="absolute inset-0 h-full w-full bg-black" />

          {busy && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#071019]">
              <div className="w-full max-w-sm px-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                </div>
                <h1 className="text-xl font-semibold text-white">Opening secure classroom</h1>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  We are validating access, signing the Zoom room, and loading the embedded client.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#071019] p-6">
              <div className="w-full max-w-lg rounded-lg border border-red-400/25 bg-[#111b26] p-6 text-center shadow-2xl">
                <AlertCircle className="mx-auto h-12 w-12 text-red-300" />
                <h1 className="mt-4 text-xl font-semibold text-white">Classroom could not open</h1>
                <p className="mt-3 text-sm leading-6 text-slate-300">{error}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={startEmbeddedMeeting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retry embedded room
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === "closed" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#071019] p-6">
              <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#111b26] p-6 text-center">
                <Video className="mx-auto h-12 w-12 text-cyan-300" />
                <h1 className="mt-4 text-xl font-semibold text-white">Meeting closed</h1>
                <p className="mt-2 text-sm text-slate-400">You can return to your dashboard or reconnect if the session is still active.</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={leaveRoom}
                    className="rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
                  >
                    Return
                  </button>
                  <button
                    type="button"
                    onClick={startEmbeddedMeeting}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Reconnect
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#08131f] px-4 py-3 text-xs text-slate-400 md:px-6">
          <span className="inline-flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-300" />
            Access is verified server-side before a Zoom signature is issued.
          </span>
          <span className="truncate">Signed in as {displayName}</span>
        </footer>
      </main>
    </div>
  );
}
