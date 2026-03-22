import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-gray-700 text-gray-300": variant === "default",
          "bg-green-900/50 text-green-400 border border-green-800": variant === "success",
          "bg-yellow-900/50 text-yellow-400 border border-yellow-800": variant === "warning",
          "bg-red-900/50 text-red-400 border border-red-800": variant === "danger",
          "bg-blue-900/50 text-blue-400 border border-blue-800": variant === "info",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
