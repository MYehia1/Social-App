export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs text-subtle">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
