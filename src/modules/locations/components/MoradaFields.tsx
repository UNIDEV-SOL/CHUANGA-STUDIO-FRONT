import { Label } from "@/shared/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/ui/select";
import { useDistritos, useProvincias } from "@/modules/locations/hooks/useLocationsApi";
import type { Morada } from "@/modules/locations/lib/morada";

/** Província e distrito (opcionais), vindos dos classificadores da API. */
export function MoradaFields({ value, onChange }: { value: Morada; onChange: (m: Morada) => void }) {
  const provincias = useProvincias();
  const distritos = useDistritos(value.provinciaId || null);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label>Província <span className="text-muted-foreground font-normal">(opcional)</span></Label>
        <Select value={value.provinciaId} onValueChange={(v) => onChange({ provinciaId: v, distritoId: "" })}>
          <SelectTrigger className="h-11 mt-1.5" aria-label="Província"><SelectValue placeholder="Escolha a província" /></SelectTrigger>
          <SelectContent>
            {(provincias.data ?? []).map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Distrito <span className="text-muted-foreground font-normal">(opcional)</span></Label>
        <Select value={value.distritoId} onValueChange={(v) => onChange({ ...value, distritoId: v })} disabled={!value.provinciaId}>
          <SelectTrigger className="h-11 mt-1.5" aria-label="Distrito"><SelectValue placeholder={value.provinciaId ? "Escolha o distrito" : "Primeiro a província"} /></SelectTrigger>
          <SelectContent>
            {(distritos.data ?? []).map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
