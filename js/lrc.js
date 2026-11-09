/**
 * Đọc file lời bài hát dạng LRC: mỗi dòng "[mm:ss.xx] lời" (một dòng có thể có nhiều mốc thời gian).
 * Trả về [{ time: giây, text }] đã sắp theo thời gian.
 */
export function parseLrc(source) {
  const out = [];
  String(source || '')
    .split(/\r?\n/)
    .forEach((line) => {
      const stamps = [...line.matchAll(/\[(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)];
      if (!stamps.length) return;
      const text = line.replace(/\[[^\]]*\]/g, '').trim();
      if (!text) return;
      stamps.forEach(([, m, s]) => {
        out.push({ time: Number(m) * 60 + Number(s.replace(':', '.')), text });
      });
    });
  return out.sort((a, b) => a.time - b.time);
}

export async function loadLrc(url) {
  if (!url) return [];
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return parseLrc(await res.text());
  } catch {
    return [];
  }
}
