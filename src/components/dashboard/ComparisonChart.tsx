import { useMemo } from "react";
import Plot from "react-plotly.js";
import { MunicipalityData, calculateComparisonStats, estadosInfo } from "@/data/educationalData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ComparisonChartProps {
  data: MunicipalityData[];
  selectedEstados: string[];
  regiao: string;
  indicador: string;
  indicadorLabel: string;
}

const METRIC_COLORS = {
  media: "#14b8a6",  // teal
  max: "#f97316",    // orange
  min: "#8b5cf6",    // purple
};

const METRIC_INFO = {
  media: { label: "Média", color: METRIC_COLORS.media },
  max: { label: "Máximo", color: METRIC_COLORS.max },
  min: { label: "Mínimo", color: METRIC_COLORS.min },
};

interface MetricChartProps {
  data: Array<{ label: string; value: number }>;
  metricType: "media" | "max" | "min";
  indicadorLabel: string;
  chartTitle: string;
}

function MetricChart({ data, metricType, indicadorLabel, chartTitle }: MetricChartProps) {
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-center text-muted-foreground">{chartTitle}</h4>
      <Plot
        data={[
          {
            x: sortedData.map(d => d.label),
            y: sortedData.map(d => d.value),
            type: 'bar' as const,
            marker: { 
              color: METRIC_INFO[metricType].color,
              line: { width: 0 } 
            },
            hovertemplate: '<b>%{x}</b><br>' + METRIC_INFO[metricType].label + ': %{y:.2f}<extra></extra>',
          },
        ]}
        layout={{
          autosize: true,
          height: 350,
          margin: { t: 20, r: 30, b: 100, l: 60 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { family: 'inherit', color: 'hsl(215, 20%, 65%)' },
          xaxis: {
            tickangle: -45,
            gridcolor: 'hsl(215, 20%, 20%)',
            linecolor: 'hsl(215, 20%, 30%)',
            tickfont: { size: 10 },
          },
          yaxis: {
            title: { text: indicadorLabel, font: { size: 11 } },
            gridcolor: 'hsl(215, 20%, 20%)',
            linecolor: 'hsl(215, 20%, 30%)',
            tickfont: { size: 10 },
            rangemode: 'tozero',
          },
        }}
        config={{
          displayModeBar: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
          displaylogo: false,
          responsive: true,
          toImageButtonOptions: {
            format: 'png',
            filename: `comparacao_${metricType}_educacional`,
            height: 600,
            width: 1200,
            scale: 2,
          },
        }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </div>
  );
}

export function ComparisonChart({ 
  data, 
  selectedEstados,
  regiao,
  indicador, 
  indicadorLabel 
}: ComparisonChartProps) {
  const chartData = useMemo(() => {
    let groupBy: 'estado' | 'regiao' = 'regiao';
    let filteredData = data;

    if (selectedEstados.length > 0) {
      groupBy = 'estado';
      filteredData = data.filter(d => selectedEstados.includes(d.sgUf));
    } else if (regiao !== 'Todas') {
      groupBy = 'estado';
      filteredData = data.filter(d => d.regiao === regiao);
    }

    return calculateComparisonStats(filteredData, indicador, groupBy);
  }, [data, selectedEstados, regiao, indicador]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[450px] text-muted-foreground">
        <p className="text-lg font-medium mb-2">Sem dados disponíveis</p>
        <p className="text-sm">Ajuste os filtros para visualizar a comparação</p>
      </div>
    );
  }

  // Get labels with state names if showing states
  const getLabel = (label: string) => {
    if (estadosInfo[label]) {
      return `${estadosInfo[label].nome} (${label})`;
    }
    return label;
  };

  const chartTitle = selectedEstados.length > 0 
    ? `Estados Selecionados (${selectedEstados.length})`
    : regiao !== 'Todas' 
      ? `Estados da Região ${regiao}`
      : 'Regiões do Brasil';

  // Prepare data for each metric
  const mediaData = chartData.map(d => ({ label: getLabel(d.label), value: d.media }));
  const maxData = chartData.map(d => ({ label: getLabel(d.label), value: d.max }));
  const minData = chartData.map(d => ({ label: getLabel(d.label), value: d.min }));

  return (
    <div className="w-full space-y-4">
      <p className="text-sm text-muted-foreground text-center">{chartTitle}</p>
      
      <Tabs defaultValue="media" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="media" className="gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: METRIC_COLORS.media }} />
            Média
          </TabsTrigger>
          <TabsTrigger value="max" className="gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: METRIC_COLORS.max }} />
            Máximo
          </TabsTrigger>
          <TabsTrigger value="min" className="gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: METRIC_COLORS.min }} />
            Mínimo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="mt-4">
          <MetricChart 
            data={mediaData} 
            metricType="media" 
            indicadorLabel={indicadorLabel}
            chartTitle={`Média - ${indicadorLabel}`}
          />
        </TabsContent>

        <TabsContent value="max" className="mt-4">
          <MetricChart 
            data={maxData} 
            metricType="max" 
            indicadorLabel={indicadorLabel}
            chartTitle={`Valor Máximo - ${indicadorLabel}`}
          />
        </TabsContent>

        <TabsContent value="min" className="mt-4">
          <MetricChart 
            data={minData} 
            metricType="min" 
            indicadorLabel={indicadorLabel}
            chartTitle={`Valor Mínimo - ${indicadorLabel}`}
          />
          {indicador === 'tdi' && (
            <p className="text-xs text-muted-foreground text-center mt-2 italic">
              ⚠️ Para o TDI, quanto menor o valor, melhor o desempenho educacional
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
