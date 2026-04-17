import { Hono } from "hono";
import { registerAdminRoutes } from "./routes/admin.routes";
import { registerAuthRoutes } from "./routes/auth.routes";
import { registerCalendarRoutes } from "./routes/calendar.routes";
import { registerFeedbackRoutes } from "./routes/feedback.routes";
import { registerReportsRoutes } from "./routes/reports.routes";
import { registerUserRoutes } from "./routes/users.routes";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// Base health/sample endpoint kept for quick sanity checks.
app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Route modules keep auth, calendar, user, and feedback concerns separated and easier to maintain.
registerAuthRoutes(app);
registerCalendarRoutes(app);
registerUserRoutes(app);
registerReportsRoutes(app);
registerAdminRoutes(app);
registerFeedbackRoutes(app);

export default app;
