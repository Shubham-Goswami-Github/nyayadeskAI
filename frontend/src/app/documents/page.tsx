
"use client";

import { useCallback, useEffect, useState } from "react";
import { caseAPI, documentAPI } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import {
  Upload,
  Download,
  Trash2,
  RotateCcw,
  RefreshCw,
  FileText,
  Loader2,
  Search,
} from "lucide-react";

type CaseRecord = {
  id: number;
  case_number: string;
  case_title: string;
};

type DocumentRecord = {
  id: number;
  case_id: number;
  document_title: string;
  document_type: string;
  original_filename: string;
  stored_filename?: string;
  file_size: number;
  description?: string;
  is_deleted: boolean;
  uploaded_at: string;
};

export default function DocumentsPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("Order");
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadCases = useCallback(async () => {
    try {
      const data = await caseAPI.getAll();
      setCases(data);

      if (data.length > 0) {
        setSelectedCase((previous) =>
          previous || String(data[0].id)
        );
      }
    } catch {
      setError("Unable to load cases.");
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!selectedCase) {
      setDocuments([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await documentAPI.getByCase(Number(selectedCase));
      setDocuments(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load documents."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCase]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCase || !file || !title.trim()) {
      alert("Please select a case, enter document title and choose a file.");
      return;
    }

    try {
      setUploading(true);

      await documentAPI.upload(
        Number(selectedCase),
        file,
        title.trim(),
        documentType
      );

      setTitle("");
      setFile(null);

      const fileInput = document.getElementById(
        "document-file"
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";

      await loadDocuments();
      alert("Document uploaded successfully.");
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Document upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      await documentAPI.delete(documentId);
      await loadDocuments();
      alert("Document moved to deleted records.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to delete document.");
    }
  };

  const handleRestore = async (documentId: number) => {
    try {
      await documentAPI.restore(documentId);
      await loadDocuments();
      alert("Document restored successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to restore document.");
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = [
      doc.document_title,
      doc.document_type,
      doc.original_filename,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesSearch && (showDeleted ? doc.is_deleted : !doc.is_deleted);
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return "—";
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <DashboardShell
      title="Document Management"
      subtitle="Upload and manage case-related legal documents."
    >
    <div className="min-h-screen bg-gray-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Document Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload and manage case-related legal documents.
            </p>
          </div>

          <button
            onClick={() => {
              loadCases();
              loadDocuments();
            }}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-5 flex items-center gap-2 font-semibold text-gray-900">
            <Upload size={19} className="text-green-800" />
            Upload New Document
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <label className="text-sm font-medium text-gray-700">
                Select Case *
                <select
                  required
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-700"
                >
                  <option value="">Select a case</option>
                  {cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.case_number} - {item.case_title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-gray-700">
                Document Title *
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter document title"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-700"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Document Type *
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-700"
                >
                  <option value="Order">Order</option>
                  <option value="Petition">Petition</option>
                  <option value="Notice">Notice</option>
                  <option value="Judgment">Judgment</option>
                  <option value="Evidence">Evidence</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="text-sm font-medium text-gray-700">
                Select Document * (PDF, DOC, DOCX)
                <input
                  id="document-file"
                  required
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-2 block w-full rounded-lg border border-gray-300 p-2 text-sm"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  Maximum file size: 20 MB
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || !cases.length}
              className="flex items-center gap-2 rounded-lg bg-green-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Upload size={17} />
              )}
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 p-5">
            <div>
              <h2 className="font-semibold text-gray-900">
                Case Documents
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Manage uploaded documents for the selected case.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select Case</option>
                {cases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.case_number}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowDeleted(false)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  !showDeleted
                    ? "bg-green-800 text-white"
                    : "border border-gray-300 text-gray-600"
                }`}
              >
                Active
              </button>

              <button
                onClick={() => setShowDeleted(true)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  showDeleted
                    ? "bg-green-800 text-white"
                    : "border border-gray-300 text-gray-600"
                }`}
              >
                Deleted
              </button>
            </div>
          </div>

          <div className="border-b border-gray-100 p-4">
            <div className="relative max-w-sm">
              <Search
                size={17}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
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
            <div className="flex justify-center gap-2 p-12 text-gray-500">
              <Loader2 size={19} className="animate-spin" />
              Loading documents...
            </div>
          ) : !selectedCase ? (
            <p className="p-12 text-center text-sm text-gray-500">
              Please select a case to view its documents.
            </p>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-700">
                No {showDeleted ? "deleted" : "active"} documents found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Upload a document or select another case.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Document</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">File Size</th>
                    <th className="px-5 py-4">Uploaded On</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="shrink-0 text-green-800" size={22} />
                          <div>
                            <p className="font-medium text-gray-900">
                              {doc.document_title}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {doc.original_filename}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {doc.document_type}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatSize(doc.file_size)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {doc.uploaded_at
                          ? new Date(doc.uploaded_at).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          {!showDeleted && (
                            <>
                              <button
                                onClick={() => documentAPI.download(doc.id)}
                                title="Download"
                                className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"
                              >
                                <Download size={17} />
                              </button>

                              <button
                                onClick={() => handleDelete(doc.id)}
                                title="Soft Delete"
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          )}

                          {showDeleted && (
                            <button
                              onClick={() => handleRestore(doc.id)}
                              title="Restore"
                              className="rounded-lg p-2 text-green-700 hover:bg-green-50"
                            >
                              <RotateCcw size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
    </DashboardShell>
  );
}
