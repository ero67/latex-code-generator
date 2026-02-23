import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAvailableModels = () => {
  const token = localStorage.getItem("token");
  return axios.get(`${API_URL}/models`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

const getAllModels = (token) =>
  axios.get(`${API_URL}/models/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const createModel = (token, payload) =>
  axios.post(`${API_URL}/models`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const updateModel = (token, id, payload) =>
  axios.patch(`${API_URL}/models/${id}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const ModelService = {
  getAvailableModels,
  getAllModels,
  createModel,
  updateModel,
};

export default ModelService;
