"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  Camera,
  Copy,
  Eye,
  GraduationCap,
  Key,
  Link,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCircle,
  UserPlus,
  X,
} from "lucide-react";
import { KnowledgeCard, CardBody, CardHeader, CardTitle } from "@/components/KnowledgeCard";
import { DataTable } from "@/components/DataTable";
import { SwitchButton3D } from "@/components/SwitchButton3D";
import { API_ORIGIN } from "@/lib/api";
import { db } from "@/lib/db";

type TeacherDraft = {
  name: string;
  email: string;
  title: string;
  linkedin: string;
  mobileNumber: string;
  description: string;
  profilePicture: string;
};

const emptyDraft: TeacherDraft = {
  name: "",
  email: "",
  title: "",
  linkedin: "",
  mobileNumber: "",
  description: "",
  profilePicture: "",
};

const MAX_PROFILE_IMAGE_BYTES = 1.5 * 1024 * 1024;

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<any>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<TeacherDraft>(emptyDraft);

  const [newFaculty, setNewFaculty] = useState({ name: "", email: "", title: "", password: "" });

  const fetchTeachers = async (preferredId?: string) => {
    try {
      setLoading(true);
      const data = await db.user.getUsers("teacher");
      const list = data || [];
      setTeachers(list);
      const nextSelection = list.find((teacher: any) => teacher.id === preferredId)
        || list.find((teacher: any) => teacher.id === selectedTeacher?.id)
        || list[0]
        || null;
      setSelectedTeacher(nextSelection);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTeachers = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return teachers.filter((teacher) => (
      teacher.name?.toLowerCase().includes(term) ||
      teacher.email?.toLowerCase().includes(term) ||
      teacher.title?.toLowerCase().includes(term) ||
      teacher.userId?.toLowerCase().includes(term)
    ));
  }, [teachers, searchQuery]);

  const activeProfile = selectedTeacher || filteredTeachers[0] || null;

  useEffect(() => {
    if (!activeProfile) {
      setProfileDraft(emptyDraft);
      setIsEditingProfile(false);
      return;
    }

    setProfileDraft({
      name: activeProfile.name || "",
      email: activeProfile.email || "",
      title: activeProfile.title || "",
      linkedin: activeProfile.linkedin || "",
      mobileNumber: activeProfile.mobileNumber || "",
      description: activeProfile.description || "",
      profilePicture: activeProfile.profilePicture || "",
    });
    setIsEditingProfile(false);
  }, [activeProfile?.id]);

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const all = uppercase + lowercase + numbers + symbols;
    let pass = "";
    pass += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    pass += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    for (let i = 0; i < 8; i++) pass += all.charAt(Math.floor(Math.random() * all.length));
    setNewFaculty({ ...newFaculty, password: pass.split("").sort(() => Math.random() - 0.5).join("") });
  };

  const copyCredentials = (teacher: any) => {
    navigator.clipboard.writeText(`User ID: ${teacher.userId}\nPassword: ${teacher.password || "Not available"}`);
    alert("Credentials copied to clipboard");
  };

  const handleRecruit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newFaculty.name || !newFaculty.email || !newFaculty.password) return;

    try {
      setSaving(true);
      const response = await db.user.createUser({
        name: newFaculty.name,
        email: newFaculty.email,
        title: newFaculty.title,
        password: newFaculty.password,
        role: "teacher",
      });

      if (response.success) {
        setCreatedCredentials(response.user);
        setIsAddModalOpen(false);
        setNewFaculty({ name: "", email: "", title: "", password: "" });
        await fetchTeachers();
      } else {
        alert(response.message || "Failed to recruit faculty");
      }
    } catch (error: any) {
      alert(error.message || "Error recruiting faculty");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    try {
      setSaving(true);
      await db.user.deleteUser(teacherToDelete.id);
      setTeacherToDelete(null);
      setSelectedTeacher(null);
      await fetchTeachers();
      alert("Teacher deleted successfully");
    } catch (error: any) {
      alert(error.message || "Error deleting teacher");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImage = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      alert("Please choose an image below 1.5 MB.");
      return;
    }

    try {
      const image = await fileToDataUrl(file);
      setProfileDraft((draft) => ({ ...draft, profilePicture: image }));
    } catch (error: any) {
      alert(error.message || "Could not load profile image");
    }
  };

  const handleSaveProfile = async () => {
    if (!activeProfile) return;
    try {
      setSaving(true);
      const response = await db.user.updateUserProfileByAdmin(activeProfile.id, profileDraft);
      const updated = response.user || { ...activeProfile, ...profileDraft };
      setTeachers((current) => current.map((teacher) => teacher.id === activeProfile.id ? { ...teacher, ...updated } : teacher));
      setSelectedTeacher((current: any) => current?.id === activeProfile.id ? { ...current, ...updated } : current);
      setIsEditingProfile(false);
      alert("Teacher profile updated");
    } catch (error: any) {
      alert(error.message || "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleClearTeacherDevices = async () => {
    if (!activeProfile) return;
    if (!confirm(`Clear all active devices for ${activeProfile.name}? They can login again from a fresh device after this.`)) return;

    try {
      setSaving(true);
      await db.user.clearUserSessions(activeProfile.id);
      await fetchTeachers(activeProfile.id);
      alert("Teacher devices cleared");
    } catch (error: any) {
      alert(error.message || "Could not clear teacher devices");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Faculty Member",
      render: (val: string, row: any) => (
        <button
          type="button"
          onClick={() => setSelectedTeacher(row)}
          className="flex items-center gap-3 text-left"
        >
          <ProfileAvatar name={val} src={row.profilePicture} className="h-10 w-10 rounded-xl text-sm" />
          <div>
            <p className="font-bold text-on_surface">{val}</p>
            <p className="text-[10px] uppercase tracking-wider text-outline">{row.userId}</p>
          </div>
        </button>
      )
    },
    { key: "email", header: "Email Address" },
    {
      key: "title",
      header: "Title / Role",
      render: (val: string) => (
        <span className={val ? "" : "text-xs italic text-outline"}>{val || "Not added"}</span>
      )
    },
    {
      key: "sessionCount",
      header: "Devices",
      render: (val: number) => (
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase text-primary">
          <ShieldCheck className="h-3 w-3" /> {val || 0}/3
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (val: string) => (
        <span className={cn(
          "rounded-sm px-2 py-1 text-[10px] font-bold uppercase",
          val === "active" || val === "Active" ? "bg-primary/10 text-primary" :
            val === "suspended" ? "bg-error/10 text-error" : "bg-outline/10 text-outline"
        )}>
          {val || "active"}
        </span>
      )
    },
    {
      key: "actions",
      header: "",
      render: (_: any, row: any) => (
        <button
          type="button"
          onClick={() => setSelectedTeacher(row)}
          className="inline-flex items-center gap-2 rounded-full border border-outline_variant/30 px-3 py-2 text-xs font-bold text-on_surface hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> View Profile
        </button>
      )
    }
  ];

  if (loading) return <div className="p-20 text-center animate-pulse text-on_surface_variant">Loading Faculty...</div>;

  return (
    <div className="space-y-8 pb-16">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Teacher Management</h1>
          <p className="text-on_surface_variant max-w-2xl">
            Oversee faculty profiles, credentials, device sessions, and active teaching access from one control panel.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-secondary text-on_secondary px-6 py-2.5 rounded-full font-bold shadow-ambient flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <UserPlus className="w-4 h-4" /> Recruit Faculty
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Faculty", value: teachers.length.toString(), icon: GraduationCap },
          { label: "Active Batches", value: teachers.reduce((acc, t) => acc + (t.batches || 0), 0).toString(), icon: BookOpen },
          { label: "Device Slots", value: `${teachers.reduce((acc, t) => acc + (t.sessionCount || 0), 0)}/3 each`, icon: Activity },
        ].map((stat) => (
          <KnowledgeCard key={stat.label} className="p-6">
            <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-surface_container_high text-secondary">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold font-manrope">{stat.value}</h3>
              </div>
            </div>
          </KnowledgeCard>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_460px] gap-8">
        <KnowledgeCard>
          <CardHeader className="flex justify-between items-center border-b border-outline_variant/10 pb-6 mb-0">
            <CardTitle>Faculty Directory</CardTitle>
            <div className="flex gap-2 items-center">
              {isSearchOpen && (
                <input
                  type="text"
                  placeholder="Search faculty..."
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="px-3 py-1.5 text-sm bg-surface_container_highest border border-outline_variant/30 rounded-lg focus:outline-none focus:border-primary transition-colors text-on_surface w-48"
                />
              )}
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 border border-outline_variant/30 rounded-lg hover:bg-surface_container_high transition-colors ${isSearchOpen ? "bg-surface_container_high" : ""}`}>
                <Search className="w-4 h-4 text-on_surface_variant" />
              </button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <DataTable columns={columns} data={filteredTeachers} />
            <div className="p-6 flex justify-between items-center border-t border-outline_variant/10 bg-surface_container_lowest">
              <p className="text-xs text-on_surface_variant">Displaying {filteredTeachers.length} of {teachers.length}</p>
              <div className="flex gap-3 items-center">
                <SwitchButton3D>Prev</SwitchButton3D>
                <span className="font-bold text-on_surface px-2">1</span>
                <SwitchButton3D>Next</SwitchButton3D>
              </div>
            </div>
          </CardBody>
        </KnowledgeCard>

        <TeacherProfilePanel
          teacher={activeProfile}
          draft={profileDraft}
          saving={saving}
          isEditing={isEditingProfile}
          setIsEditing={setIsEditingProfile}
          setDraft={setProfileDraft}
          onCopy={copyCredentials}
          onDelete={setTeacherToDelete}
          onSave={handleSaveProfile}
          onClearDevices={handleClearTeacherDevices}
          onImage={handleProfileImage}
        />
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-md rounded-3xl shadow-ambient border border-outline_variant/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-outline_variant/10">
              <h2 className="text-xl font-bold text-on_surface font-manrope">Recruit New Faculty</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-on_surface_variant hover:text-on_surface p-2 rounded-full hover:bg-surface_container_high transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecruit} className="p-6 space-y-5">
              <Field label="Full Name" value={newFaculty.name} onChange={(value) => setNewFaculty({ ...newFaculty, name: value })} placeholder="e.g. Dr. Alan Turing" required />
              <Field label="Official Email" value={newFaculty.email} onChange={(value) => setNewFaculty({ ...newFaculty, email: value })} placeholder="name@academy.edu" type="email" required />
              <Field label="Title / Role" value={newFaculty.title} onChange={(value) => setNewFaculty({ ...newFaculty, title: value })} placeholder="Senior Professor of AI" />
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Login Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newFaculty.password}
                    onChange={(event) => setNewFaculty({ ...newFaculty, password: event.target.value })}
                    className="flex-1 bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors font-mono"
                    placeholder="Set or generate password"
                  />
                  <button type="button" onClick={generatePassword} className="px-4 bg-primary/10 text-primary rounded-xl font-bold text-xs hover:bg-primary/20 transition-colors whitespace-nowrap">
                    Generate
                  </button>
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full btn-premium py-3.5 text-sm disabled:opacity-50">
                {saving ? "Recruiting..." : "Recruit Faculty Member"}
              </button>
            </form>
          </div>
        </div>
      )}

      {createdCredentials && (
        <CredentialsModal credentials={createdCredentials} onClose={() => setCreatedCredentials(null)} />
      )}

      {teacherToDelete && (
        <DeleteTeacherModal
          teacher={teacherToDelete}
          saving={saving}
          onCancel={() => setTeacherToDelete(null)}
          onConfirm={handleDeleteTeacher}
        />
      )}
    </div>
  );
}

function TeacherProfilePanel({
  teacher,
  draft,
  saving,
  isEditing,
  setIsEditing,
  setDraft,
  onCopy,
  onDelete,
  onSave,
  onClearDevices,
  onImage,
}: {
  teacher: any;
  draft: TeacherDraft;
  saving: boolean;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  setDraft: (value: TeacherDraft | ((current: TeacherDraft) => TeacherDraft)) => void;
  onCopy: (teacher: any) => void;
  onDelete: (teacher: any) => void;
  onSave: () => void;
  onClearDevices: () => void;
  onImage: (file?: File) => void;
}) {
  if (!teacher) {
    return (
      <KnowledgeCard>
        <CardBody className="p-8 text-sm text-on_surface_variant">
          Select a teacher to open profile controls.
        </CardBody>
      </KnowledgeCard>
    );
  }

  return (
    <KnowledgeCard className="bg-surface_container_low border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-primary" /> View Profile
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="flex items-start gap-4">
          <ProfileAvatar name={draft.name || teacher.name} src={draft.profilePicture} className="h-24 w-24 rounded-2xl text-xl" />
          <div className="min-w-0 flex-1">
            <h3 className="font-manrope text-xl font-bold text-on_surface">{draft.name || teacher.name}</h3>
            <p className="text-sm font-semibold text-primary">{draft.title || "Faculty"}</p>
            <p className="text-[10px] text-outline uppercase tracking-wider">{teacher.userId}</p>
            {isEditing && (
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors">
                <Camera className="h-3.5 w-3.5" /> Change Photo
                <input type="file" accept="image/*" className="hidden" onChange={(event) => onImage(event.target.files?.[0])} />
              </label>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <Field label="Name" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} required />
            <Field label="Email" value={draft.email} onChange={(value) => setDraft((current) => ({ ...current, email: value }))} type="email" />
            <Field label="Title" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
            <Field label="LinkedIn" value={draft.linkedin} onChange={(value) => setDraft((current) => ({ ...current, linkedin: value }))} />
            <Field label="Mobile Number" value={draft.mobileNumber} onChange={(value) => setDraft((current) => ({ ...current, mobileNumber: value }))} />
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Short Description</label>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-outline_variant/30 bg-surface_container_highest px-4 py-3 text-sm text-on_surface outline-none focus:border-primary/50"
                placeholder="Write what students should see."
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 rounded-full border border-outline_variant/30 px-4 py-3 text-sm font-bold text-on_surface hover:bg-surface_container_high transition-colors">
                Cancel
              </button>
              <button type="button" onClick={onSave} disabled={saving} className="flex-1 btn-premium justify-center disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="rounded-2xl bg-surface_container_highest/40 p-4 text-sm leading-6 text-on_surface_variant">
              {teacher.description || "No description added yet."}
            </p>

            <div className="space-y-3">
              <ContactRow icon={Mail} text={teacher.email || "Email not added"} />
              <ContactRow icon={Link} text={teacher.linkedin || "LinkedIn not added"} />
              <ContactRow icon={Phone} text={teacher.mobileNumber || "Mobile not added"} />
            </div>

            <section className="rounded-2xl border border-outline_variant/20 bg-surface_container_highest/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-outline">Device Sessions</p>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{teacher.sessionCount || 0}/3 active</span>
              </div>
              {(teacher.activeSessions || []).length === 0 ? (
                <p className="text-sm text-on_surface_variant">No active device sessions.</p>
              ) : (
                <div className="space-y-3">
                  {teacher.activeSessions.map((session: any, index: number) => (
                    <div key={`${session.deviceId}-${index}`} className="rounded-xl bg-surface_container_lowest p-3">
                      <p className="text-xs font-bold text-on_surface">Device {index + 1}</p>
                      <p className="mt-1 break-all text-[11px] text-on_surface_variant">{session.userAgent || "Browser details unavailable"}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-outline">
                        Last active: {session.lastActive ? new Date(session.lastActive).toLocaleString() : "Unknown"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionButton icon={Copy} label="Copy Credentials" onClick={() => onCopy(teacher)} />
              <ActionButton icon={Key} label="Edit Profile" onClick={() => setIsEditing(true)} />
              <ActionButton icon={RefreshCw} label="Clear Devices" onClick={onClearDevices} />
              <ActionButton icon={Trash2} label="Delete Profile" danger onClick={() => onDelete(teacher)} />
            </div>
          </>
        )}
      </CardBody>
    </KnowledgeCard>
  );
}

function ProfileAvatar({ name, src, className }: { name?: string; src?: string; className: string }) {
  const [failed, setFailed] = useState(false);
  const image = resolveMediaUrl(src);
  const initials = (name || "T").split(" ").map((part) => part[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className={cn("flex flex-shrink-0 items-center justify-center overflow-hidden bg-signature-gradient font-bold text-on_primary", className)}>
      {image && !failed ? (
        <img src={image} alt={name || "Teacher"} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span>{initials || <UserCircle className="h-8 w-8" />}</span>
      )}
    </div>
  );
}

function CredentialsModal({ credentials, onClose }: { credentials: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface_container_lowest w-full max-w-sm rounded-2xl shadow-ambient border-2 border-primary/20 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <BadgeCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-on_surface mb-2">Faculty Recruited</h2>
          <p className="text-sm text-on_surface_variant mb-8">Share these credentials securely.</p>
          <CredentialBox label="User ID" value={credentials.userId} />
          <CredentialBox label="Password" value={credentials.password} />
          <button onClick={onClose} className="w-full mt-8 py-3 bg-primary text-on_primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteTeacherModal({ teacher, saving, onCancel, onConfirm }: { teacher: any; saving: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface_container_lowest w-full max-w-sm rounded-2xl shadow-ambient border border-error/20 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-on_surface mb-2 font-manrope">Delete Teacher?</h2>
          <p className="text-sm text-on_surface_variant mb-2">This permanently removes the teacher account and clears batch assignment links.</p>
          <p className="font-bold text-on_surface text-lg mb-6">{teacher.name}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-full font-bold text-sm text-on_surface_variant hover:bg-surface_container_high transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={saving} className="flex-1 px-4 py-2.5 rounded-full font-bold text-sm bg-error text-white hover:bg-error/90 disabled:opacity-50 transition-colors">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
      />
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, danger = false }: { icon: any; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-xs font-bold transition-colors",
        danger
          ? "border-error/30 text-error hover:bg-error/10"
          : "border-outline_variant/30 text-on_surface hover:border-primary/50 hover:text-primary hover:bg-primary/5"
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function ContactRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <p className="flex items-center gap-3 break-words text-sm text-on_surface_variant">
      <Icon className="h-4 w-4 flex-shrink-0 text-primary" /> {text}
    </p>
  );
}

function CredentialBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4 p-4 bg-surface_container_highest rounded-xl border border-outline_variant/20 text-left">
      <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">{label}</p>
      <div className="flex justify-between items-center gap-3">
        <code className="font-mono font-bold text-primary break-all">{value}</code>
        <button onClick={() => { navigator.clipboard.writeText(value); alert("Copied"); }} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors">
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function resolveMediaUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read profile image"));
    reader.readAsDataURL(file);
  });
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
