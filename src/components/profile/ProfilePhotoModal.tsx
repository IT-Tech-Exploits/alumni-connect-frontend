import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { changeProfilePhotoApi } from "../../api/profileApi";
import { InitialsAvatar } from "../shared";

const MAX_BYTES = 3 * 1024 * 1024;

interface ProfilePhotoModalProps {
  mode: "profile" | "cover";
  currentPhoto?: string;
  userName: string;
  onClose: () => void;
  onSaved: () => void;
  onError?: (message: string) => void;
}

/**
 * Photo uploader with live preview. The file is posted to the media endpoint by
 * changeProfilePhotoApi and the stored URL comes back from the server.
 */
export function ProfilePhotoModal({
  mode,
  currentPhoto,
  userName,
  onClose,
  onSaved,
  onError,
}: ProfilePhotoModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const choose = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Image must be under 3 MB.");
      return;
    }
    setError("");
    setFile(f);
    const url = URL.createObjectURL(f);
    setValue(url);
  };

  const save = async () => {
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await changeProfilePhotoApi(file, mode);
      onSaved();
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save photo.";
      setError(message);
      onError?.(message);
    } finally {
      setSaving(false);
    }
  };

  const isCover = mode === "cover";
  const title = isCover ? "Change cover photo" : "Edit profile photo";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            {isCover ? <ImagePlus className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Preview */}
          <div
            className={`relative overflow-hidden ${isCover ? "h-40 rounded-lg" : "mx-auto h-44 w-44 rounded-full"}`}
            style={
              !isCover
                ? { outline: "4px solid #f3f4f6" }
                : undefined
            }
          >
            {value ? (
              <img
                src={value}
                alt="Preview"
                className={isCover ? "h-full w-full object-cover" : "h-full w-full object-cover"}
              />
            ) : currentPhoto ? (
              <img
                src={currentPhoto}
                alt="Current"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${isCover ? "from-brand-primary via-brand-primary to-brand-primaryLight" : "from-brand-red to-brand-redDark"}`}
              >
                <InitialsAvatar name={userName} className="h-full w-full text-5xl" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => choose(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Camera className="h-4 w-4" />
              {value ? "Choose another" : currentPhoto ? "Replace" : "Upload"}
            </button>
          </div>

          {error && <p className="text-center text-xs text-red-600">{error}</p>}
          <p className="text-center text-[11px] text-gray-400">
            JPG, PNG or WebP · max 3 MB
          </p>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !value}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryLight disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}