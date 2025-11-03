import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const uploadImage = (file, structureType) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("structureType", structureType);

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
