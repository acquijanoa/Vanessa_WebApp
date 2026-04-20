type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-6">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="font-serif-display mt-2 text-3xl text-foreground">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
