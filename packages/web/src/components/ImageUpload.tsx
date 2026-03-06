import { useState, useRef, useCallback } from "react";
import { ImagePlus, Upload, X, Loader2 } from "lucide-react";
import clsx from "clsx";
import { uploadApi } from "@/lib/api";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB");
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 200);

      const publicUrl = await uploadApi.uploadFile(file);

      clearInterval(interval);
      setProgress(100);

      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 300);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleFile(file);
        return;
      }
    }
  }, [handleFile]);

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-gray-200/60">
        <img
          src={value}
          alt="Event"
          className="h-48 w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity hover:opacity-100">
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow backdrop-blur-sm transition-colors hover:bg-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-lg bg-white/90 p-1.5 text-gray-500 shadow backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={clsx(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all",
          dragOver
            ? "border-primary-400 bg-primary-50/50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50",
          uploading && "pointer-events-none",
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-sm font-semibold text-gray-500">Uploading...</p>
            <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {dragOver ? (
              <Upload className="h-8 w-8 text-primary-500" />
            ) : (
              <ImagePlus className="h-8 w-8 text-gray-300" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-500">
                {dragOver ? "Drop image here" : "Click to upload or drag & drop"}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                JPEG, PNG, WebP, or GIF up to 10 MB
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-red-500">{error}</p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">or paste URL</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  );
}
