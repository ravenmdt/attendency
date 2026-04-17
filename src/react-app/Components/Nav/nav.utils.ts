/*
  nav.utils.ts

  Small helper functions live here.
  This keeps the JSX components focused on layout instead of utility code.
*/

export function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
