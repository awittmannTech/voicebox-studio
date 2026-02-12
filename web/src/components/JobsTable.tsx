import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/src/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../app/src/components/ui/table';
import { Button } from '../../../app/src/components/ui/button';
import { Badge } from '../../../app/src/components/ui/badge';
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
import { DefaultService, type HistoryResponse } from '../../../app/src/lib/api';
import { useToast } from '../../../app/src/components/ui/use-toast';
import { useServerStore } from '../../../app/src/stores/serverStore';
import { Play, Download, Trash2, Loader2, Filter } from 'lucide-react';

export function JobsTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const serverUrl = useServerStore((state) => state.serverUrl);

  // Filter state
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Delete confirmation state
  const [deletingItem, setDeletingItem] = useState<HistoryResponse | null>(null);

  // Playing audio state
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Fetch history
  const {
    data: historyData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['history'],
    queryFn: () => DefaultService.listHistoryHistoryGet({}),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Delete generation mutation
  const deleteMutation = useMutation({
    mutationFn: (generationId: string) =>
      DefaultService.deleteGenerationHistoryGenerationIdDelete({ generationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      toast({
        title: 'Generation deleted',
        description: 'Generation has been deleted successfully.',
      });
      setDeletingItem(null);
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete generation.',
        variant: 'destructive',
      });
    },
  });

  const handlePlay = (item: HistoryResponse) => {
    setPlayingId(item.id);
    const audio = new Audio(`${serverUrl}/audio/${item.id}`);
    audio.play();
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      setPlayingId(null);
      toast({
        title: 'Playback error',
        description: 'Failed to play audio.',
        variant: 'destructive',
      });
    };
  };

  const handleDownload = (item: HistoryResponse) => {
    const link = document.createElement('a');
    link.href = `${serverUrl}/audio/${item.id}`;
    link.download = `${item.profile_name}-${item.id}.wav`;
    link.click();
  };

  const items = historyData?.items || [];
  const filteredItems = showActiveOnly
    ? items.filter((item) => item.duration === 0) // 0 duration means still generating
    : items;

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'Generating...';
    return `${seconds.toFixed(1)}s`;
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Card data-minimal-card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Generation History</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={showActiveOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {showActiveOnly ? 'Show All' : 'Active Only'}
              </Button>
              <span className="text-xs text-muted-foreground">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">
                Failed to load history: {error.message}
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/20 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {showActiveOnly
                  ? 'No active generations.'
                  : 'No generations yet. Create one above.'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Voice</TableHead>
                    <TableHead>Text</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Duration</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const isGenerating = item.duration === 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="truncate">
                            {item.profile_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.language.toUpperCase()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm" title={item.text}>
                            {truncateText(item.text, 80)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isGenerating ? (
                            <Badge variant="secondary" className="gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Generating
                            </Badge>
                          ) : (
                            <Badge className="bg-success">Done</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDuration(item.duration)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handlePlay(item)}
                              disabled={isGenerating || playingId === item.id}
                              title="Play"
                            >
                              {playingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDownload(item)}
                              disabled={isGenerating}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeletingItem(item)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete generation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this generation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
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
