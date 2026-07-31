import type { CommentView } from "@/api/types";

export type CommentThread = { parent: CommentView; replies: CommentView[] };

export function groupComments(comments: CommentView[]): {
  threads: CommentThread[];
  orphans: CommentView[];
} {
  const parents = comments.filter((c) => !c.parentId);
  const parentIds = new Set(parents.map((p) => p.id));
  const byParent = new Map<string, CommentView[]>();
  const orphans: CommentView[] = [];

  for (const c of comments) {
    if (!c.parentId) continue;
    if (!parentIds.has(c.parentId)) {
      orphans.push(c);
      continue;
    }
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }

  return {
    threads: parents.map((parent) => ({
      parent,
      replies: byParent.get(parent.id) ?? [],
    })),
    orphans,
  };
}
