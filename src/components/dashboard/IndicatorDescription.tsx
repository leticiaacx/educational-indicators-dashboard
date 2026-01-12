import { Info } from "lucide-react";
import { indicadorDescricoes } from "@/data/educationalData";

interface IndicatorDescriptionProps {
  indicador: string;
}

export function IndicatorDescription({ indicador }: IndicatorDescriptionProps) {
  const descricao = indicadorDescricoes[indicador];
  
  if (!descricao) return null;

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 flex gap-3">
      <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground leading-relaxed">
        {descricao}
      </p>
    </div>
  );
}
