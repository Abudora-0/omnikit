import Link from "next/link";
import { Button } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">Tool not found</h1>
      <p className="text-muted-foreground">This tool does not exist or is not available yet.</p>
      <Button>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
