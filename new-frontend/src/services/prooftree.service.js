const API_URL = "http://localhost:3001/api";

export const proofTreeService = {
  async saveProofTree(data) {
    const response = await fetch(`${API_URL}/prooftree`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Saving Proof Tree Failed");
    }
    return result;
  },

  async getProofTree(id) {
    const response = await fetch(`${API_URL}/prooftree/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Fetching Proof Tree Failed");
    }
    return result;
  },

  async updateProofTree(id, proofTreeData) {
    const response = await fetch(`${API_URL}/prooftree/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proofTreeData),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Updating Proof Tree Failed");
    }
    return result;
  },

  async deleteProofTree(id) {
    const response = await fetch(`${API_URL}/prooftree/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Deleting Proof Tree Failed");
    }
    return result;
  },

  async getAllProofTrees(userId) {
    const url = userId
      ? `${API_URL}/prooftree?userId=${userId}`
      : `${API_URL}/prooftree`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Fetching Proof Trees Failed");
    }
    return result;
  },
};
