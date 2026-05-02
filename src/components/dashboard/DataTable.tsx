import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Filter,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { MunicipalityData } from "@/data/educationalData";

interface DataTableProps {
  data: MunicipalityData[];
  indicador: string;
}

type SortField = "ano" | "regiao" | "sgUf" | "noMunicipio" | "valor";
type SortDirection = "asc" | "desc";

type FilterField = "ano" | "regiao" | "sgUf" | "noMunicipio" | "valor";
type FilterOperator =
  | "contains"
  | "equals"
  | "startsWith"
  | "gt"
  | "lt"
  | "gte"
  | "lte";

interface FilterRow {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

const FIELD_OPTIONS: { value: FilterField; label: string; type: "text" | "number" }[] = [
  { value: "ano", label: "Ano", type: "number" },
  { value: "regiao", label: "Região", type: "text" },
  { value: "sgUf", label: "UF", type: "text" },
  { value: "noMunicipio", label: "Município", type: "text" },
  { value: "valor", label: "Valor", type: "number" },
];

const TEXT_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "contains", label: "Contém" },
  { value: "equals", label: "Igual a" },
  { value: "startsWith", label: "Começa com" },
];

const NUMBER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "equals", label: "= Igual" },
  { value: "gt", label: "> Maior que" },
  { value: "lt", label: "< Menor que" },
  { value: "gte", label: "≥ Maior ou igual" },
  { value: "lte", label: "≤ Menor ou igual" },
];

function defaultOperator(field: FilterField): FilterOperator {
  const info = FIELD_OPTIONS.find((f) => f.value === field);
  return info?.type === "number" ? "equals" : "contains";
}

const ITEMS_PER_PAGE = 15;

let rowCounter = 0;
function newId() {
  return `filter-${++rowCounter}`;
}

