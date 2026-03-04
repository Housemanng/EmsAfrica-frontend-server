/** Delivery/read status for sent messages — single check = delivered, double check = read */
export function MessageStatusIcon({ read }: { read: boolean }) {
  return (
    <span className="msg-status-icon" title={read ? "Read" : "Delivered"} aria-hidden>
      {read ? (
        <svg viewBox="0 0 20 12" width="16" height="10" className="msg-status-icon--read">
          <path d="M1 6l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 6l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 12" width="14" height="10" className="msg-status-icon--delivered">
          <path d="M1 6l4 4 10-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
