"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, X, Loader2, Check, Package, Star } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { VendorPackage } from "@/types";
import toast from "react-hot-toast";

interface VendorServicesManagerProps {
  vendorId: string;
  initialPackages: VendorPackage[];
}

interface PackageForm {
  name: string;
  description: string;
  price: string;
  duration_hours: string;
  includes: string;
  is_popular: boolean;
}

const DEFAULT_FORM: PackageForm = {
  name: "",
  description: "",
  price: "",
  duration_hours: "",
  includes: "",
  is_popular: false,
};

export function VendorServicesManager({ vendorId, initialPackages }: VendorServicesManagerProps) {
  const [packages, setPackages] = useState<VendorPackage[]>(initialPackages);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PackageForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  function update(key: keyof PackageForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(pkg: VendorPackage) {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description,
      price: String(pkg.price),
      duration_hours: pkg.duration_hours ? String(pkg.duration_hours) : "",
      includes: pkg.includes.join("\n"),
      is_popular: pkg.is_popular,
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  }

  async function savePackage() {
    if (!form.name || !form.description || !form.price) {
      toast.error("Name, description and price are required");
      return;
    }
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const payload = {
        vendor_id: vendorId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
        includes: form.includes.split("\n").map((s) => s.trim()).filter(Boolean),
        is_popular: form.is_popular,
      };

      if (editingId) {
        const { data, error } = await supabase
          .from("vendor_packages")
          .update(payload)
          .eq("id", editingId)
          .select()
          .single();
        if (error) throw error;
        setPackages((prev) => prev.map((p) => p.id === editingId ? data : p));
        toast.success("Package updated");
      } else {
        const { data, error } = await supabase
          .from("vendor_packages")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setPackages((prev) => [...prev, data]);
        toast.success("Package added");
      }
      cancelForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deletePackage(id: string) {
    if (!confirm("Delete this package?")) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.from("vendor_packages").delete().eq("id", id);
      if (error) throw error;
      setPackages((prev) => prev.filter((p) => p.id !== id));
      toast.success("Package deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services & Packages</h1>
          <p className="text-slate-400 text-sm mt-1">Create packages with clear pricing to attract more bookings</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} />
            Add Package
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white/4 rounded-xl p-6 border border-brand-500/20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Package size={16} className="text-brand-400" />
              {editingId ? "Edit Package" : "New Package"}
            </h3>
            <button onClick={cancelForm} className="p-1.5 rounded-lg hover:bg-white/8">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Package Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Basic, Standard, Premium"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Price (£) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  placeholder="e.g. 500"
                  min={0}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="What's included in this package?"
                rows={2}
                className="input-field resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration (hours)</label>
                <input
                  type="number"
                  value={form.duration_hours}
                  onChange={(e) => update("duration_hours", e.target.value)}
                  placeholder="e.g. 4"
                  step={0.5}
                  min={0}
                  className="input-field"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    onClick={() => update("is_popular", !form.is_popular)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative",
                      form.is_popular ? "bg-brand-500" : "bg-white/15"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                      form.is_popular ? "translate-x-6" : "translate-x-1"
                    )} />
                  </div>
                  <span className="text-sm text-slate-300">Mark as Popular</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">What&apos;s Included (one per line)</label>
              <textarea
                value={form.includes}
                onChange={(e) => update("includes", e.target.value)}
                placeholder="2 hours setup&#10;Professional sound system&#10;All equipment&#10;Post-event cleanup"
                rows={4}
                className="input-field resize-none font-mono text-xs"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={cancelForm} className="btn-secondary flex-1">Cancel</button>
              <button onClick={savePackage} disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? "Saving..." : "Save Package"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package List */}
      <div className="space-y-4">
        {packages.length === 0 && !showForm ? (
          <div className="bg-white/4 border border-white/6 rounded-xl p-10 text-center">
            <Package size={40} className="mx-auto mb-3 text-slate-700" />
            <h3 className="font-bold text-white mb-2">No packages yet</h3>
            <p className="text-slate-400 text-sm mb-5">Customers need clear pricing to make a booking decision. Add your first package now.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={15} />
              Add First Package
            </button>
          </div>
        ) : (
          packages.map((pkg) => (
            <div key={pkg.id} className={cn(
              "bg-white/4 border border-white/6 rounded-xl p-5 relative",
              pkg.is_popular && "border-amber-500/30"
            )}>
              {pkg.is_popular && (
                <div className="absolute -top-2.5 left-5">
                  <span className="badge bg-amber-500 text-amber-900 font-bold">
                    <Star size={10} /> Most Popular
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-bold text-white">{pkg.name}</h3>
                    <span className="text-xl font-bold text-brand-400">{formatCurrency(pkg.price)}</span>
                    {pkg.duration_hours && (
                      <span className="text-xs text-slate-500">{pkg.duration_hours}h</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{pkg.description}</p>
                  {pkg.includes.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                          <Check size={11} className="text-brand-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => startEdit(pkg)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Edit2 size={14} className="text-slate-400" />
                  </button>
                  <button
                    onClick={() => deletePackage(pkg.id)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
