// ─── App.tsx ──────────────────────────────────────────────────────────────────
//
// The root of the application. This file does two things:
//   1. Wraps the whole app in AuthProvider so every component can access
//      login state (see Components/Auth/AuthContext.tsx).
//   2. Defines the URL routes:
//        /login  → Login page  (always accessible)
//        /app    → Calendar    (only accessible when logged in)
//        /       → redirects to /login automatically
//        *       → any unknown URL is caught and redirected smartly (see below)
//
// packages used: react, vite, cloudflare, hono, tailwindcss, react-router-dom

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./Components/Auth/AuthContext";
import Login from "./Components/Auth/Login";
import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import Example from "./Pages/Example";

// ─── CatchAllRedirect ─────────────────────────────────────────────────────────
//
// Handles any URL that doesn't match a defined route (e.g. /login/calendar,
// /gibberish, or anything else the user types directly into the browser bar).
//
// The redirect destination depends on whether the user is logged in:
//   - Logged in  → send them to /app (the calendar) so they don't hit a dead end
//   - Not logged in → send them to /login so they can authenticate first
//
// This component exists separately because React hooks (like useAuth) can only
// be called inside a component function, not directly inside JSX.
function CatchAllRedirect() {
	const { isAuthenticated } = useAuth();
	return <Navigate to={isAuthenticated ? "/app" : "/login"} replace />;
}

function App() {
	return (
		// AuthProvider makes login state available to every component inside it.
		<AuthProvider>
			{/*
			  BrowserRouter enables URL-based navigation (e.g. /login, /app).
			  It uses the browser's History API so the URL changes without
			  doing a full page reload.
			*/}
			<BrowserRouter>
				<Routes>
					{/* Default route: visiting "/" redirects straight to /login. */}
					<Route path="/" element={<Navigate to="/login" replace />} />

					{/* The login page — no authentication required to view this. */}
					<Route path="/login" element={<Login />} />

					{/*
					  The main app (calendar + sidebar) is wrapped in ProtectedRoute.
					  ProtectedRoute checks isAuthenticated and redirects to /login
					  if the user hasn't logged in yet, making it impossible to
					  reach this page by typing the URL directly.
					*/}
					<Route
						path="/app"
						element={
							<ProtectedRoute>
								<Example />
							</ProtectedRoute>
						}
					/>

					{/*
					  Catch-all: any URL that doesn't match a route above lands here.
					  CatchAllRedirect decides where to send the user based on whether
					  they are logged in or not.
					*/}
					<Route path="*" element={<CatchAllRedirect />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
