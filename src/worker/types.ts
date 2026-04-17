import type { Context } from "hono";
import type { UserRole } from "../shared/users.types";

// Shared worker app typing so route modules agree on bindings/variables.
export type AppVariables = {
	authUserId: number;
	authSessionId: string;
	authUserRole: UserRole;
};

export type AppEnv = {
	Bindings: Env;
	Variables: AppVariables;
};

export type AppContext = Context<AppEnv>;
