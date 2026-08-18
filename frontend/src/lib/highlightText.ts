export type HighlightTextSegment = {
  text: string;
  isMatch: boolean;
};

export function highlightText(text: string, query: string): HighlightTextSegment[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [{ text, isMatch: false }];

  const normalizedText = text.toLocaleLowerCase();
  const segments: HighlightTextSegment[] = [];
  let startIndex = 0;
  let matchIndex = normalizedText.indexOf(normalizedQuery, startIndex);

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) {
      segments.push({ text: text.slice(startIndex, matchIndex), isMatch: false });
    }
    const endIndex = matchIndex + normalizedQuery.length;
    segments.push({ text: text.slice(matchIndex, endIndex), isMatch: true });
    startIndex = endIndex;
    matchIndex = normalizedText.indexOf(normalizedQuery, startIndex);
  }

  if (startIndex < text.length) {
    segments.push({ text: text.slice(startIndex), isMatch: false });
  }

  return segments.length ? segments : [{ text, isMatch: false }];
}
