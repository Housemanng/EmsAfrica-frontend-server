import { useRef, useEffect } from "react";
import "./UserDetailsModal.css";

/** Location object from backend (populated) */
interface LocationRef {
  name?: string;
  code?: string;
}

/** User object for sidebar (username/email/role) or org user (firstName, lastName, etc.) */
export interface UserDetailsModalUser {
  username?: string;
  email?: string;
  role?: string;
  photo?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  isSuspended?: boolean;
  sex?: string;
  dateOfBirth?: string;
  description?: string;
  state?: LocationRef | string;
  lga?: LocationRef | string;
  ward?: LocationRef | string;
  pollingUnit?: LocationRef | string;
  createdAt?: string;
  createdBy?: { firstName?: string; lastName?: string } | string;
}

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetailsModalUser | null;
  /** Show Edit User button and call onEdit when clicked */
  showEditButton?: boolean;
  onEdit?: () => void;
}

export default function UserDetailsModal({
  isOpen,
  onClose,
  user,
  showEditButton = false,
  onEdit,
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

  const displayName =
    user?.firstName ?? user?.lastName ?? user?.middleName
      ? [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ")
      : user?.username ?? "";
  const initials = displayName.slice(0, 2).toUpperCase() || "U";
  const status = user?.isSuspended ? "Suspended" : "Active";
  const statusClass = user?.isSuspended ? "user-modal__status user-modal__status--warning" : "user-modal__status";
  const roleDisplay = user?.role ? String(user.role).replace(/_/g, " ") : "—";

  const getLocationDisplay = (loc: LocationRef | string | undefined) => {
    if (!loc) return "—";
    if (typeof loc === "object" && loc !== null) {
      return (loc.name ?? loc.code ?? "—") as string;
    }
    return String(loc);
  };

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
              <span className={statusClass}>{status}</span>
            </h2>
          </div>

          <div className="user-modal__body">
            <div className="user-modal__image-wrap">
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt={displayName || "User"}
                  className="user-modal__image"
                />
              ) : (
                <div className="user-modal__image-placeholder">{initials}</div>
              )}
            </div>
            <div className="user-modal__details">
              <div className="user-modal__detail-row">
                <span className="user-modal__detail-label">Name</span>
                <span className="user-modal__detail-value">{displayName || "—"}</span>
              </div>
              <div className="user-modal__detail-row">
                <span className="user-modal__detail-label">Email</span>
                <span className="user-modal__detail-value">{user?.email || "—"}</span>
              </div>
              {user?.phoneNumber != null && user.phoneNumber !== "" && (
                <div className="user-modal__detail-row">
                  <span className="user-modal__detail-label">Phone</span>
                  <span className="user-modal__detail-value">{user.phoneNumber}</span>
                </div>
              )}
              <div className="user-modal__detail-row">
                <span className="user-modal__detail-label">Role</span>
                <span className="user-modal__detail-value">{roleDisplay}</span>
              </div>
              {user?.createdAt && (
                <div className="user-modal__detail-row">
                  <span className="user-modal__detail-label">Created</span>
                  <span className="user-modal__detail-value">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              {user?.createdBy != null && (() => {
                const createdByName = typeof user.createdBy === "object"
                  ? [user.createdBy.firstName, user.createdBy.lastName].filter(Boolean).join(" ")
                  : String(user.createdBy);
                return createdByName ? (
                  <div className="user-modal__detail-row">
                    <span className="user-modal__detail-label">Created by</span>
                    <span className="user-modal__detail-value">{createdByName}</span>
                  </div>
                ) : null;
              })()}
              {getLocationDisplay(user?.state) !== "—" && (
                <div className="user-modal__detail-row">
                  <span className="user-modal__detail-label">State</span>
                  <span className="user-modal__detail-value">{getLocationDisplay(user?.state)}</span>
                </div>
              )}
              {getLocationDisplay(user?.lga) !== "—" && (
                <div className="user-modal__detail-row">
                  <span className="user-modal__detail-label">LGA</span>
                  <span className="user-modal__detail-value">{getLocationDisplay(user?.lga)}</span>
                </div>
              )}
              {getLocationDisplay(user?.ward) !== "—" && (
                <div className="user-modal__detail-row">
                  <span className="user-modal__detail-label">Ward</span>
                  <span className="user-modal__detail-value">{getLocationDisplay(user?.ward)}</span>
                </div>
              )}
              {getLocationDisplay(user?.pollingUnit) !== "—" && (
                <div className="user-modal__detail-row">
                  <span className="user-modal__detail-label">Polling Unit</span>
                  <span className="user-modal__detail-value">{getLocationDisplay(user?.pollingUnit)}</span>
                </div>
              )}
              {user?.sex != null && user.sex !== "" && (
                <div className="user-modal__detail-row">
                  <span className="user-modal__detail-label">Sex</span>
                  <span className="user-modal__detail-value">{String(user.sex).charAt(0).toUpperCase() + String(user.sex).slice(1)}</span>
                </div>
              )}
              {user?.dateOfBirth && (
                <div className="user-modal__detail-row">
                  <span className="user-modal__detail-label">Date of birth</span>
                  <span className="user-modal__detail-value">
                    {new Date(user.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              )}
              {user?.description ? (
                <div className="user-modal__detail-row">
                  <span className="user-modal__detail-label">Description</span>
                  <span className="user-modal__detail-value user-modal__detail-value--muted">{user.description}</span>
                </div>
              ) : (
                <div className="user-modal__detail-row">
                  <span className="user-modal__detail-label">Member since</span>
                  <span className="user-modal__detail-value user-modal__detail-value--muted">
                    Agent account for electoral monitoring. Authorized to enter and view results within assigned scope.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="user-modal__footer">
            <button type="button" className="user-modal__btn user-modal__btn--secondary" onClick={onClose}>
              Close
            </button>
            {showEditButton && onEdit && (
              <button type="button" className="user-modal__btn user-modal__btn--primary" onClick={onEdit}>
                Edit User
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
