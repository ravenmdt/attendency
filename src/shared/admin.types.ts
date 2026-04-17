/*
  admin.types.ts

  These shared API types are used by both the frontend and the worker.
  Keeping them in one place helps prevent the client and server from drifting
  out of sync as the feature grows.
*/

export type AdminSettingsApi = {
  allowUserRoleAdminControls: boolean;
  defaultPasswordConfigured: boolean;
  updatedAt: number | null;
  canEdit: boolean;
};

export type AdminSettingsSaveRequest = {
  allowUserRoleAdminControls: boolean;
  defaultPassword?: string;
};

export type AdminSettingsSuccessResponse = {
  ok: true;
  settings: AdminSettingsApi;
};

export type AdminSettingsSaveSuccessResponse = {
  ok: true;
  settings: AdminSettingsApi;
  message: string;
};

export type AdminSettingsErrorResponse = {
  ok: false;
  error: string;
};

export type AdminSettingsResponse =
  | AdminSettingsSuccessResponse
  | AdminSettingsErrorResponse;

export type AdminSettingsSaveResponse =
  | AdminSettingsSaveSuccessResponse
  | AdminSettingsErrorResponse;
