import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
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
  const [showKey, setShowKey] = useState(false);

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
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              placeholder="fal_..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && value.trim()) onSave(value.trim());
              }}
              className="h-14 px-4 py-3 pr-16 text-xl"
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              aria-label={showKey ? 'Ocultar clave' : 'Mostrar clave'}
              aria-pressed={showKey}
              className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {showKey ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
            </button>
          </div>
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
            className="h-14 bg-white px-6 text-xl text-primary hover:bg-white/90"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
