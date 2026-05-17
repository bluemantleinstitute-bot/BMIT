"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Pause, Play, Settings, Shield, Volume2, VolumeX } from "lucide-react";
import "@/styles/plyr-custom.css";

interface PremiumVideoPlayerProps {
  url: string;
  title: string;
  onEnded?: () => void;
}

type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getDuration: () => number;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getAvailableQualityLevels: () => string[];
  getPlaybackQuality: () => string;
  setPlaybackQuality: (quality: string) => void;
  setPlaybackQualityRange?: (smallestQuality: string, largestQuality: string) => void;
  loadVideoById: (args: { videoId: string; startSeconds?: number; suggestedQuality?: string }) => void;
  cueVideoById: (args: { videoId: string; startSeconds?: number; suggestedQuality?: string }) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

const loadYouTubeApi = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
};

const qualityLabel: Record<string, string> = {
  highres: "Best",
  hd2160: "2160p",
  hd1440: "1440p",
  hd1080: "1080p",
  hd720: "720p",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
  auto: "Auto",
  default: "Auto",
};

const normalizeQuality = (qualityValue: string) => {
  return qualityValue === "default" ? "auto" : qualityValue || "auto";
};

const youtubeQualityValue = (qualityValue: string) => {
  return qualityValue === "auto" ? "default" : qualityValue;
};

