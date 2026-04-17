import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { AppView } from "./nav.types";
import NavSidebarContent from "./NavSidebarContent";

/*
  NavMobileSidebar.tsx

  This version of the sidebar is shown on smaller screens.
  It slides in as an overlay so the app remains usable on phones and tablets.
*/

type NavMobileSidebarProps = {
  open: boolean;
  onClose: (open: boolean) => void;
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onLogout: () => void | Promise<void>;
  isLoggingOut: boolean;
};

export default function NavMobileSidebar({
  open,
  onClose,
  currentView,
  onSelectView,
  onLogout,
  isLoggingOut,
}: NavMobileSidebarProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
      {/* Dark backdrop behind the slide-out menu. */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
      />

      <div className="fixed inset-0 flex">
        <DialogPanel
          transition
          className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
        >
          <TransitionChild>
            <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
              <button
                type="button"
                onClick={() => onClose(false)}
                className="-m-2.5 p-2.5"
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon aria-hidden="true" className="size-6 text-white" />
              </button>
            </div>
          </TransitionChild>

          <div className="ui-surface relative flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-2 dark:ring dark:ring-white/10 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
            <NavSidebarContent
              currentView={currentView}
              onSelectView={onSelectView}
              onLogout={onLogout}
              isLoggingOut={isLoggingOut}
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
