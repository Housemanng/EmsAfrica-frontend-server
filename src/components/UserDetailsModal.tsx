import { useRef, useEffect } from "react";
import "./UserDetailsModal.css";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    username?: string;
    email?: string;
    role?: string;
    photo?: string;
  } | null;
}

export default function UserDetailsModal({
  isOpen,
  onClose,
  user,
}: UserDetailsModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  if (!isOpen) return null;

  const initials = user?.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <div
      ref={backdropRef}
      className="user-modal__backdrop"
      onClick={handleBackdropClick}
    >
      <div className="user-modal__wrap">
        <button
          type="button"
          className="user-modal__close user-modal__close--outside"
          onClick={onClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="user-modal__close-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </button>
        <div className="user-modal__dialog" role="dialog" aria-labelledby="user-modal-title">
        <div className="user-modal__header">
          <h2 id="user-modal-title" className="user-modal__title">
            User Details
            <span className="user-modal__status">Active</span>
          </h2>
        </div>

        <div className="user-modal__body">
          <div className="user-modal__image-wrap">
            {user?.photo ? (
              <img
                src={user.photo}
                alt={user.username || "User"}
                className="user-modal__image"
              />
            ) : (
              <div className="user-modal__image-placeholder">{initials}</div>
            )}
          </div>
          <div className="user-modal__details">
            <div className="user-modal__detail-row">
              <span className="user-modal__detail-label">Name</span>
              <span className="user-modal__detail-value">{user?.username || "—"}</span>
            </div>
            <div className="user-modal__detail-row">
              <span className="user-modal__detail-label">Email</span>
              <span className="user-modal__detail-value">{user?.email || "—"}</span>
            </div>
            <div className="user-modal__detail-row">
              <span className="user-modal__detail-label">Role</span>
              <span className="user-modal__detail-value">{user?.role || "—"}</span>
            </div>
            <div className="user-modal__detail-row">
              <span className="user-modal__detail-label">Member since</span>
              <span className="user-modal__detail-value user-modal__detail-value--muted">
                Agent account for electoral monitoring. Authorized to enter and view results within assigned scope.
              </span>
            </div>
          </div>
        </div>

        <div className="user-modal__footer">
          <button type="button" className="user-modal__btn user-modal__btn--secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
