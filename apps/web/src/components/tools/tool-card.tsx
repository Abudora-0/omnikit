"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Lock, Star } from "lucide-react";
import type { OmniTool } from "@omnikit/shared";
import { getToolIcon } from "@/lib/tool-icons";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { useFavorites } from "@/lib/use-tool-prefs";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const categoryIconStyle: Record<string, string> = {
  image:    "bg-sky-500/10 border-sky-500/20 text-sky-400",
  pdf:      "bg-rose-500/10 border-rose-500/20 text-rose-400",
  download: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  audio:    "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400",
  utility:  "bg-primary/10 border-primary/20 text-primary",
};

const categoryText: Record<string, string> = {
  image:    "text-sky-400",
  pdf:      "text-rose-400",
  download: "text-emerald-400",
  audio:    "text-fuchsia-400",
  utility:  "text-primary",
};

type ToolCardProps = {
  tool: OmniTool;
  index?: number;
};

export function ToolCard({ tool, index = 0 }: ToolCardProps) {
  const Icon = getToolIcon(tool.icon);
  const iconStyle = categoryIconStyle[tool.category] ?? "bg-secondary border-border text-muted-foreground";
  const textColor = categoryText[tool.category] ?? "text-primary";
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const favorited = isFavorite(tool.id);

  const onToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowFav = toggleFavorite(tool.id);
    toast({
      title: nowFav ? `Pinned ${tool.name}` : `Unpinned ${tool.name}`,
      description: nowFav ? "Added to Quick Access on the home page." : undefined,
      variant: nowFav ? "success" : "info",
      duration: 2400,
    });
  };

  const content = (
    <SpotlightCard catClass={`cat-${tool.category}`} className={cn(tool.comingSoon && "opacity-50")}>
      <div className="relative flex h-full flex-col gap-4 p-5">
        {/* Coming soon overlay */}
        {tool.comingSoon && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-muted-foreground/50" />
          </div>
        )}

        {/* Header: icon + mode/host badges */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-md border transition-transform duration-300 group-hover:scale-105",
              iconStyle,
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {tool.clientSide && (
              <span className="font-mono-accent rounded-full border border-emerald-500/30 px-2 py-0.5 text-[9px] uppercase tracking-widest text-emerald-400/80">
                local
              </span>
            )}
            {tool.selfHostOnly && (
              <span className="font-mono-accent rounded-full border border-fuchsia-500/30 px-2 py-0.5 text-[9px] uppercase tracking-widest text-fuchsia-400/70">
                self-host
              </span>
            )}
            {!tool.comingSoon && (
              <button
                type="button"
                onClick={onToggleFav}
                aria-label={favorited ? "Unpin tool" : "Pin tool to Quick Access"}
                aria-pressed={favorited}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-200",
                  favorited
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-400 opacity-100"
                    : "border-transparent text-muted-foreground/50 opacity-0 hover:border-border hover:bg-secondary hover:text-foreground group-hover:opacity-100",
                )}
              >
                <Star className={cn("h-3.5 w-3.5", favorited && "fill-amber-400")} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1">
          <h3 className="flex items-center gap-1 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-foreground">
            {tool.name}
            {!tool.comingSoon && (
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
            )}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{tool.description}</p>
        </div>

        {/* Footer: category + mode */}
        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <span className={cn("font-mono-accent text-[10px] uppercase tracking-widest", textColor)}>
            {tool.category}
          </span>
          <span className="font-mono-accent text-[10px] uppercase tracking-widest text-muted-foreground/50">
            {tool.mode}
          </span>
        </div>
      </div>
    </SpotlightCard>
  );

  const wrapped = tool.comingSoon ? (
    <div className="group block h-full">{content}</div>
  ) : (
    <Link href={`/tools/${tool.id}`} className="group block h-full" prefetch={false}>
      {content}
    </Link>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: Math.min(index * 0.025, 0.3), ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="h-full"
    >
      {wrapped}
    </motion.div>
  );
}
