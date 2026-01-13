// Default to same-origin `/api` in production behind the reverse-proxy.
const API_URL = import.meta.env.VITE_API_URL || "/api";

export const fsaService = {
  async saveFSA(data) {
    const response = await fetch(`${API_URL}/fsa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Saving FSA Failed");
    }
    return result;
  },

  async getFSA(id) {
    const response = await fetch(`${API_URL}/fsa/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Fetching FSA Failed");
    }
    return result;
  },

  async updateFSA(id, data) {
    const response = await fetch(`${API_URL}/fsa/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Updating FSA Failed");
    }
    return result;
  },

  async deleteFSA(id) {
    const response = await fetch(`${API_URL}/fsa/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    // 204 no content in backend, but existing controllers still send JSON in some places.
    const text = await response.text();
    const result = text ? JSON.parse(text) : {};
    if (!response.ok) {
      throw new Error(result.message || "Deleting FSA Failed");
    }
    return result;
  },

  async getAllFSA(userId) {
    const url = userId ? `${API_URL}/fsa?userId=${userId}` : `${API_URL}/fsa`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Fetching FSA Failed");
    }
    return result;
  },
};


