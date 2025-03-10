const API_URL = "http://localhost:3001/api";

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
};
