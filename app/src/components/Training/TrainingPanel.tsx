import { Brain, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import {
  useAdapterInfo,
  useCancelTraining,
  useDeleteAdapter,
  useProfileTrainingJobs,
  useStartTraining,
  useTrainingJob,
  useTrainingProgress,
} from '@/lib/hooks/useTraining';
import { useTrainingStore } from '@/stores/trainingStore';
import { TrainingProgress } from './TrainingProgress';

interface TrainingPanelProps {
  profileId: string;
}

export function TrainingPanel({ profileId }: TrainingPanelProps) {
  const { toast } = useToast();
  const [showConfig, setShowConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [epochs, setEpochs] = useState(10);
  const [learningRate, setLearningRate] = useState('2e-5');
  const [loraRank, setLoraRank] = useState('16');

  const activeJobId = useTrainingStore((state) => state.activeJobId);
  const activeProfileId = useTrainingStore((state) => state.activeProfileId);

  const isThisProfileTraining = activeProfileId === profileId;
  const currentJobId = isThisProfileTraining ? activeJobId : null;

  const { data: adapterInfo } = useAdapterInfo(profileId);
  const { data: trainingJobs } = useProfileTrainingJobs(profileId);
  const { data: activeJob } = useTrainingJob(currentJobId);
  const startTraining = useStartTraining();
  const cancelTraining = useCancelTraining();
  const deleteAdapter = useDeleteAdapter();

  // Subscribe to SSE progress
  useTrainingProgress(currentJobId);

  const handleStartTraining = async () => {
    try {
      await startTraining.mutateAsync({
        profile_id: profileId,
        num_epochs: epochs,
        learning_rate: parseFloat(learningRate),
        lora_rank: parseInt(loraRank, 10),
        lora_alpha: parseInt(loraRank, 10) * 2,
        batch_size: 1,
      });
      setShowConfig(false);
      toast({
        title: 'Training started',
        description: 'LoRA fine-tuning job has been queued.',
      });
    } catch (error) {
      toast({
        title: 'Failed to start training',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleCancelTraining = async () => {
    if (!currentJobId) return;
    try {
      await cancelTraining.mutateAsync(currentJobId);
      toast({ title: 'Training cancelled' });
    } catch (error) {
      toast({
        title: 'Failed to cancel training',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAdapter = async () => {
    try {
      await deleteAdapter.mutateAsync(profileId);
      toast({ title: 'Adapter deleted' });
    } catch (error) {
      toast({
        title: 'Failed to delete adapter',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const isTrainingActive =
    activeJob && ['pending', 'preparing_data', 'training'].includes(activeJob.status);

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">LoRA Fine-Tuning</span>
        </div>
        <div className="flex items-center gap-2">
          {adapterInfo?.has_adapter ? (
            <Badge variant="secondary" className="text-xs">
              Trained
              {adapterInfo.trained_at && (
                <span className="ml-1 text-muted-foreground">
                  {new Date(adapterInfo.trained_at).toLocaleDateString()}
                </span>
              )}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              No Adapter
            </Badge>
          )}
        </div>
      </div>

      {/* Active training progress */}
      {isTrainingActive && activeJob && (
        <TrainingProgress
          job={activeJob}
          onCancel={handleCancelTraining}
          isCancelling={cancelTraining.isPending}
        />
      )}

      {/* Actions */}
      {!isTrainingActive && (
        <div className="flex items-center gap-2">
          {!showConfig ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
              disabled={startTraining.isPending}
            >
              <Brain className="h-3.5 w-3.5 mr-1.5" />
              Train Adapter
            </Button>
          ) : (
            <div className="w-full space-y-3 p-3 border rounded-md bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Epochs: {epochs}</Label>
                </div>
                <Slider
                  value={[epochs]}
                  onValueChange={([v]) => setEpochs(v)}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Learning Rate</Label>
                  <Select value={learningRate} onValueChange={setLearningRate}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1e-5">1e-5 (Conservative)</SelectItem>
                      <SelectItem value="2e-5">2e-5 (Default)</SelectItem>
                      <SelectItem value="5e-5">5e-5 (Aggressive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">LoRA Rank</Label>
                  <Select value={loraRank} onValueChange={setLoraRank}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8 (Lighter)</SelectItem>
                      <SelectItem value="16">16 (Default)</SelectItem>
                      <SelectItem value="32">32 (More capacity)</SelectItem>
                      <SelectItem value="64">64 (Maximum)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowConfig(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleStartTraining} disabled={startTraining.isPending}>
                  {startTraining.isPending ? 'Starting...' : 'Start Training'}
                </Button>
              </div>
            </div>
          )}

          {adapterInfo?.has_adapter && !showConfig && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAdapter}
              disabled={deleteAdapter.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete Adapter
            </Button>
          )}
        </div>
      )}

      {/* Training history */}
      {trainingJobs && trainingJobs.total > 0 && (
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Training History ({trainingJobs.total})
          </button>

          {showHistory && (
            <div className="mt-2 space-y-1.5">
              {trainingJobs.items.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        job.status === 'completed'
                          ? 'default'
                          : job.status === 'failed'
                            ? 'destructive'
                            : 'outline'
                      }
                      className="text-[10px] h-4 px-1"
                    >
                      {job.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {job.num_epochs} epochs, rank {job.lora_rank}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
