import { Card, CardContent } from '../../../app/src/components/ui/card';
import { Button } from '../../../app/src/components/ui/button';
import { Edit, Trash2, User } from 'lucide-react';
import type { VoiceProfileResponse } from '../../../app/src/lib/api';

interface VoiceProfileCardProps {
  profile: VoiceProfileResponse;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function VoiceProfileCard({
  profile,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: VoiceProfileCardProps) {
  return (
    <Card
      data-minimal-card
      className={`cursor-pointer transition-fast ${
        isSelected
          ? 'ring-2 ring-primary shadow-active'
          : 'hover:shadow-elevated'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        {/* Avatar + Name */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
            {profile.avatar_path ? (
              <img
                src={profile.avatar_path}
                alt={profile.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* Name + Language */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-foreground">
              {profile.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {profile.language.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Description */}
        {profile.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {profile.description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
