import { UserCircleIcon } from "@heroicons/react/24/solid";

type UserProfilePhotoSectionProps = {
  username: string;
  imageUrl: string;
  isPreparingImage: boolean;
  onPhotoFileChange: (fileList: FileList | null) => void;
  onRemovePhoto: () => void;
};

export default function UserProfilePhotoSection({
  username,
  imageUrl,
  isPreparingImage,
  onPhotoFileChange,
  onRemovePhoto,
}: UserProfilePhotoSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-10 pb-12 md:grid-cols-3">
      <div>
        <h2 className="ui-text-primary text-base/7 font-semibold">Photo</h2>
        <p className="ui-text-muted mt-1 text-sm/6">
          Upload a photo for your current account. Large images are resized
          automatically and then saved privately for signed-in app use.
        </p>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        <div className="col-span-full">
          <label className="block text-sm/6 font-medium text-gray-900 dark:text-white">
            Upload photo
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="ui-secondary-button rounded-md px-3 py-2 text-sm font-semibold inset-ring focus-visible:outline-2 focus-visible:outline-offset-2">
              <span>{isPreparingImage ? "Preparing..." : "Choose photo"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onPhotoFileChange(event.target.files)}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={onRemovePhoto}
              className="ui-secondary-button rounded-md px-3 py-2 text-sm font-semibold inset-ring focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Remove photo
            </button>
          </div>
        </div>

        <div className="col-span-full">
          <label className="block text-sm/6 font-medium text-gray-900 dark:text-white">
            Preview
          </label>
          <div className="mt-2 flex items-center gap-x-3">
            {imageUrl ? (
              <img
                alt={username || "User avatar"}
                src={imageUrl}
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon
                aria-hidden="true"
                className="ui-text-icon size-12"
              />
            )}
            <p className="ui-text-muted text-sm">
              {imageUrl
                ? "This preview shows the image that will be saved to your profile."
                : "No profile photo selected yet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
