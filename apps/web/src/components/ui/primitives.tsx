import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
}) {
  return (
    <button
      className={cn(
        "group/btn inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
        variant === "default" &&
          "sheen relative bg-primary text-primary-foreground shadow-[0_1px_0_0_hsl(0_0%_100%/0.18)_inset,0_8px_24px_-12px_hsl(var(--primary)/0.7)] hover:shadow-[0_1px_0_0_hsl(0_0%_100%/0.22)_inset,0_10px_30px_-10px_hsl(var(--primary)/0.85)] hover:brightness-110",
        variant === "secondary" &&
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        variant === "outline" &&
          "border border-border bg-transparent text-foreground hover:bg-secondary hover:border-border/80",
        variant === "ghost" && "text-muted-foreground hover:bg-secondary hover:text-foreground",
        variant === "destructive" &&
          "bg-destructive text-white hover:brightness-110 shadow-[0_8px_24px_-12px_hsl(var(--destructive)/0.7)]",
        size === "default" && "h-10 px-5 text-sm",
        size === "sm" && "h-8 px-3 text-xs",
        size === "lg" && "h-12 px-7 text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-secondary/40 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-secondary/20 focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
        props.className,
      )}
      {...props}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "thin-scroll flex min-h-[120px] w-full rounded-md border border-input bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-secondary/20 focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
        props.className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "font-mono-accent text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full appearance-none rounded-md border border-input bg-secondary/40 bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat px-3.5 py-2 pr-10 text-sm text-foreground transition-all duration-200 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-secondary/20 focus-visible:ring-4 focus-visible:ring-primary/10",
        props.className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        ...props.style,
      }}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-card text-card-foreground", className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" | "success" }) {
  return (
    <span
      className={cn(
        "font-mono-accent inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] border",
        variant === "default" && "bg-primary/15 text-primary border-primary/30",
        variant === "secondary" && "bg-secondary text-secondary-foreground border-border",
        variant === "outline" && "border-border text-muted-foreground",
        variant === "success" && "bg-success/15 text-success border-success/30",
        className,
      )}
      {...props}
    />
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary border border-border/60">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand-1))] via-[hsl(var(--brand-2))] to-[hsl(var(--brand-3))] transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }) {
  return (
    <div
      className={cn(
        "rounded-md border border-l-2 px-4 py-3 text-xs leading-relaxed tracking-wide",
        variant === "default" && "border-border border-l-primary/70 bg-primary/[0.06] text-muted-foreground",
        variant === "destructive" &&
          "border-destructive/30 border-l-destructive bg-destructive/10 text-destructive",
        className,
      )}
      {...props}
    />
  );
}
