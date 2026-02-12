import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { useToast } from './use-toast';

export function Toaster() {
  const { toasts } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, toastId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(toastId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => {
        // Extract text content for copying
        const titleText = typeof title === 'string' ? title : '';
        const descriptionText = typeof description === 'string' ? description : '';
        const copyText = [titleText, descriptionText].filter(Boolean).join('\n');
        const hasCopyableContent = copyText.length > 0;

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1 flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            <div className="flex items-center gap-2">
              {hasCopyableContent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copyToClipboard(copyText, id)}
                >
                  {copiedId === id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
              {action}
              <ToastClose />
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
