import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "Password must contain at least one letter and one number"
    )
    .required("Password is required"),
});

const RegisterForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const initialValues = {
    email: "",
    name: "",
    password: "",
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      console.log("Submitting data:", values);
      const response = await authService.register(values);
      console.log("Registration response:", response);
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="max-w-md mx-auto mt-8 p-4 border rounded shadow-md">
          <div className="mb-4">
            <label className="block text-gray-700">Email:</label>
            <Field
              type="email"
              name="email"
              className="w-full px-3 py-2 border rounded"
            />
            <ErrorMessage
              name="email"
              component="p"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Name:</label>
            <Field
              type="text"
              name="name"
              className="w-full px-3 py-2 border rounded"
            />
            <ErrorMessage
              name="name"
              component="p"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Password:</label>
            <Field
              type="password"
              name="password"
              className="w-full px-3 py-2 border rounded"
            />
            <ErrorMessage
              name="password"
              component="p"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default RegisterForm;
