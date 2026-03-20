"use client";

import { useEffect, useRef, useState } from "react";
import ShareButton from "./ShareButton";

export const EMOJI_LIST = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
  "😉","😍","🥰","😘","😋","😎","🤓","🥳","😭","😡",
  "📁","📂","🗂️","📋","📌","📍","🗃️","🗄️","💼","🏢",
  "🔧","⚙️","🛠️","🔩","💡","🔑","🗝️","🔒","🔓","🎯",
  "🌱","🌿","🍀","🌲","🌳","🌴","🌵","🌸","🌺","🌻",
  "⭐","🌟","✨","💫","🔥","❄️","🌈","☀️","🌙","⚡",
  "🎨","🎭","📷","🎥","🎬","📺","🎙️","📢","📣","🎵",
  "🐶","🐱","🦊","🐻","🐼","🦁","🐯","🦋","🐝","🦅",
  "🍕","🍔","🌮","🍜","🍣","🎂","☕","🍎","🍇","🥑",
  "🏆","🥇","🎖️","🏅","🎗️","🎀","🎉","🎊","🎆","🎇",
  "🚀","✈️","🚂","🚢","🏠","🏗️","🌍","🗺️","🧭","🔭",
  "📚","📖","✏️","🖊️","📝","📓","📔","📒","📃","📜",
  "✅","☑️","❌","⚠️","🔗","📎","🧑‍💻","👤","👥","💬",
  "📅","🗓️","⏰","⌛","⏳","📊","📈","📉","💰","💳",
];

interface Project {
  _id:   string;
  emoji: string;
  name:  string;
}

export default function ProjectHeader({
  project,
  isViewOnly = false,
}: {
  project:     Project;
  isViewOnly?: boolean;
}) {
  const [editingName,     setEditingName]     = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [name,  setName]  = useState(project.name);
  const [emoji, setEmoji] = useState(project.emoji);

  const inputRef  = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  /* focus input when editing */
  useEffect(() => {
    if (editingName) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingName]);

  /* sync props */
  useEffect(() => {
    setName(project.name);
    setEmoji(project.emoji);
  }, [project]);

  /* close emoji picker on outside click */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* API patch */
  const updateProject = async (data: Record<string, string>) => {
    await fetch(`/api/projects/${project._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  /* save name */
  const saveName = async () => {
    if (!name.trim() || name === project.name) { setEditingName(false); return; }
    await updateProject({ name });
    setEditingName(false);
  };

  /* select emoji */
  const handleEmojiClick = async (e: string) => {
    setEmoji(e);
    setShowEmojiPicker(false);
    await updateProject({ emoji: e });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 relative">

        {/* ── Emoji button ── */}
        <div className="relative">
          <div
            onClick={() => !isViewOnly && setShowEmojiPicker(true)}
            className={`text-5xl px-2 rounded transition ${
              isViewOnly ? "cursor-default" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {emoji || "📄"}
          </div>

          {showEmojiPicker && (
            <div
              ref={pickerRef}
              className="absolute top-14 left-0 z-50 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-lg p-3 w-[260px] max-h-[220px] overflow-y-auto"
            >
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_LIST.map((e, i) => (
                  <button
                    key={i}
                    onClick={() => handleEmojiClick(e)}
                    className="text-xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Project name ── */}
        <div>
          {editingName && !isViewOnly ? (
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter")  saveName();
                if (e.key === "Escape") { setName(project.name); setEditingName(false); }
              }}
              className="text-3xl font-extrabold outline-none border-b border-gray-300 bg-transparent dark:border-gray-600 dark:text-white"
            />
          ) : (
            <h1
              onClick={() => !isViewOnly && setEditingName(true)}
              className={`text-3xl font-extrabold px-1 rounded transition ${
                isViewOnly
                  ? "cursor-default"
                  : "cursor-text hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {name}
            </h1>
          )}
        </div>
      </div>

      {/* ── Share button ── */}
      {!isViewOnly && <ShareButton projectId={project._id} projectName={name} />}
    </div>
  );
}