import { useMemo, memo } from "react";
import { ComposableMap, Geographies, Geography, Marker, Annotation } from "react-simple-maps";
import { MunicipalityData, estadosInfo, getIndicadorValue } from "@/data/educationalData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";

const BRAZIL_TOPOJSON_URL = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

const stateNameToAbbr: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA",
  "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
  "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
  "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
  "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS",
  "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP",
  "Sergipe": "SE", "Tocantins": "TO",
};

// Center coordinates for state labels
const stateCoordinates: Record<string, [number, number]> = {
  "AC": [-70.5, -9.0], "AL": [-36.6, -9.5], "AP": [-51.0, 1.5], "AM": [-64.5, -4.5],
  "BA": [-41.5, -12.5], "CE": [-39.5, -5.2], "DF": [-47.9, -15.8], "ES": [-40.3, -19.5],
  "GO": [-49.5, -16.0], "MA": [-45.0, -5.0], "MT": [-55.5, -13.0], "MS": [-55.0, -20.5],
  "MG": [-44.5, -18.5], "PA": [-52.5, -4.5], "PB": [-36.8, -7.1], "PR": [-51.5, -24.5],
  "PE": [-37.5, -8.3], "PI": [-42.8, -7.5], "RJ": [-42.5, -22.2], "RN": [-36.5, -5.8],
  "RS": [-53.0, -29.5], "RO": [-63.0, -11.0], "RR": [-61.0, 2.5], "SC": [-50.0, -27.2],
  "SP": [-48.5, -22.0], "SE": [-37.4, -10.6], "TO": [-48.3, -10.0],
};

interface BrazilMapProps {
  data: MunicipalityData[];
  indicador: string;
  indicadorLabel: string;
  selectedEstados: string[];
  regiao: string;
  anoInicio: number;
  anoFim: number;
}

// Escala divergente: Azul (bom) → Branco (neutro) → Vermelho (ruim)
function getDivergentColorScale(value: number, min: number, max: number, indicador: string): string {
  if (isNaN(value) || value === 0) return "hsl(215, 20%, 30%)";
  
  const range = max - min;
  if (range === 0) return "hsl(210, 70%, 50%)";
  
  let normalized = (value - min) / range;
  
  const isHighBad = ['tdi', 'reprovacao', 'abandono'].includes(indicador);
  if (!isHighBad) {
    normalized = 1 - normalized;
  }
  
  if (normalized <= 0.5) {
    // Blue range: from dark blue (very good) to light blue/white
    const t = normalized * 2;
    const saturation = 80 - t * 50;
    const lightness = 35 + t * 45;
    return `hsl(210, ${saturation}%, ${lightness}%)`;
  } else {
    // Red range: from white/pink to dark red (very bad)
    const t = (normalized - 0.5) * 2;
    const saturation = 30 + t * 50;
    const lightness = 80 - t * 45;
    return `hsl(0, ${saturation}%, ${lightness}%)`;
  }
}

interface StateEvolution {
  uf: string;
  valorInicio: number;
  valorFim: number;
  variacao: number;
  melhorou: boolean;
}

interface SingleMapProps {
  data: MunicipalityData[];
  indicador: string;
  ano: number;
  selectedEstados: string[];
  regiao: string;
  minValue: number;
  maxValue: number;
  title: string;
}

