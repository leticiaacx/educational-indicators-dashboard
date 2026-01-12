import { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Database,
  Menu,
  GraduationCap,
  Loader2,
  Map
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { ComparisonChart } from "@/components/dashboard/ComparisonChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { IndicatorDescription } from "@/components/dashboard/IndicatorDescription";
import { BrazilMap } from "@/components/dashboard/BrazilMap";
import {
  loadEducationalData,
  filterData,
  calculateMetrics,
  aggregateByYear,
  indicadores,
  anosDisponiveis,
  MunicipalityData,
} from "@/data/educationalData";

const Index = () => {
  // Data state
  const [allData, setAllData] = useState<MunicipalityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [indicador, setIndicador] = useState("tdi");
  const [regiao, setRegiao] = useState("Todas");
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get years based on selected indicator
  const yearBounds = useMemo(() => {
    return anosDisponiveis[indicador] || { inicio: 2006, fim: 2024 };
  }, [indicador]);
  
  const [yearRange, setYearRange] = useState<[number, number]>([2006, 2024]);

  // Update year range when indicator changes
  useEffect(() => {
    setYearRange([yearBounds.inicio, yearBounds.fim]);
  }, [yearBounds]);

  // Load data on mount
  useEffect(() => {
    loadEducationalData().then(data => {
      setAllData(data);
      setIsLoading(false);
    });
  }, []);

  // Get current indicator label
  const indicadorLabel = indicadores.find(i => i.value === indicador)?.label || "TDI";
  const indicadorShortLabel = indicador === 'tdi' ? 'TDI' : 
                               indicador === 'aprovacao' ? 'Aprovação (%)' : 
                               indicador === 'reprovacao' ? 'Reprovação (%)' :
                               'Abandono (%)';

  // Filter data based on current selections
  const filteredData = useMemo(() => {
    return filterData(allData, regiao, selectedEstados, yearRange[0], yearRange[1]);
  }, [allData, regiao, selectedEstados, yearRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    return calculateMetrics(filteredData, indicador);
  }, [filteredData, indicador]);

  // Aggregate data for trend chart
  const trendData = useMemo(() => {
    if (selectedEstados.length > 0) {
      return aggregateByYear(filteredData, indicador, 'estado');
    } else if (regiao !== 'Todas') {
      return aggregateByYear(filteredData, indicador, 'estado');
    } else {
      return aggregateByYear(filteredData, indicador, 'regiao');
    }
  }, [filteredData, indicador, selectedEstados, regiao]);

  const FilterPanelComponent = (
    <FilterPanel
      indicador={indicador}
      onIndicadorChange={setIndicador}
      regiao={regiao}
      onRegiaoChange={setRegiao}
      yearRange={yearRange}
      onYearRangeChange={setYearRange}
      minYear={yearBounds.inicio}
      maxYear={yearBounds.fim}
      selectedEstados={selectedEstados}
      onEstadosChange={setSelectedEstados}
    />
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 bg-sidebar border-r border-sidebar-border">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground">Painel Educacional</h1>
                <p className="text-xs text-muted-foreground">Análise entre Anos</p>
              </div>
            </div>
          </div>
          {FilterPanelComponent}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-background border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Painel Educacional</h1>
              <p className="text-xs text-muted-foreground">Análise entre Anos</p>
            </div>
          </div>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-sidebar">
              <div className="p-4 border-b border-sidebar-border">
                <h2 className="font-semibold text-sidebar-foreground">Filtros</h2>
              </div>
              {FilterPanelComponent}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-foreground">
            Painel Indicadores Educacionais - Análise entre Anos
          </h1>
          <p className="text-muted-foreground mt-1">
            {indicadorLabel} • {yearRange[0]} - {yearRange[1]}
            {selectedEstados.length > 0 && ` • Estados: ${selectedEstados.join(', ')}`}
            {selectedEstados.length === 0 && regiao !== 'Todas' && ` • Região: ${regiao}`}
          </p>
        </div>

        {/* Indicator Description */}
        <IndicatorDescription indicador={indicador} />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <MetricCard
            title="Total de Registros"
            value={metrics.count}
            format="number"
            icon={Database}
            variant="blue"
          />
          <MetricCard
            title="Total de Municípios"
            value={metrics.municipios}
            format="number"
            icon={GraduationCap}
            variant="blue"
          />
          <MetricCard
            title={`${indicadorShortLabel} Médio`}
            value={metrics.media}
            format="decimal"
            icon={BarChart3}
            variant="green"
          />
          <MetricCard
            title={`${indicadorShortLabel} Máximo`}
            value={metrics.max}
            format="decimal"
            icon={TrendingUp}
            variant="orange"
          />
          <MetricCard
            title={`${indicadorShortLabel} Mínimo`}
            value={metrics.min}
            format="decimal"
            icon={TrendingDown}
            variant="purple"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tendencia" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="tendencia" className="gap-2">
              <TrendingUp className="w-4 h-4 hidden sm:inline" />
              Tendência
            </TabsTrigger>
            <TabsTrigger value="comparacao" className="gap-2">
              <BarChart3 className="w-4 h-4 hidden sm:inline" />
              Comparação
            </TabsTrigger>
            <TabsTrigger value="mapa" className="gap-2">
              <Map className="w-4 h-4 hidden sm:inline" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="dados" className="gap-2">
              <Database className="w-4 h-4 hidden sm:inline" />
              Dados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tendencia" className="animate-fade-in">
            <div className="bg-card rounded-lg border border-border p-4 lg:p-6 card-shadow">
              <h3 className="text-lg font-semibold mb-4">
                Evolução Temporal do {indicadorShortLabel}
              </h3>
              <TrendChart 
                data={trendData} 
                indicadorLabel={indicadorShortLabel}
                showTrendLine={true}
              />
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Linhas tracejadas representam a tendência calculada por regressão linear
              </p>
            </div>
          </TabsContent>

          <TabsContent value="comparacao" className="animate-fade-in">
            <div className="bg-card rounded-lg border border-border p-4 lg:p-6 card-shadow">
              <h3 className="text-lg font-semibold mb-4">
                Comparação - {indicadorShortLabel} (Média, Máximo, Mínimo)
              </h3>
              <ComparisonChart
                data={filteredData}
                selectedEstados={selectedEstados}
                regiao={regiao}
                indicador={indicador}
                indicadorLabel={indicadorShortLabel}
              />
            </div>
          </TabsContent>

          <TabsContent value="mapa" className="animate-fade-in">
            <div className="bg-card rounded-lg border border-border p-4 lg:p-6 card-shadow">
              <BrazilMap
                data={allData}
                indicador={indicador}
                indicadorLabel={indicadorShortLabel}
                selectedEstados={selectedEstados}
                regiao={regiao}
                anoInicio={yearRange[0]}
                anoFim={yearRange[1]}
              />
            </div>
          </TabsContent>

          <TabsContent value="dados" className="animate-fade-in">
            <div className="bg-card rounded-lg border border-border p-4 lg:p-6 card-shadow">
              <h3 className="text-lg font-semibold mb-4">
                Tabela de Dados - {indicadorShortLabel}
              </h3>
              <DataTable data={filteredData} indicador={indicador} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
