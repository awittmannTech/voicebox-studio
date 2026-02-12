import { BarChart3, Cpu, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useServerHealth } from '@/lib/hooks/useServer';
import { cn } from '@/lib/utils/cn';

interface GenerationStatusProps {
  compact?: boolean;
  className?: string;
}

export function GenerationStatus({ compact = false, className }: GenerationStatusProps) {
  const { data: health } = useServerHealth();

  if (!health) {
    return null;
  }

  if (compact) {
    // Compact view: single line with key info
    const parts: string[] = [];

    if (health.gpu_available && health.gpu_type) {
      // Extract short GPU name (e.g., "RTX 2060" from "CUDA (NVIDIA GeForce RTX 2060)")
      const gpuMatch = health.gpu_type.match(/(?:NVIDIA|AMD|Apple)\s+(.+?)(?:\)|$)/);
      const gpuName = gpuMatch ? gpuMatch[1].trim() : 'GPU';
      parts.push(`GPU: ${gpuName}`);
    } else {
      parts.push('GPU: CPU');
    }

    if (health.model_size) {
      parts.push(health.model_size);
    }

    if (health.vram_used_mb && health.gpu_available) {
      parts.push(`${(health.vram_used_mb / 1024).toFixed(1)}GB VRAM`);
    }

    return (
      <div className={cn('text-xs text-muted-foreground', className)}>
        {parts.join(' • ')}
      </div>
    );
  }

  // Expanded view: badges with icons
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {/* GPU Status */}
      <Badge
        variant={health.gpu_available ? 'default' : 'secondary'}
        className="text-xs gap-1"
      >
        <Cpu className="h-3 w-3" />
        {health.gpu_available ? (
          health.gpu_type?.includes('CUDA') ? 'NVIDIA' :
          health.gpu_type?.includes('MLX') ? 'Apple' :
          health.gpu_type?.includes('Metal') ? 'Metal' :
          'GPU'
        ) : (
          'CPU'
        )}
      </Badge>

      {/* Model Status */}
      {health.model_size && (
        <Badge
          variant={health.model_loaded || health.model_downloaded ? 'default' : 'secondary'}
          className="text-xs gap-1"
        >
          <Zap className="h-3 w-3" />
          {health.model_size}
          {health.model_loaded || health.model_downloaded ? ' Loaded' : ''}
        </Badge>
      )}

      {/* VRAM Usage */}
      {health.vram_used_mb && health.gpu_available && (
        <Badge variant="outline" className="text-xs gap-1">
          <BarChart3 className="h-3 w-3" />
          {(health.vram_used_mb / 1024).toFixed(1)}GB
        </Badge>
      )}
    </div>
  );
}
