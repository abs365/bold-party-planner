"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Shield, CheckCircle2, XCircle, Clock, Upload, ChevronRight,
  AlertTriangle, Info, Loader2, FileText, RefreshCcw, Star,
  BadgeCheck, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  DOCUMENT_LABELS, DOCUMENT_DESCRIPTIONS,
  getRequirementsForCategory, VERIFICATION_LEVELS, type DocumentType,
} from "@/lib/verification-requirements";
import type { VendorCategory } from "@/types";
import toast from "react-hot-toast";

interface Verification {
  id: string;
  type: string;
  status: "pending" | "approved" | "rejected" | "not_submitted";
  submitted_at: string | null;
  reviewed_at: string | null;
  document_url: string | null;
  notes: string | null;
  rejection_reason: string | null;
  resubmission_allowed: boolean;
  resubmit_count: number;
}

interface ActivityEntry {
  id: string;
  action: string;
  actor_type: string;
  notes: string | null;
  new_status: string | null;
  created_at: string;
}

interface Level1Met {
  emailConfirmed: boolean;
  phoneAdded: boolean;
  bioComplete: boolean;
  cityAdded: boolean;
  hasPackages: boolean;
  hasMedia: boolean;
}

interface VendorVerificationViewProps {
  vendor: {
    id: string;
    business_name: string;
    category: string;
    verification_level: number;
    verified: boolean;
  };
  email: string;
  verifications: Verification[];
  activityLog: ActivityEntry[];
  level1Met: Level1Met;
}

const ACTION_LABELS: Record<string, string> = {
  submitted: "Document submitted",
  resubmitted: "Document resubmitted",
  approved: "Document approved",
  rejected: "Document rejected",
  resubmission_requested: "Resubmission requested",
  level_upgraded: "Verification level upgraded",
  level_downgraded: "Verification level changed",
  flagged: "Account flagged for review",
  unflagged: "Flag removed",
};

