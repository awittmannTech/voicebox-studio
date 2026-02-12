import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/src/components/ui/card';
import { Button } from '../../../app/src/components/ui/button';
import { Textarea } from '../../../app/src/components/ui/textarea';
import { Label } from '../../../app/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../app/src/components/ui/select';
import { DefaultService } from '../../../app/src/lib/api';
import { useToast } from '../../../app/src/components/ui/use-toast';
import { Wand2, Loader2 } from 'lucide-react';

interface GenerationInputBoxProps {
  selectedProfileId: string | null;
  onSelectProfile: (id: string) => void;
}

const MODEL_SIZES = [
  { value: '1.7B', label: '1.7B (Recommended)' },
  { value: '0.6B', label: '0.6B (Faster)' },
];

const MAX_CHARS = 1000;

export function GenerationInputBox({
  selectedProfileId,
  onSelectProfile,
}: GenerationInputBoxProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [text, setText] = useState('');
  const [modelSize, setModelSize] = useState('1.7B');

  // Fetch profiles for dropdown
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => DefaultService.listProfilesProfilesGet(),
  });

  // Generate speech mutation
  const generateMutation = useMutation({
    mutationFn: () => {
      if (!selectedProfileId) {
        throw new Error('No profile selected');
      }

      return DefaultService.generateSpeechGeneratePost({
        requestBody: {
          profile_id: selectedProfileId,
          text,
          model_size: modelSize,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      toast({
        title: 'Generation started',
        description: 'Your speech is being generated. Check the jobs table below.',
      });
      setText(''); // Clear text after successful generation
    },
    onError: (error) => {
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to start speech generation.',
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedProfileId) {
      toast({
        title: 'No profile selected',
        description: 'Please select a voice profile first.',
        variant: 'destructive',
      });
      return;
    }

    if (!text.trim()) {
      toast({
        title: 'No text entered',
        description: 'Please enter some text to generate speech.',
        variant: 'destructive',
      });
      return;
    }

    if (text.length > MAX_CHARS) {
      toast({
        title: 'Text too long',
        description: `Text must be ${MAX_CHARS} characters or less.`,
        variant: 'destructive',
      });
      return;
    }

    generateMutation.mutate();
  };

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <Card data-minimal-card>
      <CardHeader>
        <CardTitle className="text-lg">Generate Speech</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Profile Selector */}
        <div className="space-y-2">
          <Label htmlFor="profile-select">Voice Profile *</Label>
          <Select
            value={selectedProfileId || undefined}
            onValueChange={onSelectProfile}
          >
            <SelectTrigger id="profile-select">
              <SelectValue placeholder="Select a voice profile" />
            </SelectTrigger>
            <SelectContent>
              {profiles.length === 0 ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No profiles available. Create one first.
                </div>
              ) : (
                profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name} ({profile.language.toUpperCase()})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Model Size Selector */}
        <div className="space-y-2">
          <Label htmlFor="model-size">Model Size</Label>
          <Select value={modelSize} onValueChange={setModelSize}>
            <SelectTrigger id="model-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="text-input">Text *</Label>
            <span
              className={`text-xs ${
                isOverLimit ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {charCount} / {MAX_CHARS}
            </span>
          </div>
          <Textarea
            id="text-input"
            placeholder="Enter the text you want to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className={isOverLimit ? 'border-destructive' : ''}
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || !selectedProfileId || !text.trim() || isOverLimit}
          className="w-full gap-2"
          size="lg"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              Generate Speech
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
