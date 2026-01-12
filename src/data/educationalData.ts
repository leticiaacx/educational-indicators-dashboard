// Educational indicators data - Real CSV data parser
// Structure based on the original Python dashboard

export interface MunicipalityData {
  coMunicipio: string;
  noMunicipio: string;
  noUf: string;
  sgUf: string;
  regiao: string;
  ano: number;
  tdi: number;
  aprovacao?: number;
  reprovacao?: number;
  abandono?: number;
}

export interface AggregatedData {
  ano: number;
  valor: number;
  label: string;
}

// Region mapping
export const regiaoMap: Record<string, string> = {
  'RO': 'Norte', 'AC': 'Norte', 'AM': 'Norte', 'RR': 'Norte', 'PA': 'Norte', 'AP': 'Norte', 'TO': 'Norte',
  'MA': 'Nordeste', 'PI': 'Nordeste', 'CE': 'Nordeste', 'RN': 'Nordeste', 'PB': 'Nordeste', 'PE': 'Nordeste',
  'AL': 'Nordeste', 'SE': 'Nordeste', 'BA': 'Nordeste',
  'MG': 'Sudeste', 'ES': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
  'PR': 'Sul', 'SC': 'Sul', 'RS': 'Sul',
  'MS': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'DF': 'Centro-Oeste'
};

