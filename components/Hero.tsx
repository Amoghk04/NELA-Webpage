'use client';

import { motion } from 'motion/react';
import { Download, Terminal, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from './ThemeProvider';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';
import { buildInstallerDownloadLink } from '@/lib/download-links';
import {
  fetchReleases,
  detectClientPlatform,
  latestAssetForPlatform,
  type PlatformName,
  formatBytes,
  type ReleaseAsset,
  type ReleasesData,
  assetTypeLabel,
} from '@/lib/releases';

// Start the fetch the instant this module is loaded — before React even mounts.
// By the time useEffect fires, the response is likely already in-flight or done.
const releasesPreload = fetchReleases().catch(() => null);

export default function Hero() {
  const { theme } = useTheme();
  const [asset, setAsset] = useState<ReleaseAsset | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformName>('Windows');
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    releasesPreload.then((data: ReleasesData | null) => {
      if (data) {
        const platform = detectClientPlatform(window.navigator.userAgent);
        setSelectedPlatform(platform);

        const latestForPlatform = latestAssetForPlatform(data, platform);
        if (latestForPlatform) {
          setAsset(latestForPlatform.asset);
          setSelectedVersion(latestForPlatform.version);
        } else {
          setAsset(null);
          setSelectedVersion(null);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleDownload = () => {
    if (!asset) return;
    if (!selectedVersion) return;

    trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
      source: 'hero_primary',
      platform: selectedPlatform,
      version: selectedVersion,
      asset_name: asset.name,
      asset_type: asset.type,
      asset_size_bytes: asset.size,
    });

    const downloadUrl = buildInstallerDownloadLink({
      version: selectedVersion,
      platform: selectedPlatform,
      assetName: asset.name,
      source: 'hero_primary',
    });

    window.location.assign(downloadUrl);
  };

  const platformLabel = selectedPlatform === 'macOS' ? 'macOS' : selectedPlatform;
  const fileLabel = asset ? assetTypeLabel(asset.type) : '';

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-6">
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center z-10">

        {/* Dorky Terminal Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md mb-8 border transition-colors duration-300"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          <Terminal className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            Initializing local neural pathways...
          </span>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.3 }}
          className="mb-8"
        >
          <Image
            src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
            alt="NELA Logo"
            width={250}
            height={250}
            priority
            className="transition-opacity duration-300"
          />
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
          className="font-space text-7xl md:text-9xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(to bottom, var(--gradient-text-from), var(--gradient-text-to))' }}
        >
          NELA
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-3xl max-w-2xl mb-12 font-light"
          style={{ color: 'var(--text-secondary)' }}
        >
          Neural Engine for Local Analysis.
        </motion.p>

        {/* Download Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <button
            onClick={handleDownload}
            disabled={loading || !asset}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
          >
            <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" style={{ background: 'var(--accent)' }} />
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {loading ? 'Loading...' : `Download for ${platformLabel}`}
            </span>
          </button>

          <span className="font-mono text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {loading
              ? 'Fetching latest release...'
              : asset
              ? `${selectedVersion} • ${formatBytes(asset.size)} • ${fileLabel}`
              : `No ${platformLabel} release found`}
          </span>
        </motion.div>

      </div>
    </section>
  );
}
