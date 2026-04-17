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

type AdminSettingsRow = {
  settings_id: number;
  default_password_hash: string;
  default_password_salt: string;
  default_password_iterations: number;
  default_password_algo: string;
  allow_user_role_admin_controls: number;
  updated_at: number | null;
  updated_by_user_id: number | null;
};

function mapAdminSettings(row: AdminSettingsRow, canEdit: boolean) {
  return {
    allowUserRoleAdminControls: Boolean(row.allow_user_role_admin_controls),
    defaultPasswordConfigured: Boolean(row.default_password_hash),
    updatedAt: row.updated_at === null ? null : Number(row.updated_at),
    canEdit,
  };
}

export function canAccessAdminControls(
  userRole: UserRole,
  allowUserRoleAdminControls: boolean,
) {
  return userRole === "Admin" || allowUserRoleAdminControls;
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
        updated_at,
        updated_by_user_id
      ) VALUES (1, ?1, ?2, ?3, 'pbkdf2-sha256', 0, ?4, NULL)`
    )
    .bind(passwordHash, saltHex, PBKDF2_ITERATIONS, Date.now())
    .run();
}

export async function getAdminSettingsRow(db: D1Database) {
  let row = await db
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

  if (row) return row;

  await insertInitialAdminSettings(db);

  row = await db
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

    if (typeof payload.allowUserRoleAdminControls !== "boolean") {
      return c.json<AdminSettingsSaveResponse>(
        { ok: false, error: "User-role visibility must be true or false" },
        400,
      );
    }

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
    } else {
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

    const updatedSettings = await getAdminSettingsRow(db);

    return c.json<AdminSettingsSaveResponse>({
      ok: true,
      settings: mapAdminSettings(updatedSettings, true),
      message:
        trimmedPassword.length > 0
          ? "Admin settings saved and default password updated."
          : "Admin settings saved.",
    });
  });
}
