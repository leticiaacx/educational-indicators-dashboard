import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { indicadores, regioes, estadosInfo } from "@/data/educationalData";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  indicador: string;
  onIndicadorChange: (value: string) => void;
  regiao: string;
  onRegiaoChange: (value: string) => void;
  yearRange: [number, number];
  onYearRangeChange: (value: [number, number]) => void;
  minYear: number;
  maxYear: number;
  selectedEstados: string[];
  onEstadosChange: (estados: string[]) => void;
}

export function FilterPanel({
  indicador,
  onIndicadorChange,
  regiao,
  onRegiaoChange,
  yearRange,
  onYearRangeChange,
  minYear,
  maxYear,
  selectedEstados,
  onEstadosChange,
}: FilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleEstadoToggle = (estado: string) => {
    if (selectedEstados.includes(estado)) {
      onEstadosChange(selectedEstados.filter(e => e !== estado));
    } else {
      onEstadosChange([...selectedEstados, estado]);
    }
  };

  const estadosList = Object.entries(estadosInfo)
    .filter(([sigla, info]) => {
      const term = searchTerm.toLowerCase();
      return sigla.toLowerCase().includes(term) || info.nome.toLowerCase().includes(term);
    })
    .sort((a, b) => a[1].nome.localeCompare(b[1].nome));

  return (
    <div className="space-y-6 p-4">
      {/* Indicator Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-sidebar-foreground">
          Indicador
        </Label>
        <Select value={indicador} onValueChange={onIndicadorChange}>
          <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-border">
            <SelectValue placeholder="Selecione o indicador" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {indicadores.map(ind => (
              <SelectItem key={ind.value} value={ind.value}>
                {ind.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year Range Slider */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-sidebar-foreground">
          Período: {yearRange[0]} - {yearRange[1]}
        </Label>
        <Slider
          value={yearRange}
          onValueChange={(value) => onYearRangeChange(value as [number, number])}
          min={minYear}
          max={maxYear}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
      </div>

      {/* Region Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-sidebar-foreground">
          Região
        </Label>
        <Select 
          value={regiao} 
          onValueChange={(value) => {
            onRegiaoChange(value);
            if (value !== 'Todas') {
              onEstadosChange([]);
            }
          }}
          disabled={selectedEstados.length > 0}
        >
          <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-border">
            <SelectValue placeholder="Selecione a região" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="Todas">Todas as Regiões</SelectItem>
            {regioes.map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedEstados.length > 0 && (
          <p className="text-xs text-muted-foreground italic">
            Região desabilitada quando estados estão selecionados
          </p>
        )}
      </div>

      {/* State Checkboxes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-sidebar-foreground">
            Comparar Estados
          </Label>
          <span className="text-xs text-muted-foreground">
            {selectedEstados.length} selecionados
          </span>
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-sidebar-accent border-sidebar-border h-9"
          />
        </div>
        <ScrollArea className="h-48 rounded-md border border-sidebar-border bg-sidebar-accent p-2">
          <div className="space-y-1">
            {estadosList.map(([sigla, info]) => {
              const isSelected = selectedEstados.includes(sigla);
              
              return (
                <div
                  key={sigla}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer",
                    isSelected && "bg-primary/10",
                    !isSelected && "hover:bg-sidebar-accent-foreground/5"
                  )}
                  onClick={() => handleEstadoToggle(sigla)}
                >
                  <Checkbox
                    id={`estado-${sigla}`}
                    checked={isSelected}
                    onCheckedChange={() => handleEstadoToggle(sigla)}
                    className="pointer-events-none"
                  />
                  <label
                    htmlFor={`estado-${sigla}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <span className="font-medium">{sigla}</span>
                    <span className="text-muted-foreground ml-1">- {info.nome}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {selectedEstados.length > 0 && (
          <button
            onClick={() => onEstadosChange([])}
            className="text-xs text-primary hover:underline"
          >
            Limpar seleção
          </button>
        )}
      </div>
    </div>
  );
}