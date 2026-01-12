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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from "lucide-react";
import { MunicipalityData } from "@/data/educationalData";

interface DataTableProps {
  data: MunicipalityData[];
  indicador: string;
}

type SortField = 'ano' | 'regiao' | 'sgUf' | 'noMunicipio' | 'valor';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 15;

export function DataTable({ data, indicador }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('ano');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'ano':
          aValue = a.ano;
          bValue = b.ano;
          break;
        case 'regiao':
          aValue = a.regiao;
          bValue = b.regiao;
          break;
        case 'sgUf':
          aValue = a.sgUf;
          bValue = b.sgUf;
          break;
        case 'noMunicipio':
          aValue = a.noMunicipio;
          bValue = b.noMunicipio;
          break;
        case 'valor':
          aValue = indicador === 'tdi' ? a.tdi :
            indicador === 'aprovacao' ? a.aprovacao ?? 0 :
              indicador === 'reprovacao' ? a.reprovacao ?? 0 :
                a.abandono ?? 0;
          bValue = indicador === 'tdi' ? b.tdi :
            indicador === 'aprovacao' ? b.aprovacao ?? 0 :
              indicador === 'reprovacao' ? b.reprovacao ?? 0 :
                b.abandono ?? 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [data, sortField, sortDirection, indicador]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const indicadorLabel = indicador === 'tdi' ? 'TDI' :
    indicador === 'aprovacao' ? 'Aprovação' :
      indicador === 'reprovacao' ? 'Reprovação' : 'Abandono';

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Sem dados para exibir. Ajuste os filtros para visualizar a tabela.
      </div>
    );
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
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
            {paginatedData.map((row, index) => {
              const valor = indicador === 'tdi' ? row.tdi :
                indicador === 'aprovacao' ? row.aprovacao ?? 0 :
                  indicador === 'reprovacao' ? row.reprovacao ?? 0 :
                    row.abandono ?? 0;
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
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, sortedData.length)} de {sortedData.length} registros
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
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}