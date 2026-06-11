import { Skeleton } from "@/components/ui/skeleton";

export function LogEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

export function LogSkeleton() {
  return (
    <div className="space-y-2">
      {["a", "b", "c", "d", "e"].map((k) => (
        <Skeleton key={k} className="h-10 w-full" />
      ))}
    </div>
  );
}
