import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getStatus = () =>
  axios.get(`${API_URL}/byok`, {
    headers: getAuthHeaders(),
  });

const saveKey = (apiKey) =>
  axios.put(
    `${API_URL}/byok`,
    { apiKey },
    {
      headers: getAuthHeaders(),
    }
  );

const deleteKey = () =>
  axios.delete(`${API_URL}/byok`, {
    headers: getAuthHeaders(),
  });

const ByokService = {
  getStatus,
  saveKey,
  deleteKey,
};

export default ByokService;
