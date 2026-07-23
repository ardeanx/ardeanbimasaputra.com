const MAX = 100 * 1024 * 1024;

export function parseRepo(input: string): { owner: string; repo: string } | null {
  const s = input.trim().replace(new RegExp("^https?://(?:www\\.)?github\\.com/", "i"), "");
  const m = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?:\/.*)?$/.exec(s);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

export async function fetchRepoArchive(
  owner: string,
  repo: string,
): Promise<{ filename: string; buffer: Buffer } | { error: string }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ardean-cms",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const meta = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
  });
  if (meta.status === 404) return { error: "Repo tidak ditemukan atau bersifat privat." };
  if (!meta.ok) return { error: `GitHub error ${meta.status}.` };
  const info = (await meta.json()) as { default_branch?: string };
  const branch = info.default_branch ?? "main";

  const zip = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`, {
    headers,
  });
  if (!zip.ok) return { error: `Gagal mengunduh arsip (${zip.status}).` };
  const len = Number(zip.headers.get("content-length") ?? 0);
  if (len > MAX) return { error: "Arsip terlalu besar (maks 100MB)." };
  const buffer = Buffer.from(await zip.arrayBuffer());
  if (buffer.length > MAX) return { error: "Arsip terlalu besar (maks 100MB)." };

  return { filename: `${owner}-${repo}-${branch}.zip`, buffer };
}
