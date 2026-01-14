// Default to same-origin `/api` in production behind the reverse-proxy.
const API_URL = import.meta.env.VITE_API_URL || "/api";

export const resolutionTreeService = {
  async saveResolutionTree(data) {
    const response = await fetch(`${API_URL}/resolutiontree`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Saving Resolution Tree Failed");
    }
    return result;
  },

  async getResolutionTree(id) {
    const response = await fetch(`${API_URL}/resolutiontree/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Fetching Resolution Tree Failed");
    }
    return result;
  },

  async updateResolutionTree(id, data) {
    const response = await fetch(`${API_URL}/resolutiontree/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Updating Resolution Tree Failed");
    }
    return result;
  },

  async deleteResolutionTree(id) {
    const response = await fetch(`${API_URL}/resolutiontree/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const text = await response.text();
    const result = text ? JSON.parse(text) : {};
    if (!response.ok) {
      throw new Error(result.message || "Deleting Resolution Tree Failed");
    }
    return result;
  },

  async getAllResolutionTrees(userId) {
    const url = userId
      ? `${API_URL}/resolutiontree?userId=${userId}`
      : `${API_URL}/resolutiontree`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Fetching Resolution Trees Failed");
    }
    return result;
  },
};

