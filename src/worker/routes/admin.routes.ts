import type { Hono } from "hono";
import type {
  AdminSettingsResponse,
  AdminSettingsSaveRequest,
  AdminSettingsSaveResponse,
} from "../../shared/admin.types";
import type { UserRole } from "../../shared/users.types";
import {
  PBKDF2_ITERATIONS,
  isValidPassword,
  pbkdf2HashHex,
  randomHex,
} from "../auth/security";
import { requireAuth } from "../middleware/requireAuth";
import type { AppEnv } from "../types";

/*
  admin.routes.ts

  This route module stores and serves the small set of project-wide admin
  settings that should live on the server:
  - whether the User role may see Admin Controls
  - the hashed default password used for new-user creation and password resets

  The key idea is that the plaintext password is only sent once from the form.
  After that, the worker stores only the derived hash + salt + algorithm data.
*/

const INITIAL_DEFAULT_PASSWORD = "TigerTiger313#!#";
const DEFAULT_ATTENDANCE_FEED_CUTOFF_DAYS = 13;
const MIN_ATTENDANCE_FEED_CUTOFF_DAYS = 1;
const MAX_ATTENDANCE_FEED_CUTOFF_DAYS = 21;

type AdminSettingsRow = {
  settings_id: number;
  default_password_hash: string;
  default_password_salt: string;
  default_password_iterations: number;
  default_password_algo: string;
  allow_user_role_admin_controls: number;
  allow_admin_assistant_role_admin_controls?: number | null;
  show_day_icons?: number | null;
  show_night_icons?: number | null;
  attendance_feed_cutoff_days?: number | null;
  updated_at: number | null;
  updated_by_user_id: number | null;
};

function clampAttendanceFeedCutoffDays(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return DEFAULT_ATTENDANCE_FEED_CUTOFF_DAYS;
  }

  return Math.min(
    MAX_ATTENDANCE_FEED_CUTOFF_DAYS,
    Math.max(MIN_ATTENDANCE_FEED_CUTOFF_DAYS, Math.trunc(Number(value))),
  );
}

function mapAdminSettings(row: AdminSettingsRow, canEdit: boolean) {
  return {
    allowUserRoleAdminControls: Boolean(row.allow_user_role_admin_controls),
    allowAdminAssistantRoleAdminControls: Boolean(
      row.allow_admin_assistant_role_admin_controls,
    ),
    defaultPasswordConfigured: Boolean(row.default_password_hash),
    showDayIcons:
      row.show_day_icons === undefined || row.show_day_icons === null
        ? true
        : Boolean(row.show_day_icons),
    showNightIcons:
      row.show_night_icons === undefined || row.show_night_icons === null
        ? true
        : Boolean(row.show_night_icons),
    attendanceFeedCutoffDays: clampAttendanceFeedCutoffDays(
      row.attendance_feed_cutoff_days,
    ),
    updatedAt: row.updated_at === null ? null : Number(row.updated_at),
    canEdit,
  };
}

function toIsoDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function pruneAttendanceFeedForWindow(
  db: D1Database,
  cutoffDays: number,
) {
  const todayDateKey = toIsoDateKey(new Date());
  const maxVisibleDate = new Date();
  maxVisibleDate.setDate(maxVisibleDate.getDate() + cutoffDays);
  const maxVisibleDateKey = toIsoDateKey(maxVisibleDate);

  try {
    // Run cleanup immediately after the admin saves a new cutoff so the stored
    // feed data matches the newly selected rollover window right away.
    await db
      .prepare(
        `DELETE FROM attendance_change_feed
         WHERE date < ?1 OR date > ?2 OR expires_at < ?3`
      )
      .bind(todayDateKey, maxVisibleDateKey, Date.now())
      .run();
  } catch {
    // Keep admin settings saves working even if the feed table is not yet
    // present in an older environment.
  }
}

export function canAccessAdminControls(
  userRole: UserRole,
  allowUserRoleAdminControls: boolean,
  allowAdminAssistantRoleAdminControls: boolean,
) {
  if (userRole === "Admin") return true;
  if (userRole === "Admin Assistant") {
    return allowAdminAssistantRoleAdminControls;
  }

  return allowUserRoleAdminControls;
}