const extractVideoId = (url: string) => {
  const cleanUrl = url.trim();
  if (cleanUrl.includes("youtu.be/")) return cleanUrl.split("youtu.be/")[1]?.split(/[?#]/)[0] || "";
  if (cleanUrl.includes("embed/")) return cleanUrl.split("embed/")[1]?.split(/[?#]/)[0] || "";
  if (cleanUrl.includes("v=")) return cleanUrl.split("v=")[1]?.split("&")[0] || "";
  if (cleanUrl.length === 11 && !cleanUrl.includes("/") && !cleanUrl.includes(".")) return cleanUrl;
  return cleanUrl;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const rounded = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export function PremiumVideoPlayer({ url, title, onEnded }: PremiumVideoPlayerProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const youtubeMountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const requestedQualityRef = useRef("auto");

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(80);
  const [qualities, setQualities] = useState<string[]>([]);
  const [quality, setQuality] = useState("auto");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const videoId = useMemo(() => extractVideoId(url || ""), [url]);
  const progress = duration ? (currentTime / duration) * 100 : 0;

  const syncPlayerState = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const nextDuration = player.getDuration?.() || 0;
    const nextCurrent = player.getCurrentTime?.() || 0;
    setDuration(nextDuration);
    setCurrentTime(nextCurrent);
    setMuted(Boolean(player.isMuted?.()));
    setVolumeState(player.getVolume?.() ?? 80);

    const nextQualities = player.getAvailableQualityLevels?.() || [];
    setQualities(Array.from(new Set(["auto", ...nextQualities.filter((item) => item && item !== "auto" && item !== "default")])));
    const playbackQuality = normalizeQuality(player.getPlaybackQuality?.() || "auto");
    if (requestedQualityRef.current === "auto") {
      setQuality(playbackQuality);
    }
  }, []);

  const applyRequestedQuality = useCallback((nextQuality: string, resumePlayback: boolean) => {
    const player = playerRef.current;
    if (!player) return;

    const targetQuality = youtubeQualityValue(nextQuality);
    const resumeAt = Math.max(0, player.getCurrentTime?.() || 0);

    player.setPlaybackQuality(targetQuality);
    player.setPlaybackQualityRange?.(targetQuality, targetQuality);

    const loadArgs = {
      videoId,
      startSeconds: resumeAt,
      suggestedQuality: targetQuality,
    };

    if (resumePlayback) {
      player.loadVideoById(loadArgs);
      window.setTimeout(() => player.playVideo(), 250);
    } else {
      player.cueVideoById(loadArgs);
      window.setTimeout(() => {
        player.seekTo(resumeAt, true);
        player.pauseVideo();
      }, 250);
    }

    window.setTimeout(() => {
      player.setPlaybackQuality(targetQuality);
      player.setPlaybackQualityRange?.(targetQuality, targetQuality);
      syncPlayerState();
    }, 900);
  }, [syncPlayerState, videoId]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);

    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    if (settingsOpen) return;

    controlsTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 1600);
  }, [settingsOpen]);

  useEffect(() => {
    revealControls();
    return () => {
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    };
  }, [revealControls]);

  useEffect(() => {
    if (!videoId || !youtubeMountRef.current) return;

    let disposed = false;
    setReady(false);
    setIsPlaying(false);
    setCurrentTime(0);

    loadYouTubeApi().then(() => {
      if (disposed || !youtubeMountRef.current || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(youtubeMountRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (disposed) return;
            setReady(true);
            syncPlayerState();
            progressTimerRef.current = window.setInterval(syncPlayerState, 500);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              revealControls();
            }
            if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              revealControls();
            }
            if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              onEnded?.();
            }
          },
          onPlaybackQualityChange: (event: any) => {
            if (requestedQualityRef.current === "auto") {
              setQuality(normalizeQuality(event.data));
            }
          },
        },
      });
    });

    return () => {
      disposed = true;
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [onEnded, revealControls, syncPlayerState, videoId]);

  const togglePlay = () => {
    if (!ready) return;
    if (isPlaying) playerRef.current?.pauseVideo();
    else playerRef.current?.playVideo();
  };

  const toggleMute = () => {
    if (muted) playerRef.current?.unMute();
    else playerRef.current?.mute();
    syncPlayerState();
  };

  const updateVolume = (nextVolume: number) => {
    playerRef.current?.setVolume(nextVolume);
    if (nextVolume > 0) playerRef.current?.unMute();
    setVolumeState(nextVolume);
    setMuted(nextVolume === 0);
  };

  const seekToProgress = (nextProgress: number) => {
    if (!duration) return;
    const nextTime = (nextProgress / 100) * duration;
    playerRef.current?.seekTo(nextTime, true);
    setCurrentTime(nextTime);
  };

  const changeQuality = (nextQuality: string) => {
    requestedQualityRef.current = nextQuality;
    setQuality(nextQuality);
    setSettingsOpen(false);
    applyRequestedQuality(nextQuality, isPlaying);
  };

  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    if (!shell || !document.fullscreenEnabled) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shell.requestFullscreen();
  };

  if (!videoId) return <div className="aspect-video rounded-2xl bg-black animate-pulse" />;

  return (
    <div
      ref={shellRef}
      className="secure-video-shell relative w-full aspect-video overflow-hidden rounded-2xl border border-outline_variant/10 bg-black shadow-2xl"
      onContextMenu={(event) => event.preventDefault()}
      onMouseMove={revealControls}
      onMouseEnter={revealControls}
      onTouchStart={revealControls}
    >
      <div className="secure-youtube-frame absolute inset-0" ref={youtubeMountRef} aria-hidden="true" />
      <button
        type="button"
        onClick={togglePlay}
        className="absolute inset-0 z-10 cursor-default bg-transparent"
        aria-label={isPlaying ? "Pause video" : "Play video"}
      />

      <div
        className={`pointer-events-none absolute left-4 top-4 z-20 flex max-w-[70%] items-center gap-2 rounded-lg border border-white/10 bg-black/55 px-3 py-2 text-white backdrop-blur transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Shield className="h-4 w-4 shrink-0 text-cyan-300" />
        <span className="truncate text-xs font-bold">{title}</span>
      </div>

      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-on_primary shadow-glow-primary transition hover:scale-105"
          aria-label="Play video"
        >
          <Play className="h-7 w-7 fill-current" />
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-4 pt-16 text-white transition-all duration-300 ${
          controlsVisible || settingsOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-5 opacity-0 pointer-events-none"
        }`}
      >
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(event) => seekToProgress(Number(event.target.value))}
          className="secure-progress mb-3 w-full"
          aria-label="Video progress"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={togglePlay} className="secure-control" aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
          </button>
          <span className="min-w-[88px] text-xs font-semibold text-white/80">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button type="button" onClick={toggleMute} className="secure-control" aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : volume}
            onChange={(event) => updateVolume(Number(event.target.value))}
            className="secure-volume"
            aria-label="Volume"
          />

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="secure-control" aria-label="Quality">
                <Settings className="h-4 w-4" />
              </button>
              {settingsOpen && (
                <div className="absolute bottom-11 right-0 w-32 overflow-hidden rounded-lg border border-white/10 bg-[#08131f] py-1 shadow-2xl">
                  {qualities.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => changeQuality(item)}
                      className={`block w-full px-3 py-2 text-left text-xs font-bold transition hover:bg-primary/20 ${
                        quality === item ? "text-primary" : "text-white"
                      }`}
                    >
                      {qualityLabel[item] || item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={toggleFullscreen} className="secure-control" aria-label="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