export const estadosInfo: Record<string, { nome: string; regiao: string }> = {
  'AC': { nome: 'Acre', regiao: 'Norte' },
  'AL': { nome: 'Alagoas', regiao: 'Nordeste' },
  'AP': { nome: 'Amapá', regiao: 'Norte' },
  'AM': { nome: 'Amazonas', regiao: 'Norte' },
  'BA': { nome: 'Bahia', regiao: 'Nordeste' },
  'CE': { nome: 'Ceará', regiao: 'Nordeste' },
  'DF': { nome: 'Distrito Federal', regiao: 'Centro-Oeste' },
  'ES': { nome: 'Espírito Santo', regiao: 'Sudeste' },
  'GO': { nome: 'Goiás', regiao: 'Centro-Oeste' },
  'MA': { nome: 'Maranhão', regiao: 'Nordeste' },
  'MT': { nome: 'Mato Grosso', regiao: 'Centro-Oeste' },
  'MS': { nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste' },
  'MG': { nome: 'Minas Gerais', regiao: 'Sudeste' },
  'PA': { nome: 'Pará', regiao: 'Norte' },
  'PB': { nome: 'Paraíba', regiao: 'Nordeste' },
  'PR': { nome: 'Paraná', regiao: 'Sul' },
  'PE': { nome: 'Pernambuco', regiao: 'Nordeste' },
  'PI': { nome: 'Piauí', regiao: 'Nordeste' },
  'RJ': { nome: 'Rio de Janeiro', regiao: 'Sudeste' },
  'RN': { nome: 'Rio Grande do Norte', regiao: 'Nordeste' },
  'RS': { nome: 'Rio Grande do Sul', regiao: 'Sul' },
  'RO': { nome: 'Rondônia', regiao: 'Norte' },
  'RR': { nome: 'Roraima', regiao: 'Norte' },
  'SC': { nome: 'Santa Catarina', regiao: 'Sul' },
  'SP': { nome: 'São Paulo', regiao: 'Sudeste' },
  'SE': { nome: 'Sergipe', regiao: 'Nordeste' },
  'TO': { nome: 'Tocantins', regiao: 'Norte' },
};

export const regioes = ['Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste'];
export const estados = Object.keys(estadosInfo).sort();

export const indicadores = [
  { value: 'tdi', label: 'TDI - Taxa de Distorção Idade-Série' },
  { value: 'aprovacao', label: 'Taxa de Aprovação' },
  { value: 'reprovacao', label: 'Taxa de Reprovação' },
  { value: 'abandono', label: 'Taxa de Abandono' },
];

// Anos disponíveis por indicador
export const anosDisponiveis: Record<string, { inicio: number; fim: number }> = {
  tdi: { inicio: 2006, fim: 2024 },
  aprovacao: { inicio: 2007, fim: 2023 },
  reprovacao: { inicio: 2007, fim: 2023 },
  abandono: { inicio: 2007, fim: 2023 },
};

// Indicator descriptions
export const indicadorDescricoes: Record<string, string> = {
  tdi: 'A Taxa de Distorção Idade-Série (TDI) mede o percentual de alunos que têm idade superior à recomendada para a série que estão cursando. Uma TDI alta indica que muitos estudantes estão atrasados em relação à idade ideal, geralmente devido a reprovações ou entrada tardia no sistema escolar. Dados disponíveis: 2006-2024.',
  aprovacao: 'A Taxa de Aprovação representa o percentual de alunos aprovados ao final do ano letivo em relação ao total de matrículas. Indica o sucesso dos estudantes em cumprir os requisitos mínimos para avançar à série seguinte. Dados disponíveis: 2007-2023.',
  reprovacao: 'A Taxa de Reprovação representa o percentual de alunos reprovados ao final do ano letivo. Reflete a proporção de estudantes que não atingiram os objetivos de aprendizagem ou frequência mínima exigida para aprovação. Dados disponíveis: 2007-2023.',
  abandono: 'A Taxa de Abandono representa o percentual de alunos que deixaram de frequentar a escola durante o ano letivo sem formalizar transferência. O abandono escolar está associado a fatores socioeconômicos, trabalho infantil e falta de motivação. Dados disponíveis: 2007-2023.'
};

// Parse CSV data
let educationalDataCache: MunicipalityData[] | null = null;

function parseNumber(value: string): number {
  if (!value || value.trim() === '') return NaN;
  // Handle Brazilian number format: "32,600" -> 32.6
  const cleaned = value.trim().replace(',', '.');
  return parseFloat(cleaned);
}

export async function loadEducationalData(): Promise<MunicipalityData[]> {
  if (educationalDataCache) return educationalDataCache;

  try {
    // Load metadata (names, states) from TDI file
    const responseTdi = await fetch('/data/municipios_tdi.csv');
    const csvTextTdi = await responseTdi.text();
    const linesTdi = csvTextTdi.split('\n').filter(line => line.trim());

    // Load all indicators from the main file
    const responseInd = await fetch('/data/municipios_indicadores.csv');
    const csvTextInd = await responseInd.text();
    const linesInd = csvTextInd.split('\n').filter(line => line.trim());

    if (linesTdi.length === 0 || linesInd.length === 0) return [];

    // Parse metadata mapping: CO_MUNICIPIO -> { noMunicipio, noUf, sgUf, regiao }
    const metadataMap = new Map<string, { noMunicipio: string; noUf: string; sgUf: string; regiao: string }>();

    for (let i = 1; i < linesTdi.length; i++) {
      const line = linesTdi[i];
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);

      if (values.length < 4) continue;
      const coMunicipio = values[0]?.trim() || '';
      const noUf = values[1]?.trim() || '';
      const sgUf = values[2]?.trim() || '';
      const noMunicipio = values[3]?.trim() || '';
      const regiao = regiaoMap[sgUf] || '';

      if (coMunicipio && sgUf && regiao) {
        metadataMap.set(coMunicipio, { noMunicipio, noUf, sgUf, regiao });
      }
    }

    // Parse indicators
    const headers = linesInd[0].split(';');
    const data: MunicipalityData[] = [];

    // Helper to find column indices for a specific prefix and regex
    const findColumns = (prefixRegex: RegExp) => {
      const columns: { index: number; year: number }[] = [];
      headers.forEach((header, index) => {
        const match = header.match(prefixRegex);
        if (match && !header.includes('_AI') && !header.includes('_AF')) {
          columns.push({ index, year: parseInt(match[1]) });
        }
      });
      return columns;
    };

    const tdiColumns = findColumns(/TDI_FUN\s+(\d{4})/);
    const aprovColumns = findColumns(/APROV_CAT_FUN\s+(\d{4})/);
    const reprovColumns = findColumns(/REPRO_CAT_FUN\s+(\d{4})/);
    const abandColumns = findColumns(/ABAND_CAT_FUN\s+(\d{4})/);

    // Get all unique years
    const allYears = new Set<number>();
    [...tdiColumns, ...aprovColumns, ...reprovColumns, ...abandColumns].forEach(c => allYears.add(c.year));
    const sortedYears = Array.from(allYears).sort((a, b) => a - b);

    // Parse each municipality row in indicators file
    for (let i = 1; i < linesInd.length; i++) {
      const line = linesInd[i];
      const values = line.split(';');

      if (values.length < 1) continue;

      const coMunicipio = values[0]?.trim();
      if (!coMunicipio) continue;

      const metadata = metadataMap.get(coMunicipio);
      if (!metadata) continue;

      // Create entries for each year
      for (const year of sortedYears) {

        const getValue = (columns: { index: number; year: number }[]) => {
          const col = columns.find(c => c.year === year);
          if (!col) return NaN;
          return parseNumber(values[col.index] || '');
        };

        const tdi = getValue(tdiColumns);
        const aprovacao = getValue(aprovColumns);
        const reprovacao = getValue(reprovColumns);
        const abandono = getValue(abandColumns);

        // Only add if we have at least one valid indicator (usually TDI is the base)
        if (!isNaN(tdi) || !isNaN(aprovacao)) {
          data.push({
            coMunicipio,
            noMunicipio: metadata.noMunicipio,
            noUf: metadata.noUf,
            sgUf: metadata.sgUf,
            regiao: metadata.regiao,
            ano: year,
            tdi: isNaN(tdi) ? 0 : tdi, // Default to 0 if missing but others present, or handle downstream
            aprovacao: isNaN(aprovacao) ? undefined : aprovacao,
            reprovacao: isNaN(reprovacao) ? undefined : reprovacao,
            abandono: isNaN(abandono) ? undefined : abandono
          });
        }
      }
    }

    educationalDataCache = data;
    console.log(`Loaded ${data.length} records from CSVs`);
    return data;
  } catch (error) {
    console.error('Error loading CSV:', error);
    return [];
  }
}

