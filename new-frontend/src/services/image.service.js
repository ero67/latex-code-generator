import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const uploadImage = (file, structureType, model) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("structureType", structureType);
  if (model) {
    formData.append("model", model);
  }

  return axios.post(`${API_URL}/imagetolatex/generate`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

const ImageService = {
  uploadImage,
};

export default ImageService;
