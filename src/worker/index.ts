import { Hono } from "hono";
import { registerAuthRoutes } from "./routes/auth.routes";
import { registerCalendarRoutes } from "./routes/calendar.routes";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// Base health/sample endpoint kept for quick sanity checks.
app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Route modules keep auth and calendar concerns separated and easier to maintain.
registerAuthRoutes(app);
registerCalendarRoutes(app);

export default app;