export function DataTable({ data, indicador }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("ano");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  const [filterRows, setFilterRows] = useState<FilterRow[]>([
    { id: newId(), field: "regiao", operator: "contains", value: "" },
  ]);
  const [appliedFilters, setAppliedFilters] = useState<FilterRow[]>([]);

  const uniqueOptions = useMemo(() => {
    const anos = Array.from(new Set(data.map((d) => d.ano))).sort((a, b) => b - a);
    const regioes = Array.from(new Set(data.map((d) => d.regiao))).sort();
    const ufs = Array.from(new Set(data.map((d) => d.sgUf))).sort();
    return {
      ano: anos.map(String),
      regiao: regioes,
      sgUf: ufs,
    };
  }, [data]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // ── Filter row helpers ──────────────────────────────────────────────────────

  const addFilterRow = () => {
    setFilterRows((prev) => [
      ...prev,
      { id: newId(), field: "regiao", operator: "contains", value: "" },
    ]);
  };

  const removeFilterRow = (id: string) => {
    setFilterRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateFilterRow = (id: string, patch: Partial<FilterRow>) => {
    setFilterRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // When field changes, reset operator to sensible default
        if ("field" in patch) {
          next.operator = defaultOperator(patch.field as FilterField);
          next.value = "";
        }
        return next;
      })
    );
  };

  const applyFilters = () => {
    setAppliedFilters(filterRows.filter((r) => r.value.trim() !== ""));
    setCurrentPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilterRows([
      { id: newId(), field: "regiao", operator: "contains", value: "" },
    ]);
    setAppliedFilters([]);
    setCurrentPage(1);
  };

  // ── Get valor for a row ─────────────────────────────────────────────────────
  const getValor = (row: MunicipalityData): number =>
    indicador === "tdi"
      ? row.tdi
      : indicador === "aprovacao"
      ? row.aprovacao ?? 0
      : indicador === "reprovacao"
      ? row.reprovacao ?? 0
      : row.abandono ?? 0;

  // ── Apply filters ───────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (appliedFilters.length === 0) return data;

    return data.filter((row) =>
      appliedFilters.every((f) => {
        const term = f.value.toLowerCase().trim();
        const num = parseFloat(f.value);

        const getFieldValue = (): string | number => {
          switch (f.field) {
            case "ano": return row.ano;
            case "regiao": return row.regiao;
            case "sgUf": return row.sgUf;
            case "noMunicipio": return row.noMunicipio;
            case "valor": return getValor(row);
          }
        };

        const fieldVal = getFieldValue();

        if (typeof fieldVal === "number") {
          if (isNaN(num)) return true;
          switch (f.operator) {
            case "equals": return fieldVal === num;
            case "gt":     return fieldVal > num;
            case "lt":     return fieldVal < num;
            case "gte":    return fieldVal >= num;
            case "lte":    return fieldVal <= num;
            default:       return true;
          }
        } else {
          const str = (fieldVal as string).toLowerCase();
          switch (f.operator) {
            case "contains":   return str.includes(term);
            case "equals":     return str === term;
            case "startsWith": return str.startsWith(term);
            default:           return true;
          }
        }
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, appliedFilters, indicador]);

  // ── Sort ────────────────────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case "ano":         aVal = a.ano;           bVal = b.ano;           break;
        case "regiao":      aVal = a.regiao;        bVal = b.regiao;        break;
        case "sgUf":        aVal = a.sgUf;          bVal = b.sgUf;          break;
        case "noMunicipio": aVal = a.noMunicipio;   bVal = b.noMunicipio;   break;
        case "valor":       aVal = getValor(a);     bVal = getValor(b);     break;
        default: return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, sortField, sortDirection, indicador]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const indicadorLabel =
    indicador === "tdi" ? "TDI" :
    indicador === "aprovacao" ? "Aprovação" :
    indicador === "reprovacao" ? "Reprovação" : "Abandono";

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Sem dados para exibir. Ajuste os filtros para visualizar a tabela.
      </div>
    );
  }

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* ── Filter toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {appliedFilters.length > 0 && (
            <span className="ml-1 rounded-full bg-primary-foreground text-primary text-[10px] font-bold px-1.5 py-0.5 leading-none">
              {appliedFilters.length}
            </span>
          )}
        </Button>

        {appliedFilters.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground">
              {sortedData.length} resultado{sortedData.length !== 1 ? "s" : ""}{" "}
              <span className="text-foreground">(filtrado de {data.length})</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-muted-foreground hover:text-foreground h-8"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </Button>
          </>
        )}
      </div>

      {/* ── Filter panel ────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="border border-border rounded-lg bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addFilterRow}
                className="gap-1 h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterRows([
                    { id: newId(), field: "regiao", operator: "contains", value: "" },
                  ]);
                }}
                className="gap-1 h-8 text-muted-foreground"
                disabled={filterRows.length <= 1 && filterRows[0]?.value === ""}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar
              </Button>
            </div>
          </div>

          {filterRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum filtro adicionado. Clique em{" "}
              <button
                onClick={addFilterRow}
                className="text-primary underline"
              >
                Adicionar
              </button>{" "}
              para criar um filtro.
            </p>
          ) : (
            <div className="space-y-2">
              {filterRows.map((row) => {
                const fieldInfo = FIELD_OPTIONS.find((f) => f.value === row.field);
                const operators =
                  fieldInfo?.type === "number" ? NUMBER_OPERATORS : TEXT_OPERATORS;

                return (
                  <div key={row.id} className="flex items-center gap-2 flex-wrap">
                    {/* Field selector */}
                    <Select
                      value={row.field}
                      onValueChange={(val) =>
                        updateFilterRow(row.id, { field: val as FilterField })
                      }
                    >
                      <SelectTrigger className="w-[130px] h-9 text-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Operator selector */}
                    <Select
                      value={row.operator}
                      onValueChange={(val) =>
                        updateFilterRow(row.id, {
                          operator: val as FilterOperator,
                        })
                      }
                    >
                      <SelectTrigger className="w-[150px] h-9 text-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Value input */}
                    {["ano", "regiao", "sgUf"].includes(row.field) ? (
                      <Select
                        value={row.value || undefined}
                        onValueChange={(val) => updateFilterRow(row.id, { value: val })}
                      >
                        <SelectTrigger className="h-9 text-sm flex-1 min-w-[120px] max-w-[240px] bg-background">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueOptions[row.field as "ano" | "regiao" | "sgUf"].map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-9 text-sm flex-1 min-w-[120px] max-w-[240px] bg-background"
                        placeholder="Valor..."
                        type={fieldInfo?.type === "number" ? "number" : "text"}
                        value={row.value}
                        onChange={(e) =>
                          updateFilterRow(row.id, { value: e.target.value })
                        }
                      />
                    )}

                    {/* Remove row */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeFilterRow(row.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(false)}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={applyFilters}
              disabled={filterRows.length === 0}
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-20">
                <SortButton field="ano">Ano</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="regiao">Região</SortButton>
              </TableHead>
              <TableHead className="w-20">
                <SortButton field="sgUf">UF</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="noMunicipio">Município</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="valor">{indicadorLabel}</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const valor = getValor(row);
                return (
                  <TableRow key={`${row.coMunicipio}-${row.ano}-${index}`}>
                    <TableCell className="font-medium">{row.ano}</TableCell>
                    <TableCell>{row.regiao}</TableCell>
                    <TableCell>{row.sgUf}</TableCell>
                    <TableCell>{row.noMunicipio}</TableCell>
                    <TableCell className="text-right font-mono">
                      {valor.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-10"
                >
                  Nenhum resultado encontrado. Tente ajustar os filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sortedData.length > 0
            ? `Mostrando ${startIndex + 1}–${Math.min(
                startIndex + ITEMS_PER_PAGE,
                sortedData.length
              )} de ${sortedData.length} registros`
            : "Sem registros"}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-sm text-muted-foreground">
            Página {currentPage} de {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}