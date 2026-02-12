import { useState } from 'react';
import { MinimalHeader } from './components/MinimalHeader';
import { MinimalLayout } from './components/MinimalLayout';
import { VoiceProfileGrid } from './components/VoiceProfileGrid';
import { GenerationInputBox } from './components/GenerationInputBox';
import { JobsTable } from './components/JobsTable';
import { CreateProfileDialog } from './components/CreateProfileDialog';
import { Toaster } from '../../app/src/components/ui/toaster';

// Import minimal theme
import './styles/minimal-theme.css';

export default function MinimalApp() {
  // Dialog states
  const [showCreateProfile, setShowCreateProfile] = useState(false);

  // Selected voice profile for generation
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <MinimalHeader onCreateProfile={() => setShowCreateProfile(true)} />

      {/* Main Layout */}
      <MinimalLayout
        sidebar={
          <VoiceProfileGrid
            selectedProfileId={selectedProfileId}
            onSelectProfile={setSelectedProfileId}
            onCreateProfile={() => setShowCreateProfile(true)}
          />
        }
        main={
          <div className="space-y-6">
            {/* Generation Input */}
            <GenerationInputBox
              selectedProfileId={selectedProfileId}
              onSelectProfile={setSelectedProfileId}
            />

            {/* Jobs Table */}
            <JobsTable />
          </div>
        }
      />

      {/* Dialogs */}
      <CreateProfileDialog
        open={showCreateProfile}
        onOpenChange={setShowCreateProfile}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
