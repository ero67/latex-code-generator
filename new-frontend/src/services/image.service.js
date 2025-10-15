import axios from "axios";

const API_URL = "http://localhost:3001/api/imagetolatex";

const uploadImage = (file, structureType) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("structureType", structureType);

  return axios.post(`${API_URL}/generate`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

const ImageService = {
  uploadImage,
};

export default ImageService;
