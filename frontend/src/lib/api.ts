
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ---------------- CASE MANAGEMENT ----------------

export const caseAPI = {
  getAll: () => request<any[]>("/api/v1/cases/"),

  getById: (caseId: number) =>
    request<any>(`/api/v1/cases/${caseId}`),

  create: (data: any) =>
    request<any>("/api/v1/cases/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  update: (caseId: number, data: any) =>
    request<any>(`/api/v1/cases/${caseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  delete: (caseId: number) =>
    request<any>(`/api/v1/cases/${caseId}`, {
      method: "DELETE",
    }),
};

// ---------------- DOCUMENT MANAGEMENT ----------------

export const documentAPI = {
  upload: (caseId: number, file: File, title: string, type: string) => {
    const formData = new FormData();

    formData.append("case_id", String(caseId));
    formData.append("document_title", title);
    formData.append("document_type", type);
    formData.append("file", file);

    return request<any>("/api/v1/documents/upload", {
      method: "POST",
      body: formData,
    });
  },

  getByCase: (caseId: number) =>
    request<any[]>(`/api/v1/documents/case/${caseId}`),

  download: async (documentId: number) => {
    const response = await fetch(
      `${API_BASE}/api/v1/documents/${documentId}/download`
    );

    if (!response.ok) {
      throw new Error("Unable to download document.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `document-${documentId}`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  },

  delete: (documentId: number) =>
    request<any>(`/api/v1/documents/${documentId}`, {
      method: "DELETE",
    }),

  restore: (documentId: number) =>
    request<any>(`/api/v1/documents/${documentId}/restore`, {
      method: "POST",
    }),
};

// ---------------- CASE ACTIVITY MANAGEMENT ----------------

export const activityAPI = {
  create: (caseId: number, data: any) =>
    request<any>(`/api/v1/activities/case/${caseId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  getByCase: (caseId: number) =>
    request<any[]>(`/api/v1/activities/case/${caseId}`),

  update: (activityId: number, data: any) =>
    request<any>(`/api/v1/activities/${activityId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  delete: (activityId: number) =>
    request<any>(`/api/v1/activities/${activityId}`, {
      method: "DELETE",
    }),
};

// ---------------- HEARING CALENDAR ----------------

export const hearingAPI = {
  getUpcoming: (days = 30) =>
    request<any[]>(`/api/v1/hearings/upcoming?days=${days}`),
};

// ---------------- DASHBOARD ----------------

export const dashboardAPI = {
  getStatistics: () =>
    request<any>("/api/v1/dashboard/statistics"),
};


// ---------------- AI ASSISTANT ----------------

export const aiAPI = {
  chat: (message: string) =>
    request<{ response: string; model: string }>("/api/v1/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }),

  chatAboutCase: (caseId: number, message: string) =>
    request<{ response: string; model: string }>(
      `/api/v1/ai/chat/case/${caseId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      }
    ),
};