async function insertInitialAdminSettings(db: D1Database) {
  const saltHex = randomHex(16);
  const passwordHash = await pbkdf2HashHex(
    INITIAL_DEFAULT_PASSWORD,
    saltHex,
    PBKDF2_ITERATIONS,
  );

  await db
    .prepare(
      `INSERT INTO admin_settings (
        settings_id,
        default_password_hash,
        default_password_salt,
        default_password_iterations,
        default_password_algo,
        allow_user_role_admin_controls,
        allow_admin_assistant_role_admin_controls,
        show_day_icons,
        show_night_icons,
        attendance_feed_cutoff_days,
        updated_at,
        updated_by_user_id
      ) VALUES (1, ?1, ?2, ?3, 'pbkdf2-sha256', 0, 0, 1, 1, ?4, ?5, NULL)`
    )
    .bind(
      passwordHash,
      saltHex,
      PBKDF2_ITERATIONS,
      DEFAULT_ATTENDANCE_FEED_CUTOFF_DAYS,
      Date.now(),
    )
    .run();
}

export async function getAdminSettingsRow(db: D1Database) {
  async function selectSettingsRow() {
    try {
      return await db
        .prepare(
          `SELECT
            settings_id,
            default_password_hash,
            default_password_salt,
            default_password_iterations,
            default_password_algo,
            allow_user_role_admin_controls,
            allow_admin_assistant_role_admin_controls,
            show_day_icons,
            show_night_icons,
            attendance_feed_cutoff_days,
            updated_at,
            updated_by_user_id
          FROM admin_settings
          WHERE settings_id = 1`
        )
        .first<AdminSettingsRow>();
    } catch {
      return await db
        .prepare(
          `SELECT
            settings_id,
            default_password_hash,
            default_password_salt,
            default_password_iterations,
            default_password_algo,
            allow_user_role_admin_controls,
            updated_at,
            updated_by_user_id
          FROM admin_settings
          WHERE settings_id = 1`
        )
        .first<AdminSettingsRow>();
    }
  }

  let row = await selectSettingsRow();

  if (row) return row;

  await insertInitialAdminSettings(db);

  row = await selectSettingsRow();

  if (!row) {
    throw new Error("Admin settings row could not be initialized");
  }

  return row;
}

