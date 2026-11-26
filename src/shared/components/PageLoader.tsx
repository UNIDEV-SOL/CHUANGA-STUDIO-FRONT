import { Loader2 } from "lucide-react";

/** Mostrado enquanto o código de uma página ainda está a carregar. */
export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground" role="status" aria-label="A carregar">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
