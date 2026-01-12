import { useQuery } from '@tanstack/react-query';
import {
  fetchIndicadores,
  fetchAnos,
  fetchRegioes,
  fetchEstados,
  fetchMetricas,
  fetchTendencia,
  fetchComparacao,
  checkApiHealth,
  type FilterParams,
  type MetricasResponse,
  type TendenciaResponse,
  type ComparacaoResponse,
  type IndicadorInfo,
  type EstadoInfo
} from '@/services/api';

// Hook para verificar disponibilidade da API
export function useApiHealth() {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: checkApiHealth,
    staleTime: 60000, // 1 minuto
    retry: 1
  });
}

// Hook para buscar indicadores
export function useIndicadores() {
  return useQuery({
    queryKey: ['indicadores'],
    queryFn: async () => {
      const response = await fetchIndicadores();
      return response.indicadores;
    },
    staleTime: Infinity // Não muda
  });
}

// Hook para buscar anos disponíveis
export function useAnos(indicador?: string) {
  return useQuery({
    queryKey: ['anos', indicador],
    queryFn: () => fetchAnos(indicador),
    staleTime: Infinity
  });
}

// Hook para buscar regiões
export function useRegioes() {
  return useQuery({
    queryKey: ['regioes'],
    queryFn: async () => {
      const response = await fetchRegioes();
      return response.regioes;
    },
    staleTime: Infinity
  });
}

// Hook para buscar estados
export function useEstados(regiao?: string) {
  return useQuery({
    queryKey: ['estados', regiao],
    queryFn: async () => {
      const response = await fetchEstados(regiao);
      return response.estados;
    },
    staleTime: Infinity
  });
}

// Hook para métricas agregadas
export function useMetricas(params: FilterParams, enabled = true) {
  return useQuery({
    queryKey: ['metricas', params],
    queryFn: () => fetchMetricas(params),
    enabled,
    staleTime: 30000 // 30 segundos
  });
}

// Hook para dados de tendência
export function useTendencia(params: FilterParams, enabled = true) {
  return useQuery({
    queryKey: ['tendencia', params],
    queryFn: () => fetchTendencia(params),
    enabled,
    staleTime: 30000
  });
}

// Hook para dados de comparação
export function useComparacao(params: FilterParams, enabled = true) {
  return useQuery({
    queryKey: ['comparacao', params],
    queryFn: () => fetchComparacao(params),
    enabled,
    staleTime: 30000
  });
}

// Hook combinado para dashboard
export function useDashboardData(params: FilterParams) {
  const metricas = useMetricas(params);
  const tendencia = useTendencia({
    ...params,
    agrupar_por: params.estados?.length ? 'estado' : 'none'
  });
  const comparacao = useComparacao(params);

  return {
    metricas,
    tendencia,
    comparacao,
    isLoading: metricas.isLoading || tendencia.isLoading || comparacao.isLoading,
    isError: metricas.isError || tendencia.isError || comparacao.isError,
    error: metricas.error || tendencia.error || comparacao.error
  };
}

// Tipos exportados
export type {
  FilterParams,
  MetricasResponse,
  TendenciaResponse,
  ComparacaoResponse,
  IndicadorInfo,
  EstadoInfo
};
