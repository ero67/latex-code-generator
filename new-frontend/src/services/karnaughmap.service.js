const API_URL = import.meta.env.VITE_API_URL;

export const karnaughMapService = {
  async saveKM(data) {
    const response = await fetch(`${API_URL}/karnaughmap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Saving KM Failed");
    }
    return result;
  },

  async getKM(id) {
    const response = await fetch(`${API_URL}/karnaughmap/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Fetching KM Failed");
    }
    return result;
  },

  async updateKM(id, karnaughMapData) {
    const response = await fetch(`${API_URL}/karnaughmap/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(karnaughMapData),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Updating KM Failed");
    }
    return result;
  },
};
