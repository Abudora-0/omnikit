"use client";

import { useState } from "react";
import { Label, Textarea } from "@/components/ui/primitives";
import { CopyButton } from "@/components/tools/copy-button";
import { renderMarkdown } from "@/lib/markdown";

const SAMPLE = `# Hello, OmniKit

A **live** Markdown preview — rendered safely, *entirely* in your browser.

## Features
- Headings, **bold**, *italic*, and \`inline code\`
- [Links](https://example.com) (safe hrefs only)
- Ordered lists:
1. First
2. Second

> Blockquotes work too.

\`\`\`
const code = "fenced blocks render monospaced";
\`\`\`
`;

export function MarkdownPreviewTool() {
  const [input, setInput] = useState(SAMPLE);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Markdown</Label>
            <CopyButton value={input} />
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="# Start typing Markdown…"
            className="min-h-[420px] font-mono-accent text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="thin-scroll min-h-[420px] max-h-[560px] overflow-auto rounded-md border border-border bg-card p-5">
            {input.trim() ? (
              renderMarkdown(input)
            ) : (
              <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