// Synchronous access for components that already loaded data
export let educationalData: MunicipalityData[] = [];

// Initialize data loading
loadEducationalData().then(data => {
  educationalData = data;
});

// Helper functions
export function getYearRange(): { min: number; max: number } {
  return { min: 2006, max: 2024 };
}

export function filterData(
  data: MunicipalityData[],
  regiao: string | null,
  estados: string[],
  anoInicio: number,
  anoFim: number
): MunicipalityData[] {
  return data.filter(d => {
    const inYearRange = d.ano >= anoInicio && d.ano <= anoFim;

    if (estados.length > 0) {
      return inYearRange && estados.includes(d.sgUf);
    }

    if (regiao && regiao !== 'Todas') {
      return inYearRange && d.regiao === regiao;
    }

    return inYearRange;
  });
}

export function getIndicadorValue(d: MunicipalityData, indicador: string): number {
  switch (indicador) {
    case 'tdi': return d.tdi;
    case 'aprovacao': return d.aprovacao ?? NaN;
    case 'reprovacao': return d.reprovacao ?? NaN;
    case 'abandono': return d.abandono ?? NaN;
    default: return d.tdi;
  }
}

export function calculateMetrics(data: MunicipalityData[], indicador: string) {
  if (data.length === 0) {
    return { count: 0, municipios: 0, media: 0, max: 0, min: 0 };
  }

  // Count unique municipalities
  const uniqueMunicipios = new Set(data.map(d => d.coMunicipio));

  // Filter out NaN and zero values for accurate calculations
  const values = data.map(d => getIndicadorValue(d, indicador)).filter(v => !isNaN(v) && v > 0);

  if (values.length === 0) {
    return { count: data.length, municipios: uniqueMunicipios.size, media: 0, max: 0, min: 0 };
  }

  return {
    count: data.length,
    municipios: uniqueMunicipios.size,
    media: values.reduce((a, b) => a + b, 0) / values.length,
    max: Math.max(...values),
    min: Math.min(...values),
  };
}

export function aggregateByYear(
  data: MunicipalityData[],
  indicador: string,
  groupBy: 'regiao' | 'estado' | 'none' = 'none'
): Record<string, AggregatedData[]> {
  const groups: Record<string, Map<number, number[]>> = {};

  for (const d of data) {
    let key: string;
    if (groupBy === 'regiao') {
      key = d.regiao;
    } else if (groupBy === 'estado') {
      key = d.sgUf;
    } else {
      key = 'Brasil';
    }

    if (!groups[key]) {
      groups[key] = new Map();
    }

    const value = getIndicadorValue(d, indicador);

    if (!isNaN(value)) {
      const yearValues = groups[key].get(d.ano) || [];
      yearValues.push(value);
      groups[key].set(d.ano, yearValues);
    }
  }

  const result: Record<string, AggregatedData[]> = {};

  for (const [key, yearMap] of Object.entries(groups)) {
    result[key] = Array.from(yearMap.entries())
      .map(([ano, values]) => ({
        ano,
        valor: values.reduce((a, b) => a + b, 0) / values.length,
        label: key,
      }))
      .sort((a, b) => a.ano - b.ano);
  }

  return result;
}

// Calculate min/max/avg for comparison chart
export function calculateComparisonStats(
  data: MunicipalityData[],
  indicador: string,
  groupBy: 'regiao' | 'estado'
): Array<{ label: string; media: number; max: number; min: number }> {
  const groups: Record<string, number[]> = {};

  for (const d of data) {
    const key = groupBy === 'regiao' ? d.regiao : d.sgUf;

    if (!groups[key]) {
      groups[key] = [];
    }

    const value = getIndicadorValue(d, indicador);

    if (!isNaN(value)) {
      groups[key].push(value);
    }
  }

  return Object.entries(groups).map(([label, values]) => {
    // Filter out zero and NaN values for min calculation
    const validValues = values.filter(v => !isNaN(v) && v > 0);

    return {
      label,
      media: validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0,
      max: validValues.length > 0 ? Math.max(...validValues) : 0,
      min: validValues.length > 0 ? Math.min(...validValues) : 0,
    };
  }).sort((a, b) => a.label.localeCompare(b.label));
}

// Linear regression for trend line (equivalent to numpy's polyfit/poly1d)
export function calculateTrendLine(data: AggregatedData[]): AggregatedData[] {
  if (data.length < 2) return [];

  const n = data.length;
  const xValues = data.map(d => d.ano);
  const yValues = data.map(d => d.valor);

  // Calculate means
  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  // Calculate slope (m) and intercept (b) for y = mx + b
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Generate trend line points
  return data.map(d => ({
    ano: d.ano,
    valor: slope * d.ano + intercept,
    label: `${d.label} (tendência)`,
  }));
}

// Calculate coefficient (slope per year) for display
export function calculateTrendCoefficient(data: AggregatedData[]): number {
  if (data.length < 2) return 0;

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

  return denominator !== 0 ? numerator / denominator : 0;
}
