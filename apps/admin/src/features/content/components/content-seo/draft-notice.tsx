export function DraftNotice({ text }: { text: string }) {
  return (
    <div
      className="rounded-control border border-info/30 bg-info-soft px-3 py-2 text-xs leading-7 text-info"
      role="status"
    >
      {text}
    </div>
  );
}
