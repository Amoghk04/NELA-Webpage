'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Download, ChevronDown } from 'lucide-react';
import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';
import { buildInstallerDownloadLink } from '@/lib/download-links';
import {
  assetsFor,
  formatBytes,
  assetTypeLabel,
  type ReleasesData,
  type ReleaseAsset,
  type ParsedVersion,
} from '@/lib/releases';

type OsIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const OS_META: Record<string, { icon: OsIcon; label: string; desc: string }> = {
  Windows: { icon: FaWindows, label: 'Windows', desc: '64-bit installer' },
  Linux:   { icon: FaLinux,   label: 'Linux',   desc: 'Deb' },
  macOS:   { icon: FaApple,   label: 'macOS',   desc: 'Universal binary' },
};

// ── Version dropdown ──────────────────────────────────────────────────────────
interface VersionSelectProps {
  versions: ParsedVersion[];
  latestVersion: string | null;
  value: string;
  onChange: (ver: string) => void;
}

function VersionSelect({ versions, latestVersion, value, onChange }: VersionSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const displayLabel = (ver: string) =>
    ver === latestVersion ? `${ver}  (latest)` : ver;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 font-mono text-sm px-4 py-2 rounded-lg border backdrop-blur-sm cursor-pointer outline-none transition-colors duration-200"
        style={{
          background: open ? 'var(--bg-card-hover)' : 'var(--bg-card)',
          borderColor: open ? 'var(--accent)' : 'var(--border-subtle)',
          color: 'var(--text-primary)',
          boxShadow: open ? '0 0 0 2px var(--accent-glow)' : 'none',
        }}
      >
        <span>{displayLabel(value)}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <ChevronDown
            className="w-3.5 h-3.5"
            style={{ color: open ? 'var(--accent)' : 'var(--text-tertiary)' }}
          />
        </motion.div>
      </button>

      {/* Dropdown list */}
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-2 min-w-full rounded-xl border overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {versions.map((v) => {
              const isSelected = v.version === value;
              return (
                <li key={v.version}>
                  <button
                    type="button"
                    onClick={() => { onChange(v.version); setOpen(false); }}
                    className="w-full text-left font-mono text-sm px-4 py-2.5 transition-colors duration-150 flex items-center justify-between gap-4"
                    style={{
                      background: isSelected ? 'var(--accent-glow)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--border-primary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <span>{v.version}</span>
                    {v.version === latestVersion && (
                      <span
                        className="font-mono text-xs px-1.5 py-0.5 rounded-md border"
                        style={{
                          color: 'var(--accent)',
                          borderColor: 'var(--accent)',
                          background: 'var(--accent-glow)',
                        }}
                      >
                        latest
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssetRow({
  asset,
  index,
  selectedOS,
  selectedVer,
}: {
  asset: ReleaseAsset;
  index: number;
  selectedOS: string;
  selectedVer: string;
}) {
  const [hovered, setHovered] = useState(false);

  const handleInstallerDownload = () => {
    trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
      source: 'download_installer',
      platform: selectedOS,
      version: selectedVer,
      asset_name: asset.name,
      asset_type: asset.type,
      asset_size_bytes: asset.size,
    });

    const downloadUrl = buildInstallerDownloadLink({
      version: selectedVer,
      platform: selectedOS,
      assetName: asset.name,
      source: 'download_installer',
    });

    window.location.assign(downloadUrl);
  };

  return (
    <motion.button
      onClick={handleInstallerDownload}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      className="group relative w-full flex items-center justify-between rounded-xl border backdrop-blur-sm px-5 py-4 text-left overflow-hidden"
      style={{
        background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        borderColor: hovered ? 'var(--border-primary)' : 'var(--border-subtle)',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Left accent bar */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
        style={{ background: 'var(--accent)' }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* File info */}
      <div className="pl-1">
        <span
          className="font-mono text-sm font-semibold transition-colors duration-200"
          style={{ color: hovered ? 'var(--accent)' : 'var(--text-primary)' }}
        >
          {asset.name}
        </span>
        <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {assetTypeLabel(asset.type)} • {formatBytes(asset.size)}
        </p>
      </div>

      {/* Download icon */}
      <motion.div
        animate={{ y: hovered ? 2 : 0, opacity: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
        className="shrink-0 ml-4"
      >
        <Download
          className="w-4 h-4"
          style={{ color: hovered ? 'var(--accent)' : 'var(--text-muted)' }}
        />
      </motion.div>
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
        <VersionSelect
          versions={data.versions}
          latestVersion={data.latestVersion}
          value={selectedVer}
          onChange={(ver) => {
            trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
              source: 'download_installer',
              feature: 'version_selector',
              action: 'select',
              version: ver,
            });

            setSelectedVer(ver);
            const v = data.versions.find((v) => v.version === ver);
            const platforms = v ? Object.keys(v.platforms) : [];
            setSelectedOS(platforms.includes('Windows') ? 'Windows' : (platforms[0] ?? ''));
          }}
        />
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
              onClick={() => {
                if (!available) return;

                trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
                  source: 'download_installer',
                  feature: 'platform_selector',
                  action: 'select',
                  platform: os,
                  version: selectedVer,
                });

                setSelectedOS(os);
              }}
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
              <AssetRow
                key={asset.name}
                asset={asset}
                index={i}
                selectedOS={selectedOS}
                selectedVer={selectedVer}
              />
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
