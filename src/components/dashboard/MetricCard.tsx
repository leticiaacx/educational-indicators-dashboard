import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  format?: 'number' | 'decimal';
  icon: LucideIcon;
  variant: 'blue' | 'green' | 'orange' | 'purple';
}

const variantStyles = {
  blue: {
    bg: 'bg-metric-blue-light',
    iconBg: 'bg-metric-blue',
    text: 'text-metric-blue',
  },
  green: {
    bg: 'bg-metric-green-light',
    iconBg: 'bg-metric-green',
    text: 'text-metric-green',
  },
  orange: {
    bg: 'bg-metric-orange-light',
    iconBg: 'bg-metric-orange',
    text: 'text-metric-orange',
  },
  purple: {
    bg: 'bg-metric-purple-light',
    iconBg: 'bg-metric-purple',
    text: 'text-metric-purple',
  },
};

export function MetricCard({ title, value, format = 'decimal', icon: Icon, variant }: MetricCardProps) {
  const styles = variantStyles[variant];
  
  const formattedValue = format === 'number' 
    ? value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg transition-all duration-200 hover:scale-[1.02] card-shadow hover:card-shadow-hover",
        styles.bg
      )}
    >
      <div className={cn("p-2.5 rounded-lg", styles.iconBg)}>
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
          {title}
        </span>
        <span className={cn("text-xl font-bold", styles.text)}>
          {formattedValue}
        </span>
      </div>
    </div>
  );
}