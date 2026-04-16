// ─── Login form ────────────────────────────────────────────────────────────────

// Values held in the login form while the user is typing.
export type LoginFormState = {
  username: string
  password: string
}

// Possible states of the login submission process.
// Keeps the component readable — no ad-hoc boolean flags needed.
export type LoginStatus =
  | 'idle'        // default, form is ready for input
  | 'submitting'  // waiting for the server to respond
  | 'error'       // server returned a failure (wrong credentials, network issue, etc.)
  | 'success'     // authenticated; redirect will happen shortly
