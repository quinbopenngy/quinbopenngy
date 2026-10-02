/**
 * Computes SHA-256 hash of a File object or raw base64 string
 * for reliable duplicate detection.
 */

export async function computeFileHash(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback simple hash if SubtleCrypto is unavailable in non-secure context
    return fallbackHash(`${file.name}-${file.size}-${file.lastModified}`);
  }
}

export async function computeBase64Hash(base64: string): Promise<string> {
  try {
    const clean = base64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    const encoder = new TextEncoder();
    const data = encoder.encode(clean.slice(0, 100000)); // hash significant chunk for speed
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return fallbackHash(base64.slice(0, 5000));
  }
}

function fallbackHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
