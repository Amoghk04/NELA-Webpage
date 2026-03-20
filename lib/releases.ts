// ---------------------------------------------------------------------------
// Shared types and helpers for the GitHub-backed release system
// ---------------------------------------------------------------------------

export type AssetType = "exe" | "msi" | "deb" | "AppImage" | "dmg" | "archive" | "unknown";

export interface ReleaseAsset {
  /** Original filename, e.g. "GenHat_0.1.0_x64-setup.exe" */
  name: string;
  /** Direct GitHub download URL */
  download_url: string;
  /** File size in bytes */
  size: number;
  /** Detected installer type */
  type: AssetType;
}

export interface ParsedVersion {
  /** Semver string, e.g. "v0.1.1" */
  version: string;
  /** Map of OS name → list of available assets */
  platforms: Record<string, ReleaseAsset[]>;
}

export interface ReleasesData {
  versions: ParsedVersion[];
  /** Highest semver version that has at least one asset */
  latestVersion: string | null;
}

// ---------------------------------------------------------------------------
// Client-side fetch helper (used in client components)
// ---------------------------------------------------------------------------

let _cache: ReleasesData | null = null;
let _cacheTs = 0;
const CLIENT_CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function fetchReleases(): Promise<ReleasesData> {
  if (_cache && Date.now() - _cacheTs < CLIENT_CACHE_TTL) return _cache;

  const res = await fetch("/api/releases");
  if (!res.ok) throw new Error(`Failed to fetch releases: ${res.statusText}`);

  const data: ReleasesData = await res.json();
  _cache = data;
  _cacheTs = Date.now();
  return data;
}

// ---------------------------------------------------------------------------
// Server-side fetch helper — call directly from Server Components.
// Uses Next.js unstable_cache so repeated renders hit an in-memory cache
// instead of going out to GitHub every time.
// ---------------------------------------------------------------------------

const GITHUB_REPO = "Uncharted0110/NELA---Ninakkan-Ella-Local-Aagi";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

function getAssetType(name: string): AssetType {
  const lower = name.toLowerCase();
  if (lower.endsWith(".exe")) return "exe";
  if (lower.endsWith(".msi")) return "msi";
  if (lower.endsWith(".deb")) return "deb";
  if (lower.endsWith(".appimage")) return "AppImage";
  if (lower.endsWith(".dmg")) return "dmg";
  if (lower.endsWith(".tar.gz") || lower.endsWith(".zip")) return "archive";
  return "unknown";
}

const KNOWN_PLATFORMS = ["Windows", "Linux", "macOS", "Mac"];

function parseTag(tag: string): { version: string; platform: string } | null {
  for (const platform of KNOWN_PLATFORMS) {
    const suffix = `-${platform}`;
    if (tag.endsWith(suffix)) {
      return { version: tag.slice(0, -suffix.length), platform: platform === "Mac" ? "macOS" : platform };
    }
  }
  return null;
}

function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const pa = parse(a), pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function _fetchReleasesFromGitHub(): Promise<ReleasesData> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(GITHUB_API_URL, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawReleases: any[] = await res.json();

  const versionMap = new Map<string, Map<string, ReleaseAsset[]>>();

  for (const release of rawReleases) {
    const parsed = parseTag(release.tag_name as string);
    if (!parsed) continue;
    const { version, platform } = parsed;
    if (!versionMap.has(version)) versionMap.set(version, new Map());
    const platformMap = versionMap.get(version)!;
    if (!platformMap.has(platform)) platformMap.set(platform, []);
    const assets = platformMap.get(platform)!;
    for (const asset of release.assets ?? []) {
      const type = getAssetType(asset.name as string);
      if (type === "unknown") continue;
      assets.push({ name: asset.name, download_url: asset.browser_download_url, size: asset.size, type });
    }
  }

  const sortedVersions = [...versionMap.keys()].sort(compareVersions);
  const versions: ParsedVersion[] = sortedVersions.map((version) => {
    const platforms: ParsedVersion["platforms"] = {};
    for (const [platform, assets] of versionMap.get(version)!.entries()) {
      platforms[platform] = assets;
    }
    return { version, platforms };
  });

  return { versions, latestVersion: sortedVersions[0] ?? null };
}

/**
 * Server-side cached releases fetcher.
 * Revalidates every 10 minutes. Import only in Server Components / API routes.
 */
export async function getReleasesServerSide(): Promise<ReleasesData> {
  // Lazy-import unstable_cache so this module stays importable on the client
  // (the function itself should never be called client-side).
  const { unstable_cache } = await import("next/cache");
  const cached = unstable_cache(_fetchReleasesFromGitHub, ["nela-releases"], {
    revalidate: 600, // 10 minutes
    tags: ["releases"],
  });
  return cached();
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Human-readable file size */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/** Returns a nice label for an asset type */
export function assetTypeLabel(type: AssetType): string {
  const labels: Record<AssetType, string> = {
    exe: ".exe installer",
    msi: ".msi package",
    deb: ".deb package",
    AppImage: ".AppImage",
    dmg: ".dmg disk image",
    archive: "archive",
    unknown: "file",
  };
  return labels[type] ?? "file";
}

/** Returns available platform names for a given version */
export function platformsForVersion(
  data: ReleasesData,
  version: string
): string[] {
  const v = data.versions.find((v) => v.version === version);
  return v ? Object.keys(v.platforms) : [];
}

/** Returns assets for a given version + platform combo */
export function assetsFor(
  data: ReleasesData,
  version: string,
  platform: string
): ReleaseAsset[] {
  const v = data.versions.find((v) => v.version === version);
  return v?.platforms[platform] ?? [];
}

/** Find the latest Windows .exe asset across all versions */
export function latestWindowsExe(data: ReleasesData): ReleaseAsset | null {
  for (const v of data.versions) {
    const windowsAssets = v.platforms["Windows"] ?? [];
    const exe = windowsAssets.find((a) => a.type === "exe");
    if (exe) return exe;
  }
  return null;
}

export type PlatformName = "Windows" | "Linux" | "macOS";

export function detectClientPlatform(userAgent: string): PlatformName {
  const ua = userAgent.toLowerCase();
  if (ua.includes("mac") || ua.includes("darwin")) return "macOS";
  if (ua.includes("linux") || ua.includes("x11")) return "Linux";
  return "Windows";
}

function preferredTypesForPlatform(platform: PlatformName): AssetType[] {
  if (platform === "Windows") return ["exe", "msi", "archive"];
  if (platform === "Linux") return ["deb", "AppImage", "archive"];
  return ["dmg", "archive"];
}

export function latestAssetForPlatform(
  data: ReleasesData,
  platform: PlatformName
): { version: string; asset: ReleaseAsset } | null {
  const preferred = preferredTypesForPlatform(platform);

  for (const v of data.versions) {
    const assets = v.platforms[platform] ?? [];
    if (assets.length === 0) continue;

    for (const type of preferred) {
      const matched = assets.find((asset) => asset.type === type);
      if (matched) return { version: v.version, asset: matched };
    }

    return { version: v.version, asset: assets[0] };
  }

  return null;
}
