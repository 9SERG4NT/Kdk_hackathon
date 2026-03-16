"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
}

export function ImageUpload({ onFileSelect }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // Track the current blob URL in a ref so the unmount cleanup always has the latest value
  const previewRef = useRef<string | null>(null);

  function revokeUrl(url: string | null) {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }

  // Revoke on unmount using the ref so we always revoke the most recent URL
  useEffect(() => {
    return () => {
      revokeUrl(previewRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      revokeUrl(previewRef.current);
      const url = URL.createObjectURL(file);
      previewRef.current = url;
      setPreview(url);
      onFileSelect(file);
    }
  }

  function handleClear() {
    revokeUrl(previewRef.current);
    previewRef.current = null;
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
      {preview ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border">
          <Image
            src={preview}
            alt="Issue preview"
            fill
            className="object-cover"
            unoptimized
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
        >
          <Camera className="h-8 w-8" />
          <span className="text-sm">Click to upload photo</span>
        </button>
      )}
    </div>
  );
}
