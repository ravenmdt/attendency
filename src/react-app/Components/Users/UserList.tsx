import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { useAuth } from "../Auth/AuthContext";
import type {
  UserListApiRow,
  UsersListResponse,
} from "../../../shared/users.types";

type UserListProps = {
  onEditUser?: (userId: number) => void;
  onAddUser?: () => void;
};

function formatLastSeen(lastLoginAt: number | null): string {
  if (lastLoginAt === null) return "Never";

  const elapsedMs = Math.max(0, Date.now() - lastLoginAt);
  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function UserList({ onEditUser, onAddUser }: UserListProps) {
  const { authenticatedFetch, currentUser } = useAuth();
  const [people, setPeople] = useState<UserListApiRow[]>([]);
  const isAdmin = currentUser?.role === "Admin";
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        const response = await authenticatedFetch("/api/users");
        const body = (await response
          .json()
          .catch(() => null)) as UsersListResponse | null;

        if (!response.ok || !body?.ok) {
          throw new Error(
            body && !body.ok ? body.error : "Failed to load users",
          );
        }

        if (!isMounted) return;
        setPeople(body.rows);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setPeople([]);
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [authenticatedFetch]);

  if (isLoading) {
    return (
      <section className="ui-surface ui-border rounded-xl border p-5 text-sm sm:p-6">
        <p className="ui-user-list-meta">Loading users...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="ui-surface ui-border rounded-xl border p-5 text-sm sm:p-6">
        <p className="ui-danger-text">{error}</p>
      </section>
    );
  }

  return (
    <section className="ui-surface ui-border overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <div>
          <h2 className="ui-user-list-name text-base/7 font-semibold">
            Team users
          </h2>
          <p className="ui-user-list-meta text-sm/6">
            {isAdmin
              ? "Manage the current user profiles and access defaults."
              : "View the current user profiles. Editing is reserved for Admin users."}
          </p>
        </div>
        {isAdmin && onAddUser ? (
          <button
            type="button"
            onClick={onAddUser}
            className="ui-user-edit-save rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Add user
          </button>
        ) : null}
      </div>

      <ul role="list" className="divide-y divide-gray-100 dark:divide-white/5">
        {people.map((person) => (
          <li
            key={person.id}
            onClick={() => {
              if (!isAdmin) return;
              onEditUser?.(person.id);
            }}
            onKeyDown={(event) => {
              if (!isAdmin) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onEditUser?.(person.id);
              }
            }}
            role={isAdmin && onEditUser ? "button" : undefined}
            tabIndex={isAdmin && onEditUser ? 0 : undefined}
            className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6 lg:px-8 dark:hover:bg-white/2.5"
          >
            <div className="flex min-w-0 gap-x-4">
              {person.imageUrl ? (
                <img
                  alt={person.name}
                  src={person.imageUrl}
                  className="ui-user-list-avatar size-12 flex-none rounded-full object-cover dark:outline dark:-outline-offset-1"
                />
              ) : (
                <UserCircleIcon
                  aria-hidden="true"
                  className="size-12 flex-none text-gray-300 dark:text-gray-500"
                />
              )}
              <div className="min-w-0 flex-auto">
                <p className="ui-user-list-name text-sm/6 font-semibold">
                  <span className="block truncate">{person.name}</span>
                </p>
                <p className="ui-user-list-meta mt-1 flex text-xs/5">
                  <span className="truncate">{person.qualification}</span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-x-4">
              <div className="flex flex-col items-end text-right">
                <p className="ui-user-list-role text-sm/6">{person.role}</p>
                {person.isOnline ? (
                  <div className="mt-1 flex items-center gap-x-1.5">
                    <div className="ui-user-list-online-pill flex-none rounded-full p-1">
                      <div className="ui-user-list-online-dot size-1.5 rounded-full" />
                    </div>
                    <p className="ui-user-list-meta text-xs/5">Online</p>
                  </div>
                ) : (
                  <p className="ui-user-list-meta mt-1 text-xs/5">
                    Last seen{" "}
                    <time
                      dateTime={
                        person.lastLoginAt
                          ? new Date(person.lastLoginAt).toISOString()
                          : undefined
                      }
                    >
                      {formatLastSeen(person.lastLoginAt)}
                    </time>
                  </p>
                )}
              </div>
              {isAdmin ? (
                <ChevronRightIcon
                  aria-hidden="true"
                  className="ui-user-list-chevron size-5 flex-none"
                />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
