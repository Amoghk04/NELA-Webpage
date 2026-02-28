export default function DocsSidebar() {
  return (
    <aside className="hidden md:block w-56 pr-6 sticky top-24">
      <nav className="bg-transparent">
        <ul className="space-y-3 text-sm">
          <li>
            <a href="#installation" className="text-[#00ffcc] hover:underline">
              Installation
            </a>
          </li>
          <li>
            <a href="#models" className="text-white/90 hover:underline">
              Models
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="text-white/90 hover:underline">
              How it works
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
