import type { Context } from "hono";

// Shared worker app typing so route modules agree on bindings/variables.
export type AppVariables = {
	authUserId: number;
	authSessionId: string;
};

export type AppEnv = {
	Bindings: Env;
	Variables: AppVariables;
};

export type AppContext = Context<AppEnv>;
