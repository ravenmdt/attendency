import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/16/solid";

/*
  UserDeleteDialog.tsx

  This dialog is separated from the main form so the delete warning stays easy
  to find and modify without scrolling through unrelated form code.
*/

type UserDeleteDialogProps = {
  open: boolean;
  username: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
};

export function UserDeleteDialog({
  open,
  username,
  isDeleting,
  onClose,
  onConfirmDelete,
}: UserDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={() => onClose()} className="relative z-10">
      <DialogBackdrop
        transition
        className="ui-dialog-backdrop fixed inset-0 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="ui-dialog-panel relative transform overflow-hidden rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transition-all outline dark:-outline-offset-1 data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
              <button
                type="button"
                onClick={onClose}
                className="ui-dialog-close rounded-md focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:focus:outline-white"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>

            <div className="sm:flex sm:items-start">
              <div className="ui-danger-bubble mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10">
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="ui-danger-icon size-6"
                />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <DialogTitle
                  as="h3"
                  className="ui-text-primary text-base font-semibold"
                >
                  Delete user
                </DialogTitle>
                <div className="mt-2">
                  <p className="ui-text-muted text-sm">
                    Are you sure you want to delete {username || "this user"}?
                    This action will permanently remove the account and cannot
                    be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={isDeleting}
                className="ui-user-edit-delete inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="ui-secondary-button mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold inset-ring-1 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
