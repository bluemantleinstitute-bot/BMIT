"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Camera, Link, Mail, Phone, RotateCcw, Save, UserCircle } from "lucide-react";
import { KnowledgeCard, CardBody, CardHeader, CardTitle } from "@/components/KnowledgeCard";
import { API_ORIGIN } from "@/lib/api";
import { db } from "@/lib/db";

type TeacherProfile = {
  name: string;
  email: string;
  title: string;
  linkedin: string;
  mobileNumber: string;
  description: string;
  profilePicture: string;
};

const emptyProfile: TeacherProfile = {
  name: "",
  email: "",
  title: "",
  linkedin: "",
  mobileNumber: "",
  description: "",
  profilePicture: "",
};

function resolveMediaUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<TeacherProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const imageUrl = useMemo(() => resolveMediaUrl(profile.profilePicture), [profile.profilePicture]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await db.user.getMyTeacherProfile();
        setProfile({ ...emptyProfile, ...data });
      } catch (error) {
        console.error("Failed to fetch teacher profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const updateField = (field: keyof TeacherProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const uploaded = await db.user.uploadFile(file);
      updateField("profilePicture", uploaded.url || "");
    } catch (error: any) {
      alert(error.message || "Profile image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await db.user.updateTeacherProfile(profile);
      if (response.user) setProfile({ ...emptyProfile, ...response.user });
      alert("Profile updated successfully");
    } catch (error: any) {
      alert(error.message || "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleClearOtherSessions = async () => {
    if (!confirm("This will sign this account out from other devices and keep only this browser active. Continue?")) return;
    try {
      await db.user.clearOtherTeacherSessions();
      alert("Other devices cleared successfully");
    } catch (error: any) {
      alert(error.message || "Could not clear other devices");
    }
  };

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-on_surface_variant">Loading Profile...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      <header>
        <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Teacher Profile</h1>
        <p className="text-on_surface_variant">Manage the profile students see in the platform.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
        <KnowledgeCard>
          <CardBody className="p-8 text-center">
            <div className="mx-auto mb-5 h-36 w-36 overflow-hidden rounded-full border border-primary/30 bg-surface_container_high flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt={profile.name || "Teacher"} className="h-full w-full object-cover" />
              ) : (
                <UserCircle className="h-20 w-20 text-outline" />
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-colors">
              <Camera className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
              />
            </label>

            <div className="mt-8 space-y-3 text-left">
              <p className="flex items-center gap-2 text-sm text-on_surface_variant">
                <Mail className="h-4 w-4 text-primary" /> {profile.email || "Email not added"}
              </p>
              <p className="flex items-center gap-2 text-sm text-on_surface_variant">
                <Link className="h-4 w-4 text-primary" /> {profile.linkedin || "LinkedIn not added"}
              </p>
              <p className="flex items-center gap-2 text-sm text-on_surface_variant">
                <Phone className="h-4 w-4 text-primary" /> {profile.mobileNumber || "Mobile not added"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearOtherSessions}
              className="mt-8 w-full rounded-full border border-outline_variant/30 px-4 py-3 text-sm font-bold text-on_surface hover:bg-surface_container_high transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Clear Other Devices
            </button>
          </CardBody>
        </KnowledgeCard>

        <KnowledgeCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" /> Public Details
            </CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Name" value={profile.name} onChange={(value) => updateField("name", value)} required />
                <Field label="Title" value={profile.title} onChange={(value) => updateField("title", value)} placeholder="Senior Market Analyst" />
                <Field label="Gmail / Email" value={profile.email} onChange={(value) => updateField("email", value)} type="email" />
                <Field label="LinkedIn" value={profile.linkedin} onChange={(value) => updateField("linkedin", value)} placeholder="https://linkedin.com/in/..." />
                <Field label="Mobile Number" value={profile.mobileNumber} onChange={(value) => updateField("mobileNumber", value)} placeholder="Optional" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-outline mb-2">Short Description</label>
                <textarea
                  value={profile.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-outline_variant/30 bg-surface_container_highest px-4 py-3 text-sm text-on_surface outline-none focus:border-primary/50"
                  placeholder="Write a short profile students can read."
                />
              </div>

              <button type="submit" disabled={saving} className="btn-premium disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </CardBody>
        </KnowledgeCard>
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
      <label className="block text-xs font-bold uppercase tracking-widest text-outline mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-outline_variant/30 bg-surface_container_highest px-4 py-3 text-sm text-on_surface outline-none focus:border-primary/50"
      />
    </div>
  );
}
