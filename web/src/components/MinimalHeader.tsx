import { Button } from '../../../app/src/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface MinimalHeaderProps {
  onCreateProfile: () => void;
}

export function MinimalHeader({ onCreateProfile }: MinimalHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-[1200px] px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span className="text-lg font-semibold text-primary-foreground">V</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Voicebox</h1>
              <p className="text-xs text-muted-foreground">Voice Cloning Studio</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onCreateProfile}
              className="gap-2"
              size="default"
            >
              <PlusCircle className="h-4 w-4" />
              New Profile
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
