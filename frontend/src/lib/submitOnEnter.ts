import type { KeyboardEvent } from "react";

/** Enter submits the parent form; Shift+Enter keeps a newline. IME-safe; ignores key repeat. */
export function submitOnEnter(e: KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key !== "Enter" || e.shiftKey || e.repeat || e.nativeEvent.isComposing || e.keyCode === 229) return;
  e.preventDefault();
  e.currentTarget.form?.requestSubmit();
}
