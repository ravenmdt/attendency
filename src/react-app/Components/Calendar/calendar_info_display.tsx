import { BoltIcon, MoonIcon, SunIcon } from "@heroicons/react/20/solid";

type NightsIconProps = {
  nights: boolean;
  showDayIcon?: boolean;
  showNightIcon?: boolean;
};

export function NightsIcon({
  nights,
  showDayIcon = true,
  showNightIcon = true,
}: NightsIconProps) {
  if ((nights && !showNightIcon) || (!nights && !showDayIcon)) {
    return <span className="inline-block size-4" aria-hidden="true" />;
  }

  return nights ? (
    <MoonIcon className="size-4 text-indigo-600 dark:text-indigo-300" />
  ) : (
    <SunIcon className="size-4 text-amber-500 dark:text-amber-300" />
  );
}

export function PriorityIcon({ priority }: { priority: boolean }) {
  return priority ? (
    <BoltIcon className="size-4 text-amber-500 dark:text-amber-300" />
  ) : (
    <span className="inline-block size-4" aria-hidden="true" />
  );
}

export function TypeIcon({ type }: { type: string }) {
  return <>{type}</>;
}