function SingleMap({ data, indicador, ano, selectedEstados, regiao, minValue, maxValue, title }: SingleMapProps) {
  const stateStats = useMemo(() => {
    const yearData = data.filter(d => d.ano === ano);
    let filteredData = yearData;

    if (selectedEstados.length > 0) {
      filteredData = yearData.filter(d => selectedEstados.includes(d.sgUf));
    } else if (regiao !== 'Todas') {
      filteredData = yearData.filter(d => d.regiao === regiao);
    }

    const statsMap: Record<string, number> = {};
    const stateGroups: Record<string, number[]> = {};

    filteredData.forEach(d => {
      const val = getIndicadorValue(d, indicador);
      if (val && val > 0) {
        if (!stateGroups[d.sgUf]) stateGroups[d.sgUf] = [];
        stateGroups[d.sgUf].push(val);
      }
    });

    Object.entries(stateGroups).forEach(([uf, values]) => {
      statsMap[uf] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return statsMap;
  }, [data, indicador, ano, selectedEstados, regiao]);

  const getStateName = (geo: { properties: { name?: string; sigla?: string } }) =>
    geo.properties.name || geo.properties.sigla || "";

  const getStateAbbr = (geo: { properties: { name?: string; sigla?: string } }) => {
    const name = getStateName(geo);
    return stateNameToAbbr[name] || geo.properties.sigla || "";
  };

  // Get list of states to display labels for
  const visibleStates = useMemo(() => {
    if (selectedEstados.length > 0) return selectedEstados;
    if (regiao !== 'Todas') {
      return Object.entries(estadosInfo)
        .filter(([_, info]) => info.regiao === regiao)
        .map(([uf]) => uf);
    }
    return Object.keys(stateCoordinates);
  }, [selectedEstados, regiao]);

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 450, center: [-54, -15] }}
        width={400}
        height={380}
        style={{ width: "100%", maxWidth: "400px", height: "auto" }}
      >
        <Geographies geography={BRAZIL_TOPOJSON_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const stateAbbr = getStateAbbr(geo);
              const stateName = getStateName(geo);
              const value = stateStats[stateAbbr] || 0;
              const fillColor = getDivergentColorScale(value, minValue, maxValue, indicador);

              const isSelected = selectedEstados.length === 0 || selectedEstados.includes(stateAbbr);
              const isInRegion = regiao === 'Todas' || estadosInfo[stateAbbr]?.regiao === regiao;
              const shouldHighlight = isSelected && isInRegion;

              return (
                <Tooltip key={geo.rsmKey}>
                  <TooltipTrigger asChild>
                    <Geography
                      geography={geo}
                      fill={shouldHighlight ? fillColor : "hsl(215, 20%, 25%)"}
                      stroke="hsl(215, 20%, 50%)"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: shouldHighlight ? fillColor : "hsl(215, 20%, 35%)",
                          outline: "none",
                          strokeWidth: 1.5,
                          stroke: "hsl(215, 20%, 70%)"
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover border-border">
                    <p className="font-medium">{stateName} ({stateAbbr})</p>
                    {value > 0 ? (
                      <p className="text-sm">Média: <span className="font-medium">{value.toFixed(2)}%</span></p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem dados</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })
          }
        </Geographies>

        {/* State abbreviation labels */}
        {visibleStates.map((uf) => {
          const coords = stateCoordinates[uf];
          if (!coords) return null;
          const value = stateStats[uf];

          return (
            <Annotation
              key={uf}
              subject={coords}
              dx={0}
              dy={0}
              connectorProps={{}}
            >
              <text
                textAnchor="middle"
                alignmentBaseline="middle"
                fill={value ? "hsl(0, 0%, 100%)" : "hsl(215, 20%, 60%)"}
                fontSize={8}
                fontWeight="bold"
                style={{
                  textShadow: "0 0 3px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)",
                  pointerEvents: "none"
                }}
              >
                {uf}
              </text>
            </Annotation>
          );
        })}
      </ComposableMap>
    </div>
  );
}

