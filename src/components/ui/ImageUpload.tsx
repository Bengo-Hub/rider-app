"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
}

export function ImageUpload({ label, value, onChange, required }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await api.upload<{ url: string }>("/media/upload", formData);
      onChange(result.url);
      toast.success(`${label} uploaded`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload ${label}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">
        {label} {required && "*"}
      </label>
      
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
          value 
            ? "border-primary/50 bg-primary/5" 
            : "border-border bg-card hover:bg-accent/50"
        } ${uploading ? "cursor-not-allowed opacity-70" : ""}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Uploading...</span>
          </div>
        ) : value ? (
          <>
            <img 
              src={value} 
              alt={label} 
              className="absolute inset-0 h-full w-full rounded-lg object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100 rounded-lg">
              <span className="text-xs font-semibold text-white">Change Image</span>
            </div>
            <button
              onClick={handleClear}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Take a photo or upload</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 5MB</p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
    </div>
  );
}
