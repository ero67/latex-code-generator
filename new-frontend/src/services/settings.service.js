import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const getPublicSettings = () => axios.get(`${API_URL}/settings/public`);

const getSettings = (token) =>
  axios.get(`${API_URL}/settings`, {
    headers: getAuthHeaders(token),
  });

const updateSettings = (token, payload) =>
  axios.patch(`${API_URL}/settings`, payload, {
    headers: getAuthHeaders(token),
  });

const SettingsService = {
  getPublicSettings,
  getSettings,
  updateSettings,
};

export default SettingsService;
