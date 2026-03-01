export default function DocsSidebar() {
  return (
    <aside className="hidden md:block w-56 pr-6 sticky top-24">
      <nav className="bg-transparent">
        <ul className="space-y-3 text-sm">
          <li>
            <a href="#installation" className="hover:underline" style={{ color: 'var(--accent)' }}>
              Installation
            </a>
          </li>
          <li>
            <a href="#models" className="hover:underline" style={{ color: 'var(--text-primary)' }}>
              Models
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="hover:underline" style={{ color: 'var(--text-primary)' }}>
              How it works
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