function BrazilMapComponent({
  data, indicador, indicadorLabel, selectedEstados, regiao, anoInicio, anoFim
}: BrazilMapProps) {
  const isHighBad = ['tdi', 'reprovacao', 'abandono'].includes(indicador);

  // Calculate global min/max across both years for consistent scale
  const { minValue, maxValue } = useMemo(() => {
    const yearData = data.filter(d => d.ano === anoInicio || d.ano === anoFim);
    let filteredData = yearData;

    if (selectedEstados.length > 0) {
      filteredData = yearData.filter(d => selectedEstados.includes(d.sgUf));
    } else if (regiao !== 'Todas') {
      filteredData = yearData.filter(d => d.regiao === regiao);
    }

    const values = filteredData
      .map(d => getIndicadorValue(d, indicador))
      .filter((v): v is number => v !== null && v > 0);

    return {
      minValue: values.length > 0 ? Math.min(...values) : 0,
      maxValue: values.length > 0 ? Math.max(...values) : 100
    };
  }, [data, indicador, anoInicio, anoFim, selectedEstados, regiao]);

  // Calculate evolution between years for each state
  const stateEvolutions = useMemo(() => {
    const getStateAverage = (ano: number): Record<string, number> => {
      const yearData = data.filter(d => d.ano === ano);
      let filteredData = yearData;

      if (selectedEstados.length > 0) {
        filteredData = yearData.filter(d => selectedEstados.includes(d.sgUf));
      } else if (regiao !== 'Todas') {
        filteredData = yearData.filter(d => d.regiao === regiao);
      }

      const stateGroups: Record<string, number[]> = {};
      filteredData.forEach(d => {
        const val = getIndicadorValue(d, indicador);
        if (val && val > 0) {
          if (!stateGroups[d.sgUf]) stateGroups[d.sgUf] = [];
          stateGroups[d.sgUf].push(val);
        }
      });

      const statsMap: Record<string, number> = {};
      Object.entries(stateGroups).forEach(([uf, values]) => {
        statsMap[uf] = values.reduce((a, b) => a + b, 0) / values.length;
      });

      return statsMap;
    };

    const inicioStats = getStateAverage(anoInicio);
    const fimStats = getStateAverage(anoFim);

    const evolutions: StateEvolution[] = [];

    Object.keys(inicioStats).forEach(uf => {
      if (fimStats[uf]) {
        const valorInicio = inicioStats[uf];
        const valorFim = fimStats[uf];
        const variacao = valorFim - valorInicio;

        // For HighBad indicators: negative variation = improvement (reduction)
        // For others (Aprovacao): positive variation = improvement (increase)
        const melhorou = isHighBad ? variacao < 0 : variacao > 0;

        evolutions.push({ uf, valorInicio, valorFim, variacao, melhorou });
      }
    });

    // Sort by improvement (for HighBad: most negative first; for others: most positive first)
    evolutions.sort((a, b) => {
      if (isHighBad) {
        return a.variacao - b.variacao; // Most negative first (biggest improvement)
      }
      return b.variacao - a.variacao; // Most positive first (biggest improvement)
    });

    return evolutions;
  }, [data, indicador, anoInicio, anoFim, selectedEstados, regiao, isHighBad]);

  const top5Improved = stateEvolutions.filter(e => e.melhorou).slice(0, 5);

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        {/* Explanation */}
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-sm font-medium mb-1">{indicadorLabel} por Estado</p>
          <p className="text-xs text-muted-foreground">
            {isHighBad
              ? '🔵 Azul = Menor distorção (BOM) | 🔴 Vermelho = Maior distorção (RUIM)'
              : '🔵 Azul = Maior valor (BOM) | 🔴 Vermelho = Menor valor (RUIM)'
            }
          </p>
        </div>

        {/* Two maps side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SingleMap
            data={data}
            indicador={indicador}
            ano={anoInicio}
            selectedEstados={selectedEstados}
            regiao={regiao}
            minValue={minValue}
            maxValue={maxValue}
            title={`${indicadorLabel} - Ano ${anoInicio}`}
          />
          <SingleMap
            data={data}
            indicador={indicador}
            ano={anoFim}
            selectedEstados={selectedEstados}
            regiao={regiao}
            minValue={minValue}
            maxValue={maxValue}
            title={`${indicadorLabel} - Ano ${anoFim}`}
          />
        </div>

        {/* Color Legend */}
{/* Color Legend */}
        <div className="flex flex-col items-center gap-2 p-3 bg-muted/20 rounded-lg">
          <p className="text-xs font-medium">Legenda de Cores</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Melhor (BOM) ({isHighBad ? minValue.toFixed(1) : maxValue.toFixed(1)}%)
            </span>
            <div className="flex h-5 rounded overflow-hidden border border-border/30">
              {/* Gradient fixo: Azul (bom) → Branco (neutro) → Vermelho (ruim) */}
              {[0, 0.17, 0.33, 0.5, 0.67, 0.83, 1].map((t, i) => {
                let color: string;
                if (t <= 0.5) {
                  const s = t * 2;
                  const saturation = 80 - s * 50;
                  const lightness = 35 + s * 45;
                  color = `hsl(210, ${saturation}%, ${lightness}%)`;
                } else {
                  const s = (t - 0.5) * 2;
                  const saturation = 30 + s * 50;
                  const lightness = 80 - s * 45;
                  color = `hsl(0, ${saturation}%, ${lightness}%)`;
                }
                return (
                  <div key={i} className="w-6 h-full" style={{ backgroundColor: color }} />
                );
              })}
            </div>
            <span className="text-xs text-muted-foreground">
              Pior (RUIM) ({isHighBad? maxValue.toFixed(1) : minValue.toFixed(1)}%)
            </span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(210, 80%, 45%)' }}></span>
              Azul = BOM
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0, 70%, 45%)' }}></span>
              Vermelho = RUIM
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-muted-foreground/30"></span>
              Cinza = Sem dados
            </span>
          </div>
        </div>

        {/* Evolution Legend - Top 5 States */}
        <div className="p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <p className="text-sm font-medium">
              Top 5 Estados que Mais Evoluíram ({anoInicio} → {anoFim})
            </p>
          </div>

          {top5Improved.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {top5Improved.map((state, index) => (
                <div
                  key={state.uf}
                  className="flex flex-col items-center p-3 bg-background/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-lg font-bold text-primary">#{index + 1}</span>
                    <span className="text-lg font-semibold">{state.uf}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {state.valorInicio.toFixed(1)}% → {state.valorFim.toFixed(1)}%
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${state.melhorou ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {isHighBad ? (
                      state.variacao < 0 ? (
                        <>
                          <ArrowDown className="h-3 w-3" />
                          {Math.abs(state.variacao).toFixed(1)}pp
                        </>
                      ) : (
                        <>
                          <ArrowUp className="h-3 w-3" />
                          +{state.variacao.toFixed(1)}pp
                        </>
                      )
                    ) : (
                      state.variacao > 0 ? (
                        <>
                          <ArrowUp className="h-3 w-3" />
                          +{state.variacao.toFixed(1)}pp
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-3 w-3" />
                          {state.variacao.toFixed(1)}pp
                        </>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Sem dados suficientes para calcular evolução
            </p>
          )}

          <p className="text-xs text-muted-foreground text-center mt-3">
            {isHighBad
              ? 'Para este indicador: evolução negativa significa redução da taxa (melhora)'
              : 'Evolução medida em pontos percentuais (pp) - Aumento significa melhora'}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}

export const BrazilMap = memo(BrazilMapComponent);
