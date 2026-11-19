
"use client";

import { useCallback, useEffect, useState } from "react";
import { caseAPI } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";

type CaseRecord = {
  id: number;
  case_number: string;
  case_title: string;
  case_type: string;
  case_category: string;
  court_name: string;
  petitioner: string;
  respondent: string;
  filing_date: string;
  status: string;
  description?: string;
};

const emptyForm = {
  case_number: "",
  case_title: "",
  case_type: "",
  case_category: "",
  court_name: "",
  petitioner: "",
  respondent: "",
  filing_date: "",
  status: "Pending",
  description: "",
};

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await caseAPI.getAll();
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load cases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const filteredCases = cases.filter((item) =>
    [
      item.case_number,
      item.case_title,
      item.petitioner,
      item.respondent,
      item.court_name,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const openCreate = () => {
    setSelectedCase(null);
    setForm(emptyForm);
    setModal("create");
  };

  const openEdit = (item: CaseRecord) => {
    setSelectedCase(item);
    setForm({
      case_number: item.case_number || "",
      case_title: item.case_title || "",
      case_type: item.case_type || "",
      case_category: item.case_category || "",
      court_name: item.court_name || "",
      petitioner: item.petitioner || "",
      respondent: item.respondent || "",
      filing_date: item.filing_date || "",
      status: item.status || "Pending",
      description: item.description || "",
    });
    setModal("edit");
  };

  const openView = (item: CaseRecord) => {
    setSelectedCase(item);
    setModal("view");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      if (modal === "create") {
        await caseAPI.create(form);
      } else if (modal === "edit" && selectedCase) {
        await caseAPI.update(selectedCase.id, form);
      }

      setModal(null);
      await loadCases();
      alert(modal === "create" ? "Case created successfully." : "Case updated successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to save case.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: CaseRecord) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete case ${item.case_number}?`
    );

    if (!confirmed) return;

    try {
      await caseAPI.delete(item.id);
      await loadCases();
      alert("Case deleted successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to delete case.");
    }
  };

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100";

  return (
    <DashboardShell
      title="Case Management"
      subtitle="Manage departmental legal cases and their records."
    >
    <div className="min-h-screen bg-gray-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Case Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage departmental legal cases and their records.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadCases}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-900"
            >
              <Plus size={17} />
              Create Case
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Cases</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{cases.length}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Pending Cases</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {cases.filter((item) => item.status === "Pending").length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Disposed Cases</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {cases.filter((item) => item.status === "Disposed").length}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5">
            <div>
              <h2 className="font-semibold text-gray-900">Registered Cases</h2>
              <p className="mt-1 text-xs text-gray-500">
                {filteredCases.length} records found
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search
                size={17}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-700"
              />
            </div>
          </div>

          {error && (
            <div className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-gray-500">
              <Loader2 className="animate-spin" size={20} />
              Loading cases...
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-medium text-gray-700">No cases found</p>
              <p className="mt-1 text-sm text-gray-500">
                {search ? "Try another search term." : "Create your first case to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Case Number</th>
                    <th className="px-5 py-4">Case Title</th>
                    <th className="px-5 py-4">Petitioner / Respondent</th>
                    <th className="px-5 py-4">Filing Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredCases.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-green-800">
                        {item.case_number}
                      </td>

                      <td className="min-w-52 px-5 py-4">
                        <p className="font-medium text-gray-900">{item.case_title}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.case_type}</p>
                      </td>

                      <td className="min-w-52 px-5 py-4">
                        <p className="text-gray-800">{item.petitioner}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          vs. {item.respondent}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {item.filing_date || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openView(item)}
                            title="View"
                            className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            onClick={() => openEdit(item)}
                            title="Edit"
                            className="rounded-lg p-2 text-green-700 hover:bg-green-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            title="Delete"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
            <div className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {modal === "create"
                      ? "Create New Case"
                      : modal === "edit"
                      ? "Update Case"
                      : "Case Details"}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {modal === "view"
                      ? selectedCase?.case_number
                      : "Enter the required case information."}
                  </p>
                </div>

                <button
                  onClick={() => setModal(null)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              {modal === "view" && selectedCase ? (
                <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                  {Object.entries({
                    "Case Number": selectedCase.case_number,
                    "Case Title": selectedCase.case_title,
                    "Case Type": selectedCase.case_type,
                    "Category": selectedCase.case_category,
                    "Court": selectedCase.court_name,
                    "Petitioner": selectedCase.petitioner,
                    "Respondent": selectedCase.respondent,
                    "Filing Date": selectedCase.filing_date,
                    "Status": selectedCase.status,
                    "Description": selectedCase.description || "—",
                  }).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
                      <p className="mt-1 break-words text-sm text-gray-900">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-gray-700">
                      Case Number *
                      <input
                        required
                        value={form.case_number}
                        onChange={(e) => updateField("case_number", e.target.value)}
                        className={`${inputClass} mt-2`}
                        placeholder="e.g. NYD-2026-002"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Case Title *
                      <input
                        required
                        value={form.case_title}
                        onChange={(e) => updateField("case_title", e.target.value)}
                        className={`${inputClass} mt-2`}
                        placeholder="Enter case title"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Case Type *
                      <input
                        required
                        value={form.case_type}
                        onChange={(e) => updateField("case_type", e.target.value)}
                        className={`${inputClass} mt-2`}
                        placeholder="e.g. Civil"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Case Category
                      <input
                        value={form.case_category}
                        onChange={(e) => updateField("case_category", e.target.value)}
                        className={`${inputClass} mt-2`}
                        placeholder="Enter category"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Court Name
                      <input
                        value={form.court_name}
                        onChange={(e) => updateField("court_name", e.target.value)}
                        className={`${inputClass} mt-2`}
                        placeholder="Enter court name"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Filing Date *
                      <input
                        required
                        type="date"
                        value={form.filing_date}
                        onChange={(e) => updateField("filing_date", e.target.value)}
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Petitioner *
                      <input
                        required
                        value={form.petitioner}
                        onChange={(e) => updateField("petitioner", e.target.value)}
                        className={`${inputClass} mt-2`}
                        placeholder="Enter petitioner"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Respondent *
                      <input
                        required
                        value={form.respondent}
                        onChange={(e) => updateField("respondent", e.target.value)}
                        className={`${inputClass} mt-2`}
                        placeholder="Enter respondent"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                      Case Status *
                      <select
                        required
                        value={form.status}
                        onChange={(e) => updateField("status", e.target.value)}
                        className={`${inputClass} mt-2`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Disposed">Disposed</option>
                      </select>
                    </label>

                    <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                      Description
                      <textarea
                        rows={4}
                        value={form.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        className={`${inputClass} mt-2`}
                        placeholder="Enter case description"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-green-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
                    >
                      {saving && <Loader2 size={16} className="animate-spin" />}
                      {saving ? "Saving..." : modal === "create" ? "Create Case" : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardShell>
  );
}
