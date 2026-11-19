
"use client";

import { useCallback, useEffect, useState } from "react";
import { activityAPI, caseAPI } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  Loader2,
  ClipboardList,
} from "lucide-react";

type CaseRecord = {
  id: number;
  case_number: string;
  case_title: string;
};

type ActivityRecord = {
  id: number;
  case_id: number;
  activity_type: string;
  title: string;
  description?: string;
  activity_date: string;
  next_hearing_date?: string | null;
  is_deleted?: boolean;
};

const emptyForm = {
  activity_type: "Hearing",
  title: "",
  description: "",
  activity_date: "",
  next_hearing_date: "",
};

export default function ActivitiesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [form, setForm] = useState(emptyForm);

  const [modal, setModal] = useState(false);
  const [editingActivity, setEditingActivity] =
    useState<ActivityRecord | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCases = useCallback(async () => {
    try {
      const data = await caseAPI.getAll();
      setCases(data);

      if (data.length > 0) {
        setSelectedCase((previous) => previous || String(data[0].id));
      }
    } catch {
      setError("Unable to load cases.");
    }
  }, []);

  const loadActivities = useCallback(async () => {
    if (!selectedCase) {
      setActivities([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await activityAPI.getByCase(Number(selectedCase));
      setActivities(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load activities."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCase]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const openCreate = () => {
    setEditingActivity(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (item: ActivityRecord) => {
    setEditingActivity(item);

    setForm({
      activity_type: item.activity_type || "Hearing",
      title: item.title || "",
      description: item.description || "",
      activity_date: item.activity_date || "",
      next_hearing_date: item.next_hearing_date || "",
    });

    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        activity_type: form.activity_type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        activity_date: form.activity_date,
        next_hearing_date: form.next_hearing_date || null,
      };

      if (editingActivity) {
        await activityAPI.update(editingActivity.id, payload);
      } else {
        await activityAPI.create(Number(selectedCase), payload);
      }

      setModal(false);
      await loadActivities();

      alert(
        editingActivity
          ? "Activity updated successfully."
          : "Activity created successfully."
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to save activity.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (activityId: number) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    try {
      await activityAPI.delete(activityId);
      await loadActivities();
      alert("Activity deleted successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to delete activity.");
    }
  };

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const inputClass =
    "mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100";

  return (
    <DashboardShell
      title="Case Activity Management"
      subtitle="Record case proceedings, actions and hearing schedules."
    >
    <div className="min-h-screen bg-gray-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Case Activity Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Record case proceedings, actions and hearing schedules.
            </p>
          </div>

          <button
            onClick={loadActivities}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <label className="block text-sm font-medium text-gray-700">
            Select Case
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="mt-2 w-full max-w-xl rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-700"
            >
              <option value="">Select a case</option>
              {cases.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.case_number} - {item.case_title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5">
            <div>
              <h2 className="font-semibold text-gray-900">
                Activity Records
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {activities.length} activities
              </p>
            </div>

            <button
              onClick={openCreate}
              disabled={!selectedCase}
              className="flex items-center gap-2 rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
            >
              <Plus size={17} />
              Add Activity
            </button>
          </div>

          {error && (
            <div className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center gap-2 p-12 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              Loading activities...
            </div>
          ) : !selectedCase ? (
            <p className="p-12 text-center text-sm text-gray-500">
              Please select a case.
            </p>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList size={34} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-700">
                No activities found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Add the first activity for this case.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start"
                >
                  <div className="flex gap-4">
                    <div className="rounded-xl bg-green-50 p-3 text-green-800">
                      <CalendarDays size={22} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {item.title}
                        </h3>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {item.activity_type}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {item.description || "No description provided."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>
                          Activity Date: {item.activity_date || "—"}
                        </span>

                        <span>
                          Next Hearing: {item.next_hearing_date || "Not scheduled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      title="Edit Activity"
                      className="rounded-lg p-2 text-green-700 hover:bg-green-50"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Delete Activity"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
            <div className="my-auto w-full max-w-2xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 p-5">
                <div>
                  <h2 className="font-bold text-gray-900">
                    {editingActivity ? "Update Activity" : "Create Activity"}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter case activity details.
                  </p>
                </div>

                <button
                  onClick={() => setModal(false)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                <label className="block text-sm font-medium text-gray-700">
                  Activity Type *
                  <select
                    required
                    value={form.activity_type}
                    onChange={(e) => updateField("activity_type", e.target.value)}
                    className={inputClass}
                  >
                    <option value="Hearing">Hearing</option>
                    <option value="Order">Order</option>
                    <option value="Notice">Notice</option>
                    <option value="Submission">Submission</option>
                    <option value="Review">Review</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Activity Title *
                  <input
                    required
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Enter activity title"
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Description
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      updateField("description", e.target.value)
                    }
                    placeholder="Enter activity details"
                    className={inputClass}
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">
                    Activity Date *
                    <input
                      required
                      type="date"
                      value={form.activity_date}
                      onChange={(e) => updateField("activity_date", e.target.value)}
                      className={inputClass}
                    />
                  </label>

                  <label className="text-sm font-medium text-gray-700">
                    Next Hearing Date
                    <input
                      type="date"
                      value={form.next_hearing_date}
                      onChange={(e) =>
                        updateField("next_hearing_date", e.target.value)
                      }
                      className={inputClass}
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setModal(false)}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-green-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {saving ? "Saving..." : editingActivity ? "Update Activity" : "Create Activity"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardShell>
  );
}
