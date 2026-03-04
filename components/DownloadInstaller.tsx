'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Download, ChevronDown } from 'lucide-react';
import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';
import { useState } from 'react';
import {
  assetsFor,
  formatBytes,
  assetTypeLabel,
  type ReleasesData,
  type ReleaseAsset,
} from '@/lib/releases';

type OsIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const OS_META: Record<string, { icon: OsIcon; label: string; desc: string }> = {
  Windows: { icon: FaWindows, label: 'Windows', desc: '64-bit installer' },
  Linux:   { icon: FaLinux,   label: 'Linux',   desc: 'Deb / AppImage' },
  macOS:   { icon: FaApple,   label: 'macOS',   desc: 'Universal binary' },
};

function AssetRow({ asset, index }: { asset: ReleaseAsset; index: number }) {
  return (
    <motion.button
      onClick={() => window.open(asset.download_url)}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      className="group w-full flex items-center justify-between rounded-xl border backdrop-blur-sm px-5 py-4 text-left transition-all duration-300"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
    >
      <div>
        <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {asset.name}
        </span>
        <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {assetTypeLabel(asset.type)} • {formatBytes(asset.size)}
        </p>
      </div>
      <Download
        className="w-4 h-4 shrink-0 ml-4"
        style={{ color: 'var(--text-muted)' }}
      />
    </motion.button>
  );
}

interface Props {
  data: ReleasesData;
}

export default function DownloadInstaller({ data }: Props) {
  // Determine the initial OS: prefer Windows if available in the latest version
  const initialVersion = data.latestVersion ?? data.versions[0]?.version ?? '';
  const initialVersionData = data.versions.find((v) => v.version === initialVersion);
  const initialPlatforms = initialVersionData ? Object.keys(initialVersionData.platforms) : [];
  const initialOS = initialPlatforms.includes('Windows') ? 'Windows' : (initialPlatforms[0] ?? '');

  const [selectedOS, setSelectedOS]   = useState(initialOS);
  const [selectedVer, setSelectedVer] = useState(initialVersion);

  const selectedVersionData = data.versions.find((v) => v.version === selectedVer);
  const availablePlatforms  = selectedVersionData ? Object.keys(selectedVersionData.platforms) : [];
  const currentAssets: ReleaseAsset[] = assetsFor(data, selectedVer, selectedOS);

  return (
    <div className="space-y-8">

      {/* Version selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <span
          className="font-mono text-xs uppercase tracking-widest shrink-0"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Version
        </span>
        <div className="relative">
          <select
            value={selectedVer}
            onChange={(e) => {
              const ver = e.target.value;
              setSelectedVer(ver);
              const v = data.versions.find((v) => v.version === ver);
              const platforms = v ? Object.keys(v.platforms) : [];
              setSelectedOS(platforms.includes('Windows') ? 'Windows' : (platforms[0] ?? ''));
            }}
            className="appearance-none font-mono text-sm px-4 py-2 pr-8 rounded-lg border cursor-pointer focus:outline-none"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          >
            {data.versions.map((v) => (
              <option key={v.version} value={v.version}>
                {v.version}{v.version === data.latestVersion ? '  (latest)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>
      </div>

      {/* OS selector cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {Object.entries(OS_META).map(([os, meta], i) => {
          const available = availablePlatforms.includes(os);
          const isSelected = selectedOS === os;
          const Icon: OsIcon = meta.icon;
          return (
            <motion.button
              key={os}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              onClick={() => available && setSelectedOS(os)}
              disabled={!available}
              aria-pressed={isSelected}
              className="rounded-2xl border backdrop-blur-sm p-6 flex flex-col items-center text-center transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isSelected ? 'var(--accent)' : 'var(--bg-card)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
              }}
            >
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <Icon
                  className="w-8 h-8"
                  style={{ color: isSelected ? 'var(--bg-primary)' : 'var(--text-secondary)' }}
                />
              </div>
              <span
                className="font-space text-lg font-semibold mb-1"
                style={{ color: isSelected ? 'var(--bg-primary)' : 'var(--text-primary)' }}
              >
                {meta.label}
              </span>
              <span
                className="text-sm font-light"
                style={{ color: isSelected ? 'var(--bg-primary)' : 'var(--text-tertiary)' }}
              >
                {available ? meta.desc : 'Not available'}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* File list */}
      <AnimatePresence mode="wait">
        {currentAssets.length > 0 ? (
          <motion.div
            key={`${selectedOS}-${selectedVer}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {currentAssets.map((asset, i) => (
              <AssetRow key={asset.name} asset={asset} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-mono text-sm text-center py-6"
            style={{ color: 'var(--text-tertiary)' }}
          >
            No installer files found for {selectedOS} {selectedVer}.
          </motion.p>
        )}
      </AnimatePresence>

    </div>
  );
}
