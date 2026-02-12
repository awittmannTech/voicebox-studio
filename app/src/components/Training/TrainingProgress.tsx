import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { TrainingJobResponse } from '@/lib/api/types';

interface TrainingProgressProps {
  job: TrainingJobResponse;
  onCancel: () => void;
  isCancelling: boolean;
}

function formatElapsed(startedAt?: string): string {
  if (!startedAt) return '';
  const start = new Date(startedAt).getTime();
  const elapsed = Math.floor((Date.now() - start) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Queued...';
    case 'preparing_data':
      return 'Preparing training data...';
    case 'training':
      return 'Training LoRA adapter...';
    case 'completed':
      return 'Training complete';
    case 'failed':
      return 'Training failed';
    case 'cancelled':
      return 'Training cancelled';
    default:
      return status;
  }
}

export function TrainingProgress({ job, onCancel, isCancelling }: TrainingProgressProps) {
  const isActive = ['pending', 'preparing_data', 'training'].includes(job.status);

  return (
    <div className="space-y-2 p-3 border rounded-md bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          <span className="text-sm font-medium">{getStatusLabel(job.status)}</span>
        </div>
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onCancel}
            disabled={isCancelling}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      <Progress value={job.progress} className="h-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {job.status === 'training' && job.total_epochs > 0 && (
            <span>
              Epoch {job.current_epoch}/{job.total_epochs}
            </span>
          )}
          {job.status === 'training' && job.total_steps > 0 && (
            <span>
              Step {job.current_step}/{job.total_steps}
            </span>
          )}
          {job.loss !== undefined && job.loss !== null && job.loss > 0 && (
            <span>Loss: {job.loss.toFixed(4)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>{Math.round(job.progress)}%</span>
          {job.started_at && <span>{formatElapsed(job.started_at)}</span>}
        </div>
      </div>

      {job.error_message && <p className="text-xs text-destructive mt-1">{job.error_message}</p>}
    </div>
  );
}