export function registerAdminRoutes(app: Hono<AppEnv>) {
  app.use("/api/admin-settings", requireAuth);

  app.get("/api/admin-settings", async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.json<AdminSettingsResponse>(
        { ok: false, error: "D1 binding DB is not configured" },
        500,
      );
    }

    const authUserRole = c.get("authUserRole");
    const settings = await getAdminSettingsRow(db);

    if (
      !canAccessAdminControls(
        authUserRole,
        Boolean(settings.allow_user_role_admin_controls),
        Boolean(settings.allow_admin_assistant_role_admin_controls),
      )
    ) {
      return c.json<AdminSettingsResponse>(
        { ok: false, error: "You do not have access to Admin Controls" },
        403,
      );
    }

    return c.json<AdminSettingsResponse>({
      ok: true,
      settings: mapAdminSettings(settings, authUserRole === "Admin"),
    });
  });

  app.post("/api/admin-settings", async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.json<AdminSettingsSaveResponse>(
        { ok: false, error: "D1 binding DB is not configured" },
        500,
      );
    }

    const authUserRole = c.get("authUserRole");
    const authUserId = c.get("authUserId");

    // Only Admin users may change these project-wide settings.
    if (authUserRole !== "Admin") {
      return c.json<AdminSettingsSaveResponse>(
        { ok: false, error: "Only Admin users can save Admin Controls settings" },
        403,
      );
    }

    let payload: Partial<AdminSettingsSaveRequest>;
    try {
      payload = (await c.req.json()) as Partial<AdminSettingsSaveRequest>;
    } catch {
      return c.json<AdminSettingsSaveResponse>(
        { ok: false, error: "Invalid JSON payload" },
        400,
      );
    }

    if (
      typeof payload.allowUserRoleAdminControls !== "boolean" ||
      typeof payload.allowAdminAssistantRoleAdminControls !== "boolean" ||
      typeof payload.showDayIcons !== "boolean" ||
      typeof payload.showNightIcons !== "boolean" ||
      typeof payload.attendanceFeedCutoffDays !== "number" ||
      !Number.isInteger(payload.attendanceFeedCutoffDays)
    ) {
      return c.json<AdminSettingsSaveResponse>(
        {
          ok: false,
          error: "All admin control, layout, and attendance feed settings must be valid values.",
        },
        400,
      );
    }

    const safeAttendanceFeedCutoffDays = clampAttendanceFeedCutoffDays(
      payload.attendanceFeedCutoffDays,
    );

    const trimmedPassword =
      typeof payload.defaultPassword === "string"
        ? payload.defaultPassword.trim()
        : "";

    const nowMs = Date.now();

    if (trimmedPassword.length > 0) {
      if (!isValidPassword(trimmedPassword)) {
        return c.json<AdminSettingsSaveResponse>(
          {
            ok: false,
            error: "Default password must be between 4 and 128 characters",
          },
          400,
        );
      }

      const saltHex = randomHex(16);
      const passwordHash = await pbkdf2HashHex(
        trimmedPassword,
        saltHex,
        PBKDF2_ITERATIONS,
      );

      try {
        await db
          .prepare(
            `UPDATE admin_settings
             SET
               default_password_hash = ?1,
               default_password_salt = ?2,
               default_password_iterations = ?3,
               default_password_algo = 'pbkdf2-sha256',
               allow_user_role_admin_controls = ?4,
               allow_admin_assistant_role_admin_controls = ?5,
               show_day_icons = ?6,
               show_night_icons = ?7,
               attendance_feed_cutoff_days = ?8,
               updated_at = ?9,
               updated_by_user_id = ?10
             WHERE settings_id = 1`
          )
          .bind(
            passwordHash,
            saltHex,
            PBKDF2_ITERATIONS,
            payload.allowUserRoleAdminControls ? 1 : 0,
            payload.allowAdminAssistantRoleAdminControls ? 1 : 0,
            payload.showDayIcons ? 1 : 0,
            payload.showNightIcons ? 1 : 0,
            safeAttendanceFeedCutoffDays,
            nowMs,
            authUserId,
          )
          .run();
      } catch {
        await db
          .prepare(
            `UPDATE admin_settings
             SET
               default_password_hash = ?1,
               default_password_salt = ?2,
               default_password_iterations = ?3,
               default_password_algo = 'pbkdf2-sha256',
               allow_user_role_admin_controls = ?4,
               updated_at = ?5,
               updated_by_user_id = ?6
             WHERE settings_id = 1`
          )
          .bind(
            passwordHash,
            saltHex,
            PBKDF2_ITERATIONS,
            payload.allowUserRoleAdminControls ? 1 : 0,
            nowMs,
            authUserId,
          )
          .run();
      }
    } else {
      try {
        await db
          .prepare(
            `UPDATE admin_settings
             SET
               allow_user_role_admin_controls = ?1,
               allow_admin_assistant_role_admin_controls = ?2,
               show_day_icons = ?3,
               show_night_icons = ?4,
               attendance_feed_cutoff_days = ?5,
               updated_at = ?6,
               updated_by_user_id = ?7
             WHERE settings_id = 1`
          )
          .bind(
            payload.allowUserRoleAdminControls ? 1 : 0,
            payload.allowAdminAssistantRoleAdminControls ? 1 : 0,
            payload.showDayIcons ? 1 : 0,
            payload.showNightIcons ? 1 : 0,
            safeAttendanceFeedCutoffDays,
            nowMs,
            authUserId,
          )
          .run();
      } catch {
        await db
          .prepare(
            `UPDATE admin_settings
             SET
               allow_user_role_admin_controls = ?1,
               updated_at = ?2,
               updated_by_user_id = ?3
             WHERE settings_id = 1`
          )
          .bind(payload.allowUserRoleAdminControls ? 1 : 0, nowMs, authUserId)
          .run();
      }
    }

    await pruneAttendanceFeedForWindow(db, safeAttendanceFeedCutoffDays);

    const updatedSettings = await getAdminSettingsRow(db);

    return c.json<AdminSettingsSaveResponse>({
      ok: true,
      settings: mapAdminSettings(updatedSettings, true),
      message:
        trimmedPassword.length > 0
          ? "Admin settings saved, default password updated, and the attendance feed was refreshed."
          : "Admin settings saved and the attendance feed was refreshed.",
    });
  });
}
