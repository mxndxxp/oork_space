// components/CreateDatabasePopover.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import ViewPickerCard from "./ViewpickerCard";
import { useWorkspaceStore } from "@/app/store/WorkspaceStore";

export default function CreateDatabasePopover({
  projectId,
  defaultOpen,
}: {
  projectId:    string;
  defaultOpen?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [open, setOpen] = useState(!!defaultOpen);

  const { fetchDatabases } = useWorkspaceStore();

  return (
    <>
      <Button
        variant="outline"
        className={`gap-2 ${
          isDark
            ? "border-gray-700 text-gray-300 hover:bg-gray-800"
            : "border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
        onClick={() => setOpen(true)}
      >
        <Plus size={16} />
        <span className="text-sm font-semibold">New</span>
      </Button>

      {open && (
        <ViewPickerCard
          projectId={projectId}
          isDark={isDark}
          onDone={async () => {
            setOpen(false);
            await fetchDatabases(projectId);
          }}
        />
      )}
    </>
  );
}