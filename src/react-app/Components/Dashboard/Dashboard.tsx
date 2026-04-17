import { useAuth } from "../Auth/AuthContext";

/*
  Dashboard.tsx

  This is the top-level dashboard screen shown after login.
  Its job is to assemble the smaller dashboard sections into one readable page.

  The dashboard is also the default landing view inside the app shell, so users
  arrive here first and can return here anytime from the navigation menu.
*/

export default function Dashboard() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-8">
      {/*
        Welcome section:
        This gives the user immediate context about where they are and what the
        dashboard is meant to help them do.
      */}
      <section className="ui-surface ui-border rounded-xl border p-5 sm:p-6">
        <h1 className="text-xl font-semibold">
          {currentUser ? `Welcome ${currentUser.name}` : "Welcome"}
        </h1>
        <p className="ui-text-muted mt-2 text-sm/6">Welcoming touch</p>
      </section>
    </div>
  );
}
