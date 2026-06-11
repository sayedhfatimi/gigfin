export function LogEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
