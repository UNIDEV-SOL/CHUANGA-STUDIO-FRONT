import { useEffect, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatHora } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { SeletorHorario } from "@/modules/bookings/components/SeletorHorario";
import { useMinhaAreaRemarcar } from "@/modules/bookings/hooks/useBookingsApi";
import { useAdminRemarcar } from "@/modules/bookings/hooks/useBookingsApi";
import type { Marcacao } from "@/modules/bookings/models";

/** Nova data/hora para uma marcação: a cliente (na sua área) ou o estúdio (no painel). */
export function RemarcarDialog({
  marcacao,
  open,
  onOpenChange,
  modo,
}: {
  marcacao: Marcacao | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  modo: "cliente" | "admin";
}) {
  const remarcarCliente = useMinhaAreaRemarcar();
  const remarcarAdmin = useAdminRemarcar();
  const mutation = modo === "admin" ? remarcarAdmin : remarcarCliente;

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (open && marcacao) {
      setDate(marcacao.data);
      setTime("");
    }
  }, [open, marcacao]);

  async function confirmar() {
    if (!marcacao || !time) return;
    try {
      await mutation.mutateAsync({ id: marcacao.id, data: date, hora: time });
      toast.success(modo === "admin"
        ? "Marcação remarcada. A cliente foi avisada por email."
        : "Marcação remarcada. Enviámos-lhe os novos dados por email.");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-rose-deep" /> Remarcar
          </DialogTitle>
          <DialogDescription>
            {marcacao && <>Atual: {formatDate(marcacao.data)} às {formatHora(marcacao.hora)} · {marcacao.servicos.map((s) => s.nome).join(", ")}</>}
          </DialogDescription>
        </DialogHeader>
        {marcacao && (
          <SeletorHorario
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            duration={marcacao.duracaoMinutos}
            servicosIds={marcacao.servicos.map((s) => s.servicoId)}
            ignorarMarcacaoId={marcacao.id}
          />
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Voltar</Button>
          <Button className="rounded-full bg-primary" disabled={!time || mutation.isPending} onClick={confirmar}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {time ? `Mudar para ${formatDate(date)} às ${time}` : "Escolha a nova hora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
