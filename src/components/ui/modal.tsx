import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          "relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-h-[85vh] overflow-y-auto",
          {
            "w-full max-w-md": size === "sm",
            "w-full max-w-lg": size === "md",
            "w-full max-w-2xl": size === "lg",
            "w-full max-w-4xl": size === "xl",
          }
        )}
      >
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
