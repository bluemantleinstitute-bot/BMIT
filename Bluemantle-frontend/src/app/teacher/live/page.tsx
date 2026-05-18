"use client";

import { useState, useEffect } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { 
  Video, Camera, Monitor, Play, Square, Users, 
  Link, FileCheck, Zap, MoreHorizontal, ChevronRight,
  ExternalLink, Layout, MonitorOff, ShieldAlert, Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { formatDateTimeInIst } from "@/lib/ist-time";

interface LiveClass {
  _id: string;
  topic: string;
  date: string;
  duration: number;
  status: string;
  zoomStartUrl?: string;
  batchId: { _id: string; name: string };
}

const getClassEndTime = (liveClass: LiveClass) => {
  return new Date(liveClass.date).getTime() + (Number(liveClass.duration) || 60) * 60000;
};

const getClassStartTime = (liveClass: LiveClass) => new Date(liveClass.date).getTime();

const getClassWindowState = (liveClass: LiveClass | undefined, nowMs: number) => {
  if (!liveClass) return "none";
  if (liveClass.status === "live") return "live";

  const startMs = getClassStartTime(liveClass);
  const endMs = getClassEndTime(liveClass);

  if (liveClass.status === "scheduled" && nowMs >= startMs && nowMs <= endMs) {
    return "ready";
  }

  if (liveClass.status === "scheduled" && nowMs < startMs) {
    return "upcoming";
  }

  return "finished";
};

export default function LiveClassControl() {
  const [sessionActive, setSessionActive] = useState(false);
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [error, setError] = useState("");

  const [waitingStudents] = useState([
    { name: "Julian Mayer", id: "AZ-44821", status: "Waiting" },
    { name: "Sarah Chen", id: "AZ-11203", status: "Waiting" },
  ]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await apiRequest("/classes/teacher");
        if (res.success) {
          setClasses([...res.data].sort((a: LiveClass, b: LiveClass) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } else {
          setError(res.message);
        }
      } catch (err: any) {
        setError("Failed to load classes");
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const liveClass = classes.find((c) => c.status === "live");
  const currentScheduledClass = classes.find((c) => (
    c.status === "scheduled" &&
    getClassStartTime(c) <= nowMs &&
    getClassEndTime(c) >= nowMs
  ));
  const nextScheduledClass = classes.find((c) => (
    c.status === "scheduled" && getClassStartTime(c) > nowMs
  ));
  const upcomingClass = liveClass || currentScheduledClass || nextScheduledClass;
  const classWindowState = getClassWindowState(upcomingClass, nowMs);
  const canEnterClass = classWindowState === "live" || classWindowState === "ready";
  const statusLabel =
    classWindowState === "live" ? "Live" :
    classWindowState === "ready" ? "Ready Now" :
    classWindowState === "upcoming" ? "Scheduled" :
    sessionActive ? "Session Active" :
    "Offline";
  const buttonTitle =
    classWindowState === "live" ? "Join Live Class" :
    classWindowState === "ready" ? "Start Scheduled Class" :
    classWindowState === "upcoming" ? "Not Time Yet" :
    isLaunching ? "Launching..." :
    "No Live Class";

  const handleLaunchSession = async () => {
    if (!upcomingClass) return;

    if (!canEnterClass) {
      alert("This class can be started only during its scheduled live time.");
      return;
    }
    
    try {
      setIsLaunching(true);

      if (upcomingClass.status === "scheduled") {
        await apiRequest(`/classes/${upcomingClass._id}/status`, {
          method: "PUT",
          body: JSON.stringify({ status: "live" })
        });
      }

      setSessionActive(true);

      // Launch Mission Control in a new popup window
      window.open(`/teacher/live/control-center?classId=${upcomingClass._id}&batchId=${upcomingClass.batchId._id}`, "ControlCenter", "width=1200,height=800");

      // Redirect current tab to Zoom Meeting SDK Client View
      window.location.href = `/teacher/live/${upcomingClass._id}/zoom`;

    } catch (err) {
      console.error("Error launching session:", err);
      alert("Failed to start session.");
    } finally {
      setIsLaunching(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest border border-outline_variant/30 px-2 py-0.5 rounded">Protocol Ready</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                canEnterClass || sessionActive ? 'bg-secondary text-on_secondary animate-pulse' : 'bg-error/10 text-error'
              }`}>
                {statusLabel}
              </span>
           </div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-1">
             {upcomingClass ? upcomingClass.topic : "No Upcoming Sessions"}
          </h1>
          {!upcomingClass && !error && (
            <p className="text-on_surface_variant text-sm max-w-xl">
              No scheduled sessions are assigned to this teacher account. Ask an admin to assign a batch or schedule a live class for this faculty member.
            </p>
          )}
          {upcomingClass && (
            <p className="text-on_surface_variant text-sm flex items-center gap-2">
               <Video className="w-4 h-4 text-primary" /> Interactive Seminar - {formatDateTimeInIst(upcomingClass.date)} ({upcomingClass.duration}m)
            </p>
          )}
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleLaunchSession}
             disabled={!canEnterClass || isLaunching}
             className="group relative overflow-hidden bg-primary text-on_primary px-10 py-4 rounded-2xl font-bold shadow-glow-primary flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
           >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
              {isLaunching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              <div className="text-left">
                 <p className="text-sm font-black leading-none mb-1 uppercase tracking-tight">{buttonTitle}</p>
                 <p className="text-[9px] opacity-80 font-bold uppercase tracking-widest">Dual-Monitor Mode</p>
              </div>
           </button>
        </div>
      </header>

      {error && <div className="text-error font-bold p-4 bg-error/10 rounded-xl">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="aspect-video bg-surface_container_low border-2 border-outline_variant/10 rounded-[3rem] overflow-hidden relative group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent z-10" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 z-20">
                 <div className="w-24 h-24 rounded-full bg-surface_container_high/50 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-6 shadow-ambient">
                    {sessionActive ? (
                      <Monitor className="w-10 h-10 text-primary animate-pulse" />
                    ) : canEnterClass ? (
                      <Video className="w-10 h-10 text-secondary animate-pulse" />
                    ) : (
                      <Camera className="w-10 h-10 text-outline" />
                    )}
                 </div>
                 <h3 className="text-2xl font-bold font-manrope text-on_surface mb-2">
                    {sessionActive ? 'Platform Control Engaged' : canEnterClass ? 'Scheduled class is ready' : 'Camera is currently inactive'}
                 </h3>
                 <p className="text-sm text-on_surface_variant max-w-sm leading-relaxed">
                    {sessionActive 
                      ? 'The session has been handed over to the Mission Control dashboard. Please check your second monitor for audience analytics.' 
                      : canEnterClass
                        ? 'Join the exact scheduled live room from here. The embedded classroom and Mission Control stay inside this platform.'
                        : 'Class stream becomes available at the scheduled IST time. The embedded classroom and Mission Control stay inside this platform.'}
                 </p>
              </div>
              
              {/* Overlay Indicator */}
              <div className="absolute top-8 right-8 z-30 flex items-center gap-3 bg-black/40 backdrop-blur-lg px-4 py-2 rounded-xl border border-white/5">
                 <Layout className="w-4 h-4 text-secondary" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Dual-Screen Environment</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KnowledgeCard className="p-8 border-primary/20 bg-primary/5">
                 <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-6">
                    <ExternalLink className="w-6 h-6" />
                 </div>
                 <h4 className="font-bold text-lg text-on_surface mb-1">Embedded Classroom</h4>
                 <p className="text-xs text-on_surface_variant leading-relaxed mb-4 italic">Secured platform-only live room</p>
                 <div className="text-[10px] font-bold text-primary flex items-center gap-2 bg-surface_container_low p-2 rounded-lg truncate">
                    {upcomingClass ? "Ready for protected in-platform launch" : "Pending session assignment"}
                 </div>
              </KnowledgeCard>

              <KnowledgeCard className="p-8 hover:bg-surface_container_low transition-colors group">
                 <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <MonitorOff className="w-6 h-6" />
                 </div>
                 <h4 className="font-bold text-lg text-on_surface mb-1">Control Configuration</h4>
                 <p className="text-xs text-on_surface_variant leading-relaxed">Customize your side-monitor layouts and telemetry widgets in Mission Control.</p>
              </KnowledgeCard>
           </div>
        </div>

        <div className="space-y-8">
           <KnowledgeCard className="p-8 shadow-ambient border-outline_variant/10">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex gap-4 items-center">
                    <div className="p-3 rounded-xl bg-surface_container_high text-primary">
                       <Users className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Session Capacity</p>
                       <h3 className="text-2xl font-bold font-manrope text-on_surface">--% Active</h3>
                    </div>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-outline uppercase tracking-widest">Pre-Session Lobby</h4>
                 <div className="space-y-2">
                    {waitingStudents.map((stud) => (
                      <div key={stud.id} className="flex items-center justify-between p-3 bg-surface_container_low/40 rounded-xl">
                         <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-surface_container_highest flex items-center justify-center text-[10px] font-bold text-primary">
                               {stud.name[0]}
                            </div>
                            <span className="text-xs font-bold text-on_surface">{stud.name}</span>
                         </div>
                         <button className="text-[10px] font-bold uppercase text-primary hover:underline">Verify</button>
                      </div>
                    ))}
                 </div>
              </div>
           </KnowledgeCard>

           <div className="p-8 rounded-[2.5rem] bg-surface_container_low border border-outline_variant/20 relative overflow-hidden">
              <div className="flex gap-4 items-start mb-6">
                 <div className="p-2 rounded-lg bg-secondary text-on_secondary">
                    <FileCheck className="w-5 h-5" />
                 </div>
                 <h4 className="font-bold text-on_surface">Sync Asset Pipeline</h4>
              </div>
              <p className="text-xs text-on_surface_variant leading-relaxed mb-6">
                 All handouts pushed during the live session are cryptographically logged to the student materials vault automatically.
              </p>
              <button className="flex items-center gap-2 text-xs font-bold text-secondary hover:underline group">
                 Open Research Vault <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
           
           <KnowledgeCard className="p-8 border-error/20 bg-error/5 group cursor-pointer">
              <div className="flex items-center justify-between">
                 <div className="flex gap-4 items-center font-bold text-error">
                    <ShieldAlert className="w-5 h-5" />
                    <span>Emergency System Halt</span>
                 </div>
                 <ChevronRight className="w-5 h-5 text-error opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </div>
           </KnowledgeCard>
        </div>
      </div>
    </div>
  );
}
