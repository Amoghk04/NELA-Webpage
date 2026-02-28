import * as Lucide from 'lucide-react';

function IconOrFallback({ name, size, className }: { name: string; size?: number; className?: string }) {
  // access icon component by name from lucide namespace
  const Comp = (Lucide as any)[name];
  if (Comp) return <Comp className={className} size={size ?? 24} />;

  return (
    <div className={`w-9 h-9 mr-4 rounded bg-white/5 flex items-center justify-center ${className ?? ''}`}>
      <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity="0.06" />
      </svg>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Downloads</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <section id="models" className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Models</h2>
          <p className="mb-6 text-white/80">Select a model to download. Sizes and speeds vary.</p>

          <ul className="space-y-3">
            <li className="flex items-center justify-between bg-black/30 p-3 rounded">
              <div className="flex items-center">
                <IconOrFallback name="Cpu" className="flex-none mr-4" size={36} />
                <div>
                  <div className="font-medium">Small</div>
                  <div className="text-sm text-white/70">Fast — low resource footprint</div>
                </div>
              </div>
              <a href="/downloads/models/small" className="text-sm px-3 py-1 bg-[#00ffcc] text-black rounded flex items-center">
                Download
              </a>
            </li>

            <li className="flex items-center justify-between bg-black/30 p-3 rounded">
              <div className="flex items-center">
                <IconOrFallback name="HardDrive" className="flex-none mr-4" size={36} />
                <div>
                  <div className="font-medium">Medium</div>
                  <div className="text-sm text-white/70">Balanced speed and quality</div>
                </div>
              </div>
              <a href="/downloads/models/medium" className="text-sm px-3 py-1 bg-[#00ffcc] text-black rounded flex items-center">
                Download
              </a>
            </li>

            <li className="flex items-center justify-between bg-black/30 p-3 rounded">
              <div className="flex items-center">
                <IconOrFallback name="Server" className="flex-none mr-4" size={36} />
                <div>
                  <div className="font-medium">Large</div>
                  <div className="text-sm text-white/70">Highest quality — larger size</div>
                </div>
              </div>
              <a href="/downloads/models/large" className="text-sm px-3 py-1 bg-[#00ffcc] text-black rounded flex items-center">
                Download
              </a>
            </li>
          </ul>
        </section>

        <section id="installer" className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Installer</h2>
          <p className="mb-6 text-white/80">Download the installer for your operating system.</p>

          <div className="space-y-3">
            <a href="/downloads/installer/macos" className="flex items-center justify-between bg-black/30 p-3 rounded hover:bg-black/40">
              <div className="flex items-center">
                <IconOrFallback name="Apple" className="flex-none mr-4" size={36} />
                <div>
                  <div className="font-medium">macOS</div>
                  <div className="text-sm text-white/70">Universal (Intel & Apple Silicon)</div>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#00ffcc] text-black rounded">Download</span>
            </a>

            <a href="/downloads/installer/windows" className="flex items-center justify-between bg-black/30 p-3 rounded hover:bg-black/40">
              <div className="flex items-center">
                <IconOrFallback name="Monitor" className="flex-none mr-4" size={36} />
                <div>
                  <div className="font-medium">Windows</div>
                  <div className="text-sm text-white/70">64-bit installer (exe)</div>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#00ffcc] text-black rounded">Download</span>
            </a>

            <a href="/downloads/installer/linux" className="flex items-center justify-between bg-black/30 p-3 rounded hover:bg-black/40">
              <div className="flex items-center">
                <IconOrFallback name="Terminal" className="flex-none mr-4" size={36} />
                <div>
                  <div className="font-medium">Linux</div>
                  <div className="text-sm text-white/70">Deb / RPM / AppImage available</div>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#00ffcc] text-black rounded">Download</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
