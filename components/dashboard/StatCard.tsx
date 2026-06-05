import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  icon: LucideIcon;
  color: "blue" | "orange" | "purple" | "green" | "indigo" | "teal" | "cyan" | "emerald" | "red" | "yellow";
  stats: {
    label: string;
    value: number | string;
    icon?: LucideIcon;
    iconColor?: string;
  }[];
}

const colorMap = {
  blue: {
    border: "border-l-primary",
    icon: "text-primary",
    title: "text-foreground"
  },
  orange: {
    border: "border-l-primary",
    icon: "text-primary",
    title: "text-foreground"
  },
  purple: {
    border: "border-l-primary",
    icon: "text-primary",
    title: "text-foreground"
  },
  green: {
    border: "border-l-primary",
    icon: "text-primary",
    title: "text-foreground"
  },
  indigo: {
    border: "border-l-primary",
    icon: "text-primary",
    title: "text-foreground"
  },
  teal: {
    border: "border-l-primary",
    icon: "text-primary",
    title: "text-foreground"
  },
  cyan: {
    border: "border-l-primary",
    icon: "text-primary",
    title: "text-foreground"
  },
  emerald: {
    border: "border-l-primary",
    icon: "text-primary",
    title: "text-foreground"
  },
  red: {
    border: "border-l-primary",
    icon: "text-primary",
    title: "text-foreground"
  },
  yellow: {
    border: "border-l-primary",
    icon: "text-primary",
    title: "text-foreground"
  }
};

export function StatCard({ title, icon: Icon, color, stats }: StatCardProps) {
  const colors = colorMap[color];
  
  return (
    <Card className={`p-3 sm:p-4 border-l-4 ${colors.border}`}>
      <div className="flex items-center space-x-2 mb-2 sm:mb-3">
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.icon}`} />
        <h3 className={`text-sm sm:text-base font-semibold ${colors.title}`}>{title}</h3>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground flex items-center">
              {stat.icon && <stat.icon className={`h-3 w-3 mr-1 ${stat.iconColor || ''}`} />}
              {stat.label}
            </span>
            <span className={`${index === 0 ? 'font-bold text-base sm:text-lg' : 'text-sm sm:text-base font-semibold'} ${stat.iconColor || ''}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
