import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="fixed top-4 right-6 z-50">
      <nav className="bg-black/50 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-4">
        <Link href="/" className="text-base font-medium px-4 py-1 hover:text-[#00ffcc]">
          Home
        </Link>
        <Link href="/docs" className="text-base font-medium px-4 py-1 hover:text-[#00ffcc]">
          Docs
        </Link>
        <Link href="/download" className="text-base font-medium px-4 py-1 bg-[#00ffcc] text-black rounded-full shadow-sm hover:opacity-90">
          Download
        </Link>
      </nav>
    </header>
  );
}
