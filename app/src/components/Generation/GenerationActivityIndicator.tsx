import { Loader2, Cpu, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGenerationActivity } from '@/lib/hooks/useGenerationActivity';
import type { GenerationStage } from '@/stores/generationStore';
import { cn } from '@/lib/utils/cn';

interface GenerationActivityIndicatorProps {
  compact?: boolean;
}

const STAGES_ORDER: { key: GenerationStage; label: string }[] = [
  { key: 'loading_model', label: 'Load' },
  { key: 'creating_voice_prompt', label: 'Prompt' },
  { key: 'generating_audio', label: 'Generate' },
  { key: 'saving', label: 'Save' },
];

function StageSteps({ currentStage }: { currentStage: GenerationStage }) {
  const currentIndex = STAGES_ORDER.findIndex((s) => s.key === currentStage);

  return (
    <div className="flex items-center gap-1">
      {STAGES_ORDER.map((step, index) => {
        const isComplete = currentIndex > index || currentStage === 'complete';
        const isCurrent = currentIndex === index;

        return (
          <div key={step.key} className="flex items-center gap-1">
            {index > 0 && (
              <div
                className={cn(
                  'w-4 h-px',
                  isComplete ? 'bg-accent' : 'bg-muted-foreground/30',
                )}
              />
            )}
            <div
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                isComplete && 'text-accent',
                isCurrent && 'text-accent bg-accent/10',
                !isComplete && !isCurrent && 'text-muted-foreground/50',
              )}
            >
              {isComplete ? (
                <Check className="h-2.5 w-2.5" />
              ) : isCurrent ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : null}
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CPUModeIndicator({ stage, stageKey }: { stage: string; stageKey: GenerationStage }) {
  return (
    <Card className="border-muted">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {stage} (CPU mode)
          </span>
        </div>
        {stageKey && <StageSteps currentStage={stageKey} />}
        <p className="text-xs text-muted-foreground mt-2">
          CPU generation is slower than GPU
        </p>
      </CardContent>
    </Card>
  );
}

function CompactIndicator({
  stage,
  stageKey,
  progress,
  vramUsedMB,
  vramDelta,
}: {
  stage: string;
  stageKey: GenerationStage;
  progress: number;
  vramUsedMB: number | null;
  vramDelta: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="font-medium">{stage}</span>
        </div>

        {vramUsedMB !== null && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs">VRAM: {(vramUsedMB / 1024).toFixed(1)}GB</span>
            {vramDelta > 0 && (
              <span className="text-xs text-green-500">
                (+{(vramDelta / 1024).toFixed(1)}GB)
              </span>
            )}
          </div>
        )}
      </div>
      {stageKey && <StageSteps currentStage={stageKey} />}
      {progress > 0 && <Progress value={progress} className="h-1" />}
    </div>
  );
}

export function GenerationActivityIndicator({
  compact = false,
}: GenerationActivityIndicatorProps) {
  const { vramUsedMB, vramDelta, stage, stageKey, progress, gpuType, gpuAvailable } =
    useGenerationActivity();

  // CPU mode fallback
  if (!gpuAvailable) {
    if (compact) {
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="h-4 w-4" />
            <span>{stage} (CPU)</span>
          </div>
          {stageKey && <StageSteps currentStage={stageKey} />}
          {progress > 0 && <Progress value={progress} className="h-1" />}
        </div>
      );
    }
    return <CPUModeIndicator stage={stage} stageKey={stageKey} />;
  }

  // Compact mode for inline display
  if (compact) {
    return (
      <CompactIndicator
        stage={stage}
        stageKey={stageKey}
        progress={progress}
        vramUsedMB={vramUsedMB}
        vramDelta={vramDelta}
      />
    );
  }

  // Full mode for card display
  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-sm font-medium">{stage}</span>
        </div>

        {stageKey && (
          <div className="mb-3">
            <StageSteps currentStage={stageKey} />
          </div>
        )}

        {progress > 0 && (
          <Progress value={progress} className="h-1.5 mb-2" />
        )}

        {vramUsedMB !== null && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>GPU: {gpuType || 'Unknown'}</span>
              <span>
                VRAM: {(vramUsedMB / 1024).toFixed(1)}GB
                {vramDelta > 0 && (
                  <span className="text-green-500 ml-1">
                    (+{(vramDelta / 1024).toFixed(2)}GB)
                  </span>
                )}
              </span>
            </div>
            {!progress && (
              <Progress
                value={Math.min((vramUsedMB / 8192) * 100, 100)}
                className="h-1.5"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
