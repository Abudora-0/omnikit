"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const variantStyles: Record<ToastVariant, { ring: string; icon: ReactNode }> = {
  success: {
    ring: "border-success/40 shadow-[0_18px_40px_-22px_hsl(var(--success)/0.6)]",
    icon: <Check className="h-4 w-4 text-success" />,
  },
  error: {
    ring: "border-destructive/40 shadow-[0_18px_40px_-22px_hsl(var(--destructive)/0.6)]",
    icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
  },
  info: {
    ring: "border-primary/40 shadow-[0_18px_40px_-22px_hsl(var(--primary)/0.6)]",
    icon: <Info className="h-4 w-4 text-primary" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const counter = useRef(0);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = ++counter.current;
    const duration = input.duration ?? 3600;
    setToasts((prev) => [
      ...prev,
      { id, title: input.title, description: input.description, variant: input.variant ?? "info", duration },
    ]);
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed right-4 top-20 z-[120] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className={cn(
                    "glass pointer-events-auto flex items-start gap-3 rounded-lg border bg-card/90 p-3.5 pr-9",
                    variantStyles[t.variant].ring,
                  )}
                >
                  <span className="mt-0.5 shrink-0">{variantStyles[t.variant].icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">{t.title}</p>
                    {t.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground/60 transition-colors hover:text-foreground"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
