"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

/** Shared "Copy to clipboard" button with success feedback, used by client-side tools. */
export function CopyButton({
  value,
  label = "Copy",
  disabled,
}: {
  value: string;
  label?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: "Copied to clipboard", variant: "success", duration: 1600 });
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast({ title: "Couldn’t copy", variant: "error" });
    }
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={copy} disabled={disabled || !value}>
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
