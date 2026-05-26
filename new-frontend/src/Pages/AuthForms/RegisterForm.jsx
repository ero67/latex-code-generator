import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";

const RegisterForm = () => {
  const { t } = useTranslation();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t('auth.invalid_email'))
      .required(t('auth.email_required')),
    name: Yup.string()
      .min(2, t('auth.name_min'))
      .required(t('auth.name_required')),
    password: Yup.string()
      .min(6, t('auth.password_min'))
      .matches(
        /^(?=.*[A-Za-z])(?=.*\d)/,
        t('auth.password_pattern')
      )
      .required(t('auth.password_required')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], t('auth.passwords_match'))
      .required(t('auth.confirm_required')),
  });
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues = {
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      console.log("Submitting data:", values);
      // Remove confirmPassword from the data sent to the server
      const { confirmPassword, ...registrationData } = values;
      const response = await authService.register(registrationData);
      console.log("Registration response:", response);
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || t('auth.registration_failed'));
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
        <Form className="max-w-md mx-auto mt-8 p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {t('auth.create_account')}
          </h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.name')}
            </label>
            <Field
              id="name"
              type="text"
              name="name"
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <ErrorMessage
              name="name"
              component="p"
              className="text-red-500 text-xs italic mt-1"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.email')}
            </label>
            <Field
              id="email"
              type="email"
              name="email"
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <ErrorMessage
              name="email"
              component="p"
              className="text-red-500 text-xs italic mt-1"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.password')}
            </label>
            <div className="relative">
              <Field
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600"
              >
                {showPassword ? t('auth.hide') : t('auth.show')}
              </button>
            </div>
            <ErrorMessage
              name="password"
              component="p"
              className="text-red-500 text-xs italic mt-1"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.confirm_password')}
            </label>
            <div className="relative">
              <Field
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600"
              >
                {showConfirmPassword ? t('auth.hide') : t('auth.show')}
              </button>
            </div>
            <ErrorMessage
              name="confirmPassword"
              component="p"
              className="text-red-500 text-xs italic mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? t('auth.registering') : t('auth.register')}
            </button>
          </div>
          <p className="text-center text-gray-600 text-sm mt-6">
            {t('auth.has_account')}{" "}
            <Link
              to="/login"
              className="font-bold text-blue-500 hover:text-blue-800"
            >
              {t('auth.log_in')}
            </Link>
          </p>
        </Form>
      )}
    </Formik>
  );
};

export default RegisterForm;