export function VendorVerificationView({
  vendor, email, verifications, activityLog, level1Met,
}: VendorVerificationViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "history">("overview");
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [uploadedPath, setUploadedPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [localVerifications, setLocalVerifications] = useState<Verification[]>(verifications);

  const currentLevel = vendor.verification_level;
  const currentLevelConfig = VERIFICATION_LEVELS[currentLevel];
  const nextLevelConfig = currentLevel < 4 ? VERIFICATION_LEVELS[currentLevel + 1] : null;
  const requiredDocs = getRequirementsForCategory(vendor.category as VendorCategory);

  const level1AllMet = Object.values(level1Met).every(Boolean);
  const level1Count = Object.values(level1Met).filter(Boolean).length;

  function getVerification(type: string) {
    return localVerifications.find((v) => v.type === type) ?? null;
  }

  function getDocStatus(type: DocumentType) {
    const v = getVerification(type);
    if (!v) return "not_submitted";
    return v.status;
  }

  const allDocsApproved = requiredDocs.every((d) => getDocStatus(d) === "approved");

  // File dropzone for document upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!uploadingType || acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", uploadingType);

    try {
      const res = await fetch("/api/verification/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? "Upload failed");
      }
      const data = await res.json() as { path: string };
      setUploadedPath(data.path);
      toast.success("File uploaded. Click Submit to save.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "File upload failed. Please try again.");
    }
  }, [uploadingType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    disabled: !uploadingType,
  });

  async function submitVerification() {
    if (!uploadingType || !uploadedPath) {
      toast.error("Please upload a file first");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: uploadingType, document_url: uploadedPath }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }
      const saved = await res.json() as Verification;
      setLocalVerifications((prev) => {
        const filtered = prev.filter((v) => v.type !== uploadingType);
        return [...filtered, saved];
      });
      toast.success("Document submitted for review");
      setUploadingType(null);
      setUploadedPath("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function viewDocument(path: string, docId: string) {
    setViewingDocId(docId);
    try {
      const res = await fetch(`/api/verification/document?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Could not load document");
      const { url } = await res.json() as { url: string };
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not load document. Please try again.");
    } finally {
      setViewingDocId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Verification Centre</h1>
        <p className="text-slate-400 text-sm">
          Get verified to build trust, rank higher, and unlock more bookings.
        </p>
      </div>

      {/* Current Level Banner */}
      <div className={cn(
        "rounded-2xl border p-5 flex items-center gap-4",
        currentLevelConfig.bg, currentLevelConfig.border
      )}>
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0", currentLevelConfig.bg, currentLevelConfig.border, "border-2")}>
          {currentLevel === 0 ? <Shield size={24} className="text-slate-400" /> :
           currentLevel >= 3 ? <Star size={24} className={currentLevelConfig.color} fill="currentColor" /> :
           <BadgeCheck size={24} className={currentLevelConfig.color} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-base font-bold", currentLevelConfig.color)}>
              {currentLevelConfig.label}
            </span>
            {currentLevel === 0 && (
              <span className="text-xs text-slate-500 bg-white/6 px-2 py-0.5 rounded-full">
                Start verification below
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            {"description" in currentLevelConfig ? currentLevelConfig.description : "Unverified account"}
          </p>
          {nextLevelConfig && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <ChevronRight size={12} />
              Next: <span className={nextLevelConfig.color}>{nextLevelConfig.label}</span>
            </p>
          )}
        </div>
      </div>

      {/* Level Progress */}
      <div className="grid grid-cols-4 gap-2">
        {VERIFICATION_LEVELS.slice(1).map((lvl) => {
          const done = currentLevel >= lvl.level;
          const active = currentLevel + 1 === lvl.level;
          return (
            <div
              key={lvl.level}
              className={cn(
                "rounded-xl border p-3 text-center transition-all",
                done ? cn(lvl.bg, lvl.border) :
                active ? "bg-white/5 border-white/15" :
                "bg-white/3 border-white/8 opacity-50"
              )}
            >
              <div className={cn("text-xs font-semibold mb-0.5", done ? lvl.color : "text-slate-500")}>
                Level {lvl.level}
              </div>
              <div className={cn("text-xs", done ? lvl.color : "text-slate-600")}>
                {lvl.label}
              </div>
              {done && <CheckCircle2 size={12} className={cn("mx-auto mt-1", lvl.color)} />}
              {active && <div className="w-1.5 h-1.5 rounded-full bg-white/40 mx-auto mt-1 animate-pulse" />}
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 p-1 rounded-xl">
        {(["overview", "documents", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
              activeTab === tab ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-5">

          {/* Level 1: Verified */}
          <div className={cn(
            "rounded-2xl border p-5",
            currentLevel >= 1 ? "bg-green-500/8 border-green-500/20" : "bg-white/4 border-white/8"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} className={currentLevel >= 1 ? "text-green-400" : "text-slate-500"} />
                <span className="font-bold text-white">Level 1: Verified</span>
              </div>
              {currentLevel >= 1 ? (
                <span className="text-xs text-green-400 bg-green-500/15 px-2.5 py-1 rounded-full font-medium">Complete</span>
              ) : (
                <span className="text-xs text-slate-400 bg-white/6 px-2.5 py-1 rounded-full">{level1Count}/6</span>
              )}
            </div>
            <div className="space-y-2">
              {([
                { key: "emailConfirmed", label: "Email confirmed", hint: email },
                { key: "phoneAdded", label: "Phone number added", hint: "Add via profile settings" },
                { key: "bioComplete", label: "Business bio complete (20+ characters)", hint: "Edit in My Profile" },
                { key: "cityAdded", label: "Service area / city set", hint: "Edit in My Profile" },
                { key: "hasPackages", label: "At least 1 service package created", hint: "Add in Services & Packages" },
                { key: "hasMedia", label: "At least 3 photos or videos uploaded", hint: "Add in Photos & Videos" },
              ] as { key: keyof Level1Met; label: string; hint: string }[]).map(({ key, label, hint }) => (
                <div key={key} className="flex items-center gap-3 text-sm">
                  {level1Met[key] ? (
                    <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                  )}
                  <span className={level1Met[key] ? "text-slate-300" : "text-slate-500"}>
                    {label}
                  </span>
                  {!level1Met[key] && (
                    <span className="text-xs text-slate-600 ml-auto">{hint}</span>
                  )}
                </div>
              ))}
            </div>
            {level1AllMet && currentLevel < 1 && (
              <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300 flex items-center gap-2">
                <Info size={12} />
                All Level 1 requirements met. Your level will be upgraded automatically shortly.
              </div>
            )}
          </div>

          {/* Level 2: Business Verified */}
          <div className={cn(
            "rounded-2xl border p-5",
            currentLevel >= 2 ? "bg-blue-500/8 border-blue-500/20" :
            currentLevel >= 1 ? "bg-white/4 border-white/8" :
            "bg-white/3 border-white/6 opacity-60"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield size={18} className={currentLevel >= 2 ? "text-blue-400" : "text-slate-500"} />
                <span className="font-bold text-white">Level 2: ID Verified</span>
                {currentLevel < 1 && <Lock size={12} className="text-slate-600" />}
              </div>
              {currentLevel >= 2 ? (
                <span className="text-xs text-blue-400 bg-blue-500/15 px-2.5 py-1 rounded-full font-medium">Complete</span>
              ) : allDocsApproved && currentLevel >= 1 ? (
                <span className="text-xs text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full">Under review</span>
              ) : (
                <span className="text-xs text-slate-400 bg-white/6 px-2.5 py-1 rounded-full">
                  {requiredDocs.filter((d) => getDocStatus(d) === "approved").length}/{requiredDocs.length} docs
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Required documents for <strong className="text-slate-400">{vendor.category}</strong> vendors:
            </p>
            <div className="space-y-2">
              {requiredDocs.map((docType) => {
                const status = getDocStatus(docType);
                return (
                  <div key={docType} className="flex items-center gap-3 text-sm">
                    {status === "approved" ? (
                      <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
                    ) : status === "pending" ? (
                      <Clock size={15} className="text-amber-400 flex-shrink-0" />
                    ) : status === "rejected" ? (
                      <XCircle size={15} className="text-red-400 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                    )}
                    <span className={
                      status === "approved" ? "text-slate-300" :
                      status === "pending" ? "text-amber-300" :
                      status === "rejected" ? "text-red-300" : "text-slate-500"
                    }>
                      {DOCUMENT_LABELS[docType]}
                    </span>
                    {status === "not_submitted" && currentLevel >= 1 && (
                      <button
                        onClick={() => { setActiveTab("documents"); setUploadingType(docType); }}
                        className="ml-auto text-xs text-brand-400 hover:text-brand-300"
                      >
                        Upload
                      </button>
                    )}
                    {status === "rejected" && (
                      <button
                        onClick={() => { setActiveTab("documents"); setUploadingType(docType); }}
                        className="ml-auto text-xs text-red-400 hover:text-red-300 flex items-center gap-0.5"
                      >
                        <RefreshCcw size={10} /> Resubmit
                      </button>
                    )}
                    {status === "pending" && (
                      <span className="ml-auto text-xs text-amber-500">In review</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level 3: Business Verified */}
          <div className="rounded-2xl border bg-white/3 border-white/6 p-5 opacity-70">
            <div className="flex items-center gap-2 mb-3">
              <Star size={18} className="text-brand-400" />
              <span className="font-bold text-white">Level 3: Business Verified</span>
              <span className="text-xs text-slate-500">(After document review)</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Achieved automatically when all your required documents are approved by the ELBOLD team. Submit your full document set in Level 2 above to progress.
            </p>
          </div>

          {/* Level 4: Premium Partner */}
          <div className="rounded-2xl border bg-white/3 border-amber-500/10 p-5 opacity-60">
            <div className="flex items-center gap-2 mb-3">
              <Star size={18} className="text-amber-400" fill="currentColor" />
              <span className="font-bold text-white">Level 4: Premium Partner</span>
              <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Invite only</span>
            </div>
            <p className="text-sm text-slate-600">
              Reserved for exceptional vendors with outstanding reputation. Our team will reach out directly.
            </p>
          </div>
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === "documents" && (
        <div className="space-y-6">

          {/* Upload Section */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4">Submit a Document</h3>

            {/* Doc type selector */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Document type</label>
              <select
                value={uploadingType ?? ""}
                onChange={(e) => { setUploadingType(e.target.value as DocumentType || null); setUploadedPath(""); }}
                className="input-field"
              >
                <option value="">Select document type...</option>
                {requiredDocs.map((docType) => {
                  const status = getDocStatus(docType);
                  return (
                    <option key={docType} value={docType} disabled={status === "approved"}>
                      {DOCUMENT_LABELS[docType]}{status === "approved" ? " (Approved)" : status === "pending" ? " (In review)" : ""}
                    </option>
                  );
                })}
              </select>
              {uploadingType && (
                <p className="text-xs text-slate-500 mt-1.5">{DOCUMENT_DESCRIPTIONS[uploadingType]}</p>
              )}
            </div>

            {/* Rejection feedback */}
            {uploadingType && getVerification(uploadingType)?.status === "rejected" && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
                <p className="text-red-300 font-semibold flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={12} /> Previous submission rejected
                </p>
                <p className="text-red-400">
                  {getVerification(uploadingType)?.rejection_reason ?? "Please upload a clearer copy of the document."}
                </p>
              </div>
            )}

            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                !uploadingType ? "border-white/10 opacity-40 cursor-not-allowed" :
                isDragActive ? "border-brand-500 bg-brand-500/10" :
                uploadedPath ? "border-green-500/50 bg-green-500/8" :
                "border-white/20 hover:border-brand-500/50 hover:bg-brand-500/5"
              )}
            >
              <input {...getInputProps()} />
              {uploadedPath ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 size={28} className="text-green-400" />
                  <p className="text-green-300 text-sm font-medium">File uploaded</p>
                  <p className="text-slate-500 text-xs">Ready to submit</p>
                </div>
              ) : isDragActive ? (
                <div>
                  <Upload size={28} className="text-brand-400 mx-auto mb-2" />
                  <p className="text-white text-sm">Drop file here</p>
                </div>
              ) : (
                <div>
                  <Upload size={28} className="text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Drag & drop or click to browse</p>
                  <p className="text-slate-600 text-xs mt-1">JPG, PNG, PDF - Max 10MB</p>
                </div>
              )}
            </div>

            <button
              onClick={submitVerification}
              disabled={!uploadingType || !uploadedPath || submitting}
              className="btn-primary w-full mt-4 py-2.5 disabled:opacity-40"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              Submit for Review
            </button>
          </div>

          {/* Submitted documents list */}
          {localVerifications.length > 0 && (
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">Submitted Documents</h3>
              <div className="space-y-3">
                {localVerifications.map((v) => (
                  <div
                    key={v.id}
                    className={cn(
                      "rounded-xl border p-4 flex items-start gap-3",
                      v.status === "approved" ? "bg-green-500/8 border-green-500/20" :
                      v.status === "rejected" ? "bg-red-500/8 border-red-500/20" :
                      v.status === "pending" ? "bg-amber-500/8 border-amber-500/20" :
                      "bg-white/4 border-white/8"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {v.status === "approved" ? <CheckCircle2 size={16} className="text-green-400" /> :
                       v.status === "rejected" ? <XCircle size={16} className="text-red-400" /> :
                       v.status === "pending" ? <Clock size={16} className="text-amber-400" /> :
                       <FileText size={16} className="text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white">
                          {DOCUMENT_LABELS[v.type as DocumentType] ?? v.type}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full capitalize",
                          v.status === "approved" ? "bg-green-500/20 text-green-400" :
                          v.status === "rejected" ? "bg-red-500/20 text-red-400" :
                          "bg-amber-500/20 text-amber-400"
                        )}>
                          {v.status}
                        </span>
                      </div>
                      {v.submitted_at && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted {formatDistanceToNow(new Date(v.submitted_at), { addSuffix: true })}
                        </p>
                      )}
                      {v.status === "rejected" && v.rejection_reason && (
                        <p className="text-xs text-red-400 mt-1.5 flex items-start gap-1">
                          <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />
                          {v.rejection_reason}
                        </p>
                      )}
                      {v.document_url && (
                        <button
                          onClick={() => viewDocument(v.document_url!, v.id)}
                          disabled={viewingDocId === v.id}
                          className="text-xs text-brand-400 hover:text-brand-300 mt-1.5 flex items-center gap-1 disabled:opacity-50"
                        >
                          {viewingDocId === v.id ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : null}
                          View submitted document
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {localVerifications.length === 0 && (
            <div className="text-center py-10 text-slate-600">
              <Shield size={36} className="mx-auto mb-3 text-slate-700" />
              <p>No documents submitted yet.</p>
              <p className="text-sm mt-1">Start by uploading your government ID above.</p>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {activityLog.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <Clock size={36} className="mx-auto mb-3 text-slate-700" />
              <p>No verification activity yet.</p>
            </div>
          ) : (
            activityLog.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 bg-white/4 border border-white/6 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center flex-shrink-0">
                  {entry.actor_type === "admin" ? (
                    <Shield size={14} className="text-brand-400" />
                  ) : (
                    <FileText size={14} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-slate-400 mt-0.5 italic">&ldquo;{entry.notes}&rdquo;</p>
                  )}
                  <p className="text-xs text-slate-600 mt-0.5">
                    {entry.actor_type === "admin" ? "ELBOLD Events team" : "You"}{" - "}
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
