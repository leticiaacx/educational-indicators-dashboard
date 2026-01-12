// URL base da API - configure com sua URL de produção
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface IndicadorInfo {
  id: string;
  nome: string;
  descricao: string;
  unidade: string;
  anos_disponiveis: {
    inicio: number;
    fim: number;
  };
}

export interface MetricasResponse {
  total_registros: number;
  total_municipios: number;
  media: number | null;
  maximo: number | null;
  minimo: number | null;
  desvio_padrao?: number;
  indicador: string;
  info: {
    nome: string;
    descricao: string;
    unidade: string;
  };
}

export interface TendenciaData {
  ano: number;
  valor: number;
}

export interface TendenciaInfo {
  coeficiente: number;
  intercepto: number;
  r2: number;
  rmse: number;
  direcao: 'crescente' | 'decrescente';
  linha_tendencia: TendenciaData[];
}

export interface TendenciaResponse {
  dados: Record<string, TendenciaData[]>;
  tendencias: Record<string, TendenciaInfo>;
  indicador: string;
  info: {
    nome: string;
    descricao: string;
  };
}

export interface ComparacaoItem {
  grupo: string;
  nome: string;
  media: number;
  maximo: number;
  minimo: number;
  total_registros: number;
  total_municipios: number;
}

export interface ComparacaoResponse {
  dados: ComparacaoItem[];
  indicador: string;
  info: {
    nome: string;
    descricao: string;
  };
}

export interface EstadoInfo {
  sigla: string;
  nome: string;
  regiao: string;
}

export interface FilterParams {
  indicador?: string;
  regiao?: string;
  estados?: string[];
  ano_inicio?: number;
  ano_fim?: number;
  agrupar_por?: 'none' | 'estado' | 'regiao';
}

// Funções auxiliares
function buildQueryString(params: FilterParams): string {
  const query = new URLSearchParams();
  
  if (params.indicador) query.append('indicador', params.indicador);
  if (params.regiao) query.append('regiao', params.regiao);
  if (params.estados?.length) query.append('estados', params.estados.join(','));
  if (params.ano_inicio) query.append('ano_inicio', params.ano_inicio.toString());
  if (params.ano_fim) query.append('ano_fim', params.ano_fim.toString());
  if (params.agrupar_por) query.append('agrupar_por', params.agrupar_por);
  
  return query.toString();
}

async function fetchApi<T>(endpoint: string, params?: FilterParams): Promise<T> {
  const query = params ? `?${buildQueryString(params)}` : '';
  const response = await fetch(`${API_BASE_URL}${endpoint}${query}`);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// API Functions
export async function fetchIndicadores(): Promise<{ indicadores: IndicadorInfo[] }> {
  return fetchApi('/api/indicadores');
}

export async function fetchAnos(indicador?: string): Promise<Record<string, { inicio: number; fim: number }>> {
  const endpoint = indicador ? `/api/anos?indicador=${indicador}` : '/api/anos';
  return fetchApi(endpoint);
}

export async function fetchRegioes(): Promise<{ regioes: string[] }> {
  return fetchApi('/api/regioes');
}

export async function fetchEstados(regiao?: string): Promise<{ estados: EstadoInfo[] }> {
  const endpoint = regiao ? `/api/estados?regiao=${regiao}` : '/api/estados';
  return fetchApi(endpoint);
}

export async function fetchMetricas(params: FilterParams): Promise<MetricasResponse> {
  return fetchApi('/api/metricas', params);
}

export async function fetchTendencia(params: FilterParams): Promise<TendenciaResponse> {
  return fetchApi('/api/tendencia', {
    ...params,
    agrupar_por: params.agrupar_por || (params.estados?.length ? 'estado' : 'none')
  });
}

export async function fetchComparacao(params: FilterParams): Promise<ComparacaoResponse> {
  return fetchApi('/api/comparacao', params);
}

// Hook helper para verificar se a API está disponível
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.ok;
  } catch {
    return false;
  }
}

// Exportar URL base para debug
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
