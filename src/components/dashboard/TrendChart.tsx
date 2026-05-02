import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import { AggregatedData, calculateTrendLine } from "@/data/educationalData";

interface TrendChartProps {
  data: Record<string, AggregatedData[]>;
  indicadorLabel: string;
  showTrendLine?: boolean;
}

// 12 visually distinct colors – avoids same-hue collisions for Norte/Sudeste
const CHART_COLORS = [
  "#14b8a6",  // teal
  "#3b82f6",  // blue
  "#f97316",  // orange
  "#a855f7",  // purple
  "#22c55e",  // green
  "#ec4899",  // pink
  "#eab308",  // yellow
  "#06b6d4",  // cyan
  "#ef4444",  // red
  "#84cc16",  // lime
  "#f43f5e",  // rose
  "#8b5cf6",  // violet
];

/** Calculate R² (coefficient of determination) */
function calculateR2(data: AggregatedData[]): number {
  if (data.length < 2) return NaN;

  const n = data.length;
  const xValues = data.map(d => d.ano);
  const yValues = data.map(d => d.valor);

  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (yValues[i] - (slope * xValues[i] + intercept)) ** 2;
    ssTot += (yValues[i] - yMean) ** 2;
  }

  return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
}

function r2Quality(r2: number): { label: string; color: string } {
  if (r2 >= 0.9) return { label: "Excelente", color: "#22c55e" };
  if (r2 >= 0.7) return { label: "Bom", color: "#84cc16" };
  if (r2 >= 0.5) return { label: "Moderado", color: "#eab308" };
  return { label: "Fraco", color: "#ef4444" };
}

export function TrendChart({ data, indicadorLabel, showTrendLine = true }: TrendChartProps) {
  const { plotData, r2Values } = useMemo(() => {
    const entries = Object.entries(data);
    if (entries.length === 0) return { plotData: [], r2Values: [] };

    const traces: Data[] = [];
    const r2List: { key: string; color: string; r2: number }[] = [];

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
        hovertemplate: `<b>${key}</b><br>Ano: %{x}<br>${indicadorLabel}: %{y:.2f}                        <extra></extra>`,
      });                             

      // Trend line – skip in unified hover so the tooltip doesn't overflow
      if (showTrendLine && sortedValues.length > 1) {
        const trendPoints = calculateTrendLine(sortedValues);
        const r2 = calculateR2(sortedValues);

        traces.push({
          x: trendPoints.map(t => t.ano),
          y: trendPoints.map(t => Math.round(t.valor * 100) / 100),
          type: 'scatter',
          mode: 'lines',
          name: `${key} (tendência)`,
          line: { color, width: 1.5, dash: 'dash' },
          showlegend: false,
          hovertemplate: `<b>${key} (tendência)</b><br>Ano: %{x}<br>Tendência: %{y:.2f}                            <extra></extra>`,
        } as Data);

        if (!isNaN(r2)) {
          r2List.push({ key, color, r2 });
        }
      }
    });

    return { plotData: traces, r2Values: r2List };
  }, [data, showTrendLine, indicadorLabel]);

  if (plotData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[450px] text-muted-foreground">
        Sem dados para exibir. Ajuste os filtros para visualizar o gráfico.
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Plot
        data={plotData}
        layout={{
          autosize: true,
          height: 550,
          margin: { t: 60, r: 40, b: 80, l: 70 },
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
            y: -0.3,
            xanchor: 'center',
            x: 0.5,
            font: { size: 11 },
          },
          hovermode: 'x unified',

          hoverlabel: {
            namelength: -1,
            bgcolor: 'hsl(222, 47%, 11%)',
            bordercolor: 'hsl(215, 20%, 40%)',
            font: { size: 13 },
            align: 'left',
          },
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

      {/* R² legend panel – shown only when trend lines are active */}
      {showTrendLine && r2Values.length > 0 && (
        <div className="border border-border rounded-lg bg-muted/20 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Coeficiente de Determinação (R²) — Qualidade do ajuste linear
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {r2Values.map(({ key, color, r2 }) => {
              const q = r2Quality(r2);
              // bar width based on r2
              const barPct = Math.round(r2 * 100);
              return (
                <div
                  key={key}
                  className="flex flex-col gap-1 p-2 rounded-md bg-background/40 border border-border/40"
                >
                  {/* Series color + name */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium truncate" title={key}>{key}</span>
                  </div>
                  {/* R² value */}
                  <span className="text-sm font-bold tabular-nums" style={{ color }}>
                    R² = {r2.toFixed(3)}
                  </span>
                  {/* Mini bar */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barPct}%`, backgroundColor: q.color }}
                    />
                  </div>
                  {/* Quality label */}
                  <span className="text-[10px]" style={{ color: q.color }}>
                    {q.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-background/60 rounded border border-border/40 text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
              O que é o R²?
            </p>
            <p>
              O <strong>Coeficiente de Determinação (R²)</strong> mede a precisão do ajuste da linha de tendência (reta tracejada) aos dados reais.
              Ele varia de 0 a 1: quanto mais próximo de <strong>1.000</strong>, mais consistente e previsível é a tendência de aumento ou queda ao longo dos anos.
              Um valor baixo (próximo de 0) indica que os dados variam muito e não seguem uma trajetória linear clara.
              O cálculo considera <strong>todo o período exibido</strong> no gráfico para cada série.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
