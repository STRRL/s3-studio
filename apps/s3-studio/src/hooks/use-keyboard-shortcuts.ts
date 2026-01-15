import { useEffect, useCallback } from "react";
import type { FileItem } from "@/types/file";
import type { FileActions } from "./use-file-actions";

export interface UseKeyboardShortcutsProps {
  enabled: boolean;
  selectedFile: FileItem | null;
  actions: FileActions;
  onRenameRequest: (file: FileItem) => void;
  onDeleteRequest: (file: FileItem) => void;
}

function isMac() {
  return (
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0
  );
}

export function useKeyboardShortcuts({
  enabled,
  selectedFile,
  actions,
  onRenameRequest,
  onDeleteRequest,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      const modKey = isMac() ? e.metaKey : e.ctrlKey;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedFile) {
        e.preventDefault();
        onDeleteRequest(selectedFile);
        return;
      }

      if (e.key === "F2" && selectedFile) {
        e.preventDefault();
        onRenameRequest(selectedFile);
        return;
      }

      if (modKey && e.key.toLowerCase() === "c" && selectedFile) {
        e.preventDefault();
        actions.copyPath(selectedFile);
        return;
      }

      if (modKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        actions.refresh();
        return;
      }
    },
    [selectedFile, actions, onRenameRequest, onDeleteRequest]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}
