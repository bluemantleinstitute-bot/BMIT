"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, Mail, Phone, Search, UserCircle } from "lucide-react";
import { KnowledgeCard, CardBody } from "@/components/KnowledgeCard";
import { API_ORIGIN } from "@/lib/api";
import { db } from "@/lib/db";

function resolveMediaUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

export default function StudentTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await db.user.getTeacherProfiles();
        setTeachers(data || []);
      } catch (error) {
        console.error("Failed to fetch teacher profiles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    const term = search.toLowerCase();
    return teachers.filter((teacher) => (
      teacher.name?.toLowerCase().includes(term) ||
      teacher.title?.toLowerCase().includes(term) ||
      teacher.email?.toLowerCase().includes(term)
    ));
  }, [teachers, search]);

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-on_surface_variant">Loading Teachers...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Teachers</h1>
          <p className="text-on_surface_variant">Faculty profiles and contact details shared by your instructors.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search teachers..."
            className="w-full rounded-full border border-outline_variant/30 bg-surface_container_lowest py-3 pl-11 pr-4 text-sm text-on_surface outline-none focus:border-primary/50"
          />
        </div>
      </header>

      {filteredTeachers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline_variant/40 p-16 text-center text-on_surface_variant">
          No teacher profiles available yet.
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => (
            <KnowledgeCard key={teacher._id} className="overflow-hidden">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                    <TeacherAvatar name={teacher.name} src={teacher.profilePicture} />
                    <div className="min-w-0">
                      <h2 className="font-manrope text-lg font-bold text-on_surface">{teacher.name}</h2>
                      <p className="text-sm font-semibold text-primary">{teacher.title || "Faculty"}</p>
                      <p className="mt-2 line-clamp-4 text-sm leading-6 text-on_surface_variant">
                        {teacher.description || "Profile description not added yet."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 border-t border-outline_variant/10 pt-5">
                    {teacher.email && (
                      <ContactRow icon={Mail} text={teacher.email} />
                    )}
                    {teacher.linkedin && (
                      <a
                        href={teacher.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 text-sm text-primary hover:underline"
                      >
                        <Link className="h-4 w-4" /> LinkedIn Profile
                      </a>
                    )}
                    {teacher.mobileNumber && (
                      <ContactRow icon={Phone} text={teacher.mobileNumber} />
                    )}
                  </div>
                </CardBody>
              </KnowledgeCard>
          ))}
        </section>
      )}
    </div>
  );
}

function TeacherAvatar({ name, src }: { name?: string; src?: string }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = resolveMediaUrl(src);

  return (
    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-surface_container_high flex items-center justify-center">
      {imageUrl && !failed ? (
        <img src={imageUrl} alt={name || "Teacher"} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <UserCircle className="h-12 w-12 text-outline" />
      )}
    </div>
  );
}

function ContactRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <p className="flex items-center gap-3 text-sm text-on_surface_variant">
      <Icon className="h-4 w-4 text-primary" /> {text}
    </p>
  );
}
