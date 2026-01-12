import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import { AggregatedData, calculateTrendLine } from "@/data/educationalData";

interface TrendChartProps {
  data: Record<string, AggregatedData[]>;
  indicadorLabel: string;
  showTrendLine?: boolean;
}

const CHART_COLORS = [
  "#14b8a6",  // teal
  "#3b82f6",  // blue
  "#22c55e",  // green
  "#f97316",  // orange
  "#a855f7",  // purple
  "#ec4899",  // pink
];

export function TrendChart({ data, indicadorLabel, showTrendLine = true }: TrendChartProps) {
  const plotData = useMemo(() => {
    const entries = Object.entries(data);
    if (entries.length === 0) return [];

    const traces: Data[] = [];

    entries.forEach(([key, values], index) => {
      const color = CHART_COLORS[index % CHART_COLORS.length];
      const sortedValues = [...values].sort((a, b) => a.ano - b.ano);
      
      // Main data line
      traces.push({
        x: sortedValues.map(v => v.ano),
        y: sortedValues.map(v => Math.round(v.valor * 100) / 100),
        type: 'scatter',
        mode: 'lines+markers',
        name: key,
        line: { color, width: 2.5 },
        marker: { size: 8, color },
        hovertemplate: `<b>${key}</b><br>Ano: %{x}<br>${indicadorLabel}: %{y:.2f}<extra></extra>`,
      });

      // Trend line
      if (showTrendLine && sortedValues.length > 1) {
        const trendData = calculateTrendLine(sortedValues);
        traces.push({
          x: trendData.map(t => t.ano),
          y: trendData.map(t => Math.round(t.valor * 100) / 100),
          type: 'scatter',
          mode: 'lines',
          name: `${key} (tendência)`,
          line: { color, width: 1.5, dash: 'dash' },
          showlegend: false,
          hovertemplate: `<b>${key} (tendência)</b><br>Ano: %{x}<br>${indicadorLabel}: %{y:.2f}<extra></extra>`,
        });
      }
    });

    return traces;
  }, [data, showTrendLine, indicadorLabel]);

  if (plotData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[450px] text-muted-foreground">
        Sem dados para exibir. Ajuste os filtros para visualizar o gráfico.
      </div>
    );
  }

  return (
    <div className="w-full">
      <Plot
        data={plotData}
        layout={{
          autosize: true,
          height: 450,
          margin: { t: 40, r: 40, b: 60, l: 70 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { family: 'inherit', color: 'hsl(215, 20%, 65%)' },
          xaxis: {
            title: { text: 'Ano', font: { size: 12 } },
            gridcolor: 'hsl(215, 20%, 20%)',
            linecolor: 'hsl(215, 20%, 30%)',
            tickfont: { size: 11 },
            dtick: 2,
          },
          yaxis: {
            title: { text: indicadorLabel, font: { size: 12 } },
            gridcolor: 'hsl(215, 20%, 20%)',
            linecolor: 'hsl(215, 20%, 30%)',
            tickfont: { size: 11 },
            rangemode: 'tozero',
          },
          legend: {
            orientation: 'h',
            yanchor: 'bottom',
            y: -0.25,
            xanchor: 'center',
            x: 0.5,
            font: { size: 11 },
          },
          hovermode: 'x unified',
        }}
        config={{
          displayModeBar: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
          displaylogo: false,
          responsive: true,
          toImageButtonOptions: {
            format: 'png',
            filename: 'tendencia_educacional',
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
