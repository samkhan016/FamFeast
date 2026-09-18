const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(YT_REGEX);
  return match?.[1] ?? null;
}

export function isYouTubeUrl(input: string): boolean {
  return extractYouTubeId(input) !== null;
}

export function looksLikeUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeThumb(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
