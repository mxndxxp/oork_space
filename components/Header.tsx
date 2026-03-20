"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Search, Mic, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "./AuthContext";

/* ── palette for initial-based avatars ── */
const AVATAR_COLORS = [
  "bg-violet-500", "bg-indigo-500", "bg-sky-500",
  "bg-emerald-500", "bg-pink-500",  "bg-amber-500",
  "bg-rose-500",   "bg-teal-500",
];

export interface Collaborator {
  _id:     string;
  name:    string;
  avatar?: string; // optional image URL
}

/* ─── Collaborator Avatars ──────────────────────────────────── */
function CollaboratorAvatars({
  collaborators,
  max = 4,
}: {
  collaborators: Collaborator[];
  max?:          number;
}) {
  const visible  = collaborators.slice(0, max);
  const overflow = collaborators.length - max;
  const [tooltip, setTooltip] = useState<string | null>(null);

  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((c, i) => {
          const initials = c.name
            .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
          const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];

          return (
            <div
              key={c._id}
              onMouseEnter={() => setTooltip(c.name)}
              onMouseLeave={() => setTooltip(null)}
              className="relative w-7 h-7 rounded-full ring-2 ring-white dark:ring-gray-900 overflow-visible cursor-default shrink-0"
              style={{ zIndex: visible.length - i }}
            >
              {c.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.avatar} alt={c.name}
                  className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className={`w-full h-full rounded-full flex items-center justify-center text-white text-[10px] font-bold ${colorClass}`}>
                  {initials}
                </div>
              )}

              {tooltip === c.name && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded-md bg-gray-800 text-white text-[11px] whitespace-nowrap pointer-events-none z-50 shadow">
                  {c.name}
                </div>
              )}
            </div>
          );
        })}

        {overflow > 0 && (
          <div
            title={`${overflow} more`}
            className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300 shrink-0"
            style={{ zIndex: 0 }}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Header ───────────────────────────────────────────── */
export default function Header({
  collaborators = [],
}: {
  collaborators?: Collaborator[];
}) {
  const { resolvedTheme } = useTheme();
  const { logout } = useAuth();
  const isDark = resolvedTheme === "dark";

  const [showSharePopover, setShowSharePopover] = useState(false);

  const PAGE_ID = "123"; // 🔥 replace with dynamic value

  return (
    <div
      className={`px-6 py-4 border-b ${
        isDark ? "bg-[#0F1014] border-gray-800" : "bg-teal-50 border-teal-200"
      }`}
    >
      <div className="flex justify-between items-center">

        {/* LEFT — avatars + title */}
        <div className="flex items-center gap-3 ml-14">

          {/* Collaborator avatars */}
          {collaborators.length > 0 ? (
            <CollaboratorAvatars collaborators={collaborators} max={4} />
          ) : (
            /* fallback single dot when no collaborators passed */
            <div className="w-4 h-4 rounded-full border-2 border-indigo-500" />
          )}

          <h2 className={isDark ? "text-white" : "text-black"}>
            Team Project
          </h2>
        </div>

         {/* CENTER — search */}
         <div className="flex-1 max-w-md mx-6">
           <div
             className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
               isDark ? "bg-[#18191d]" : "bg-white"
             }`}
           >
             <Search size={16} />
             <Input placeholder="Search..." className="border-0 bg-transparent" />
             <Mic size={16} />
           </div>
         </div>

         {/* RIGHT — actions */}
         <div className="flex items-center gap-4">
           {/* Logout */}
           <button
             onClick={logout}
             className="relative px-4 py-2 rounded-xl font-semibold text-sm text-white
               bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500
               shadow-lg shadow-pink-500/25
               hover:shadow-xl hover:shadow-pink-500/40
               transform hover:-translate-y-0.5 hover:scale-105
               transition-all duration-200
               active:translate-y-0 active:scale-95"
           >
             <span className="relative z-10 flex items-center gap-2">
               <LogOut size={16} />
               Logout
             </span>
           </button>
          </div>

        </div>
      </div>
  )
};