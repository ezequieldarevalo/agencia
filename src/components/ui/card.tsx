import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-gray-900 border border-gray-800 rounded-xl p-6", className)}>
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("flex items-start justify-between", className)}>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
      </div>
      {icon && <div className="text-gray-500">{icon}</div>}
    </Card>
  );
}
