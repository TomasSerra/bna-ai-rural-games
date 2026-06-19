import { useState } from 'react';
import { ExternalLink, KeyRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';

interface ApiKeyDialogProps {
  open: boolean;
  onSave: (key: string) => void;
  onClose?: () => void;
  initialKey?: string;
}

export function ApiKeyDialog({ open, onSave, onClose, initialKey = '' }: ApiKeyDialogProps) {
  const [value, setValue] = useState(initialKey);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose?.();
      }}
    >
      <DialogContent hideClose={!onClose} className="gap-6 p-8 text-white sm:max-w-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-3xl">
            <KeyRound className="size-8" />
            Conectá tu cuenta de fal.ai
          </DialogTitle>
          <DialogDescription className="text-lg leading-relaxed text-white/80">
            Pegá tu API key de fal.ai. Se guarda solo en tu navegador y nunca sale
            de tu equipo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="api-key" className="text-xl">
            API key
          </Label>
          <Input
            id="api-key"
            type="password"
            autoComplete="off"
            placeholder="fal_..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value.trim()) onSave(value.trim());
            }}
            className="h-14 px-4 py-3 text-xl"
          />
          <a
            href="https://fal.ai/dashboard/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base text-white/80 hover:text-white"
          >
            Obtené una clave en fal.ai/dashboard/keys <ExternalLink className="size-5" />
          </a>
        </div>

        <DialogFooter className="gap-3 sm:space-x-0">
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="h-14 px-6 text-xl">
              Cancelar
            </Button>
          )}
          <Button
            disabled={!value.trim()}
            onClick={() => onSave(value.trim())}
            className="h-14 px-6 text-xl"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
