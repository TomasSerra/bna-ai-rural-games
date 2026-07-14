import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@shared/components/ui/alert";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";

type MediaType = "image" | "video";
type Status = "idle" | "sending" | "success" | "error";

interface EmailSendDialogProps {
  mediaType: MediaType;
  mediaUrl: string;
}

function getSuccessMessage(mediaType: MediaType, email: string) {
  return mediaType === "image"
    ? `La imagen fue enviada con éxito a ${email}.`
    : `El video fue enviado con éxito a ${email}.`;
}

function getDescription(mediaType: MediaType) {
  return mediaType === "image"
    ? "Ingresá el email para recibir tu imagen generada."
    : "Ingresá el email para recibir tu video generado.";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function EmailSendDialog({ mediaType, mediaUrl }: EmailSendDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const resetFeedback = () => {
    setStatus("idle");
    setMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setEmail("");
    resetFeedback();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setStatus("error");
      setMessage("Ingresá un email válido.");
      return;
    }

    setStatus("sending");
    setMessage(null);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          mediaType,
          mediaUrl,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "No pudimos enviar el email.");
      }

      setStatus("success");
      setMessage(getSuccessMessage(mediaType, trimmedEmail));
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "No pudimos enviar el email.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 h-14 w-full rounded-full border-2 border-[#356B22] bg-gradient-to-b from-[#6FB23E] to-[#3E7D29] text-xl text-white shadow-xl hover:from-[#7cc049] hover:to-[#46892f] [&_svg]:size-6"
      >
        <Mail />
        Enviar por email
      </Button>

      <DialogContent className="max-w-xl rounded-2xl border-0 bg-card text-card-foreground shadow-2xl">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="font-kievit-black text-3xl tracking-wide text-primary">
              Enviar por email
            </DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground">
              {getDescription(mediaType)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label
              htmlFor={`email-${mediaType}`}
              className="text-base text-card-foreground"
            >
              Email
            </Label>
            <Input
              id={`email-${mediaType}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status !== "sending") resetFeedback();
              }}
              placeholder="nombre@email.com"
              disabled={status === "sending"}
              className="h-14 rounded-xl border border-input bg-white text-xl text-black placeholder:text-muted-foreground"
            />
          </div>

          {message && (
            <Alert
              variant={status === "error" ? "destructive" : "default"}
              className={
                status === "success"
                  ? "border-[#6FB23E] bg-[#EAF6E5] text-[#356B22] [&>svg]:text-[#356B22]"
                  : ""
              }
            >
              {status === "success" && <CheckCircle2 />}
              <AlertTitle>
                {status === "success" ? "Listo" : "No pudimos enviar"}
              </AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-3 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-12 rounded-full border-2 border-gray-300 bg-white px-8 text-lg text-black shadow-md hover:bg-gray-50"
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              disabled={status === "sending" || !isValidEmail(email.trim())}
              className="h-12 rounded-full border-2 border-[#356B22] bg-gradient-to-b from-[#6FB23E] to-[#3E7D29] px-8 text-lg text-white shadow-md hover:from-[#7cc049] hover:to-[#46892f]"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
