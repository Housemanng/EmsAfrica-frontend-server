/** Lower number = earlier in the list. Active elections always appear first. */
const STATUS_RANK: Record<string, number> = {
  active: 0,
  upcoming: 1,
  concluded: 2,
};

export type ElectionSortable = {
  status?: string;
  createdAt?: string;
  electionDate?: string;
};

/**
 * Sort elections for dropdowns: active first, then upcoming, then concluded, then unknown.
 * Within the same status, newest first (createdAt, then electionDate).
 */
export function sortElectionsForSelect<T extends ElectionSortable>(elections: T[]): T[] {
  return [...elections].sort((a, b) => {
    const ra = STATUS_RANK[(a.status ?? "").toLowerCase()] ?? 3;
    const rb = STATUS_RANK[(b.status ?? "").toLowerCase()] ?? 3;
    if (ra !== rb) return ra - rb;
    const ta = new Date(a.createdAt ?? a.electionDate ?? 0).getTime();
    const tb = new Date(b.createdAt ?? b.electionDate ?? 0).getTime();
    if (tb !== ta) return tb - ta;
    return 0;
  });
}
