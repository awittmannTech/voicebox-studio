import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../app/src/components/ui/button';
import { VoiceProfileCard } from './VoiceProfileCard';
import { EditProfileDialog } from './EditProfileDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../app/src/components/ui/alert-dialog';
import { DefaultService, type VoiceProfileResponse } from '../../../app/src/lib/api';
import { useToast } from '../../../app/src/components/ui/use-toast';
import { PlusCircle, Loader2 } from 'lucide-react';

interface VoiceProfileGridProps {
  selectedProfileId: string | null;
  onSelectProfile: (id: string | null) => void;
  onCreateProfile: () => void;
}

export function VoiceProfileGrid({
  selectedProfileId,
  onSelectProfile,
  onCreateProfile,
}: VoiceProfileGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Edit dialog state
  const [editingProfile, setEditingProfile] = useState<VoiceProfileResponse | null>(null);

  // Delete confirmation state
  const [deletingProfile, setDeletingProfile] = useState<VoiceProfileResponse | null>(null);

  // Fetch profiles
  const {
    data: profiles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => DefaultService.listProfilesProfilesGet(),
  });

  // Delete profile mutation
  const deleteMutation = useMutation({
    mutationFn: (profileId: string) =>
      DefaultService.deleteProfileProfilesProfileIdDelete({ profileId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Profile deleted',
        description: 'Voice profile has been deleted successfully.',
      });
      setDeletingProfile(null);
      // Clear selection if deleted profile was selected
      if (selectedProfileId === deletingProfile?.id) {
        onSelectProfile(null);
      }
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete voice profile.',
        variant: 'destructive',
      });
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">
          Failed to load profiles: {error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Voice Profiles</h2>
          <span className="text-xs text-muted-foreground">
            {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'}
          </span>
        </div>

        {/* Create Button */}
        <Button
          onClick={onCreateProfile}
          variant="outline"
          className="w-full justify-start gap-2 border-dashed"
        >
          <PlusCircle className="h-4 w-4" />
          Create Profile
        </Button>

        {/* Profile Grid */}
        {profiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/20 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No voice profiles yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <VoiceProfileCard
                key={profile.id}
                profile={profile}
                isSelected={selectedProfileId === profile.id}
                onSelect={() =>
                  onSelectProfile(
                    selectedProfileId === profile.id ? null : profile.id
                  )
                }
                onEdit={() => setEditingProfile(profile)}
                onDelete={() => setDeletingProfile(profile)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      {editingProfile && (
        <EditProfileDialog
          profile={editingProfile}
          open={!!editingProfile}
          onOpenChange={(open) => !open && setEditingProfile(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingProfile}
        onOpenChange={(open) => !open && setDeletingProfile(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete voice profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingProfile?.name}" and all its
              samples. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProfile && deleteMutation.mutate(deletingProfile.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
