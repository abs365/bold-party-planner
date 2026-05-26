"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import {
  Upload, Trash2, Star, Play, Loader2,
  Image as ImageIcon, Video, Plus, X, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorMedia } from "@/types";
import toast from "react-hot-toast";

interface VendorMediaManagerProps {
  vendorId: string;
  initialMedia: VendorMedia[];
}

export function VendorMediaManager({ vendorId, initialMedia }: VendorMediaManagerProps) {
  const [media, setMedia] = useState<VendorMedia[]>(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [, setUploadProgress] = useState<Record<string, number>>({});
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (media.length + acceptedFiles.length > 20) {
      toast.error("Maximum 20 photos/videos allowed");
      return;
    }

    setUploading(true);
    const results: VendorMedia[] = [];

    for (const file of acceptedFiles) {
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("vendorId", vendorId);
        formData.append("type", file.type.startsWith("video/") ? "video" : "image");
        formData.append("sortOrder", String(media.length + results.length));

        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Upload failed");
        }
        const uploaded = await res.json();
        results.push(uploaded);
        setUploadProgress((prev) => ({ ...prev, [tempId]: 100 }));
      } catch (err: unknown) {
        toast.error(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[tempId];
          return next;
        });
      }
    }

    if (results.length > 0) {
      setMedia((prev) => [...prev, ...results]);
      toast.success(`${results.length} file${results.length > 1 ? "s" : ""} uploaded!`);
    }
    setUploadProgress({});
    setUploading(false);
  }, [vendorId, media.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
      "video/*": [".mp4", ".mov", ".webm"],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: uploading,
  });

  async function setCover(mediaId: string) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.from("vendor_media").update({ is_cover: false }).eq("vendor_id", vendorId);
      await supabase.from("vendor_media").update({ is_cover: true }).eq("id", mediaId);
      setMedia((prev) => prev.map((m) => ({ ...m, is_cover: m.id === mediaId })));
      toast.success("Cover photo updated");
    } catch {
      toast.error("Failed to update cover");
    }
  }

  async function deleteMedia(mediaId: string) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.from("vendor_media").delete().eq("id", mediaId);
      if (error) throw error;
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function saveCaption(mediaId: string) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.from("vendor_media").update({ caption: captionText }).eq("id", mediaId);
      setMedia((prev) => prev.map((m) => m.id === mediaId ? { ...m, caption: captionText } : m));
      setEditingCaption(null);
      toast.success("Caption saved");
    } catch {
      toast.error("Failed to save caption");
    }
  }

  const images = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Photos & Videos</h1>
        <p className="text-slate-400 text-sm">
          High-quality media is the #1 factor in getting bookings. Upload your best work: events you&apos;ve done, setups and highlights.
        </p>
      </div>

      {/* Tips */}
      <div className="bg-white/4 border border-brand-500/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-brand-400 mb-3 flex items-center gap-2">
          <CheckCircle2 size={14} /> Tips for more bookings
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: "📸", tip: "Upload 8–15 high-quality photos of your best work" },
            { icon: "🎥", tip: "Add a 1–2 minute highlight video to stand out" },
            { icon: "⭐", tip: "Set your best photo as the cover. First impressions matter." },
          ].map(({ icon, tip }) => (
            <div key={tip} className="flex gap-2.5 text-xs text-slate-400">
              <span className="text-base flex-shrink-0">{icon}</span>
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-brand-500 bg-brand-500/10"
            : uploading
            ? "border-white/10 bg-white/3 cursor-not-allowed"
            : "border-white/20 bg-white/3 hover:border-brand-500/50 hover:bg-brand-500/5"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="text-brand-400 animate-spin" />
            <p className="text-white font-semibold">Uploading files...</p>
            <p className="text-sm text-slate-500">Please wait</p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center gap-3">
            <Upload size={40} className="text-brand-400" />
            <p className="text-white font-semibold">Drop files here</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center">
                <ImageIcon size={22} className="text-brand-400" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Video size={22} className="text-purple-400" />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold">Drag & drop photos or videos</p>
              <p className="text-sm text-slate-500 mt-1">or click to browse · Max 100MB per file · Up to 20 files</p>
              <p className="text-xs text-slate-600 mt-1">JPG, PNG, WebP, MP4, MOV supported</p>
            </div>
            <button type="button" className="btn-primary py-2.5 px-6 text-sm">
              <Plus size={15} />
              Choose Files
            </button>
          </div>
        )}
      </div>

      {/* Media Count */}
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1.5"><ImageIcon size={14} /> {images.length} photo{images.length !== 1 ? "s" : ""}</span>
        <span className="flex items-center gap-1.5"><Video size={14} /> {videos.length} video{videos.length !== 1 ? "s" : ""}</span>
        <span className="ml-auto text-slate-600">{media.length}/20 files</span>
      </div>

      {/* Masonry Media Grid */}
      {media.length > 0 && (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
          {media.map((item) => (
            <div key={item.id} className="break-inside-avoid group relative rounded-xl overflow-hidden bg-white/5 border border-white/8 hover:border-brand-500/30 transition-all cursor-default">
              {/* Media preview */}
              {item.type === "image" ? (
                <Image src={item.url} alt={item.caption ?? ""} width={400} height={300} className="w-full h-auto object-cover" sizes="25vw" />
              ) : (
                <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <Play size={16} className="text-white ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">Video</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {item.is_cover && (
                  <span className="badge bg-gold-500/90 text-black text-xs font-bold">
                    <Star size={9} />Cover
                  </span>
                )}
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                <div className="flex gap-1.5 justify-end">
                  <button
                    onClick={() => setCover(item.id)}
                    title="Set as cover photo"
                    className="p-1.5 rounded-lg bg-gold-500/80 hover:bg-gold-500 transition-colors"
                  >
                    <Star size={12} className="text-black" />
                  </button>
                  <button
                    onClick={() => deleteMedia(item.id)}
                    className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                </div>
                <button
                  onClick={() => { setEditingCaption(item.id); setCaptionText(item.caption ?? ""); }}
                  className="w-full text-xs text-white/80 hover:text-white bg-black/40 rounded-lg py-1.5 transition-colors"
                >
                  {item.caption ? `"${item.caption}"` : "+ Add caption"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Caption Modal */}
      {editingCaption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white/4 border border-white/6 rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">Edit Caption</h3>
              <button onClick={() => setEditingCaption(null)} className="p-1 rounded-lg hover:bg-white/8">
                <X size={16} />
              </button>
            </div>
            <textarea
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              placeholder="Describe this photo/video..."
              rows={3}
              className="input-field resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingCaption(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => saveCaption(editingCaption)} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      {media.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <ImageIcon size={40} className="mx-auto mb-3 text-slate-700" />
          <p>No photos or videos yet. Upload your first one above.</p>
        </div>
      )}
    </div>
  );
}
