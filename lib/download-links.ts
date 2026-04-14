type InstallerDownloadLinkInput = {
  version: string;
  platform: string;
  assetName: string;
  source?: string;
};

export function buildInstallerDownloadLink({
  version,
  platform,
  assetName,
  source,
}: InstallerDownloadLinkInput): string {
  const params = new URLSearchParams({
    version,
    platform,
    asset: assetName,
  });

  if (source) params.set('source', source);

  return `/api/internal/installer-download?${params.toString()}`;
}
