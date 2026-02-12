
interface MinimalLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
}

export function MinimalLayout({ sidebar, main }: MinimalLayoutProps) {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-6">
      {/* Grid Layout - Two columns on desktop, stacked on tablet/mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left Sidebar - Voice Profiles */}
        <aside className="animate-fade-in">
          {sidebar}
        </aside>

        {/* Right Main Content - Generation + Jobs */}
        <main className="min-w-0 animate-fade-in">
          {main}
        </main>
      </div>
    </div>
  );
}
