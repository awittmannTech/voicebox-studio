import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../app/src/components/ui/dialog';
import { Button } from '../../../app/src/components/ui/button';
import { Input } from '../../../app/src/components/ui/input';
import { Label } from '../../../app/src/components/ui/label';
import { Textarea } from '../../../app/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../app/src/components/ui/select';
import { DefaultService, type VoiceProfileResponse } from '../../../app/src/lib/api';
import { useToast } from '../../../app/src/components/ui/use-toast';
import { Upload, X, Loader2 } from 'lucide-react';

interface EditProfileDialogProps {
  profile: VoiceProfileResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
];

export function EditProfileDialog({ profile, open, onOpenChange }: EditProfileDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description || '');
  const [language, setLanguage] = useState(profile.language);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);

  // Reset form when profile changes
  useEffect(() => {
    setName(profile.name);
    setDescription(profile.description || '');
    setLanguage(profile.language);
    setAudioFiles([]);
  }, [profile]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Update the profile
      const updated = await DefaultService.updateProfileProfilesProfileIdPut({
        profileId: profile.id,
        requestBody: {
          name,
          description: description || null,
          language,
        },
      });

      // Step 2: Upload new audio samples if any
      if (audioFiles.length > 0) {
        for (const file of audioFiles) {
          await DefaultService.addProfileSampleProfilesProfileIdSamplesPost({
            profileId: profile.id,
            formData: {
              file,
              reference_text: '', // Optional reference text
            },
          });
        }
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Profile updated',
        description: 'Voice profile has been updated successfully.',
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update voice profile.',
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAudioFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAudioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setAudioFiles([]);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a profile name.',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Voice Profile</DialogTitle>
          <DialogDescription>
            Update the profile details or add new audio samples.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter profile name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Add Audio Samples */}
          <div className="space-y-2">
            <Label htmlFor="audio-samples">Add Audio Samples</Label>
            <div className="space-y-2">
              {/* File input */}
              <label
                htmlFor="audio-upload"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 transition-colors hover:border-primary/50"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload new audio files
                </span>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {/* New file list */}
              {audioFiles.length > 0 && (
                <div className="space-y-2">
                  {audioFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-muted p-2 text-sm"
                    >
                      <span className="truncate text-foreground">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
