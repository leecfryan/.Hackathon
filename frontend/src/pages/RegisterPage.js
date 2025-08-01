import React, { useState } from "react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { RegisterForm } from "../components/auth/RegisterForm";

export const RegisterPage = ({ onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleRegister = async (credentials) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual MySQL backend call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock response - replace with actual API response
      const response = {
        success: true,
        message: "Account created successfully",
        user: {
          id: Date.now(), // Mock ID
          email: credentials.email,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          createdAt: new Date().toISOString(),
        },
        token: "mock-jwt-token",
      };

      if (response.success) {
        // Store token and user data
        localStorage.setItem("authToken", response.token || "");
        localStorage.setItem("user", JSON.stringify(response.user));

        // Show success message
        alert("Account created successfully! Welcome to SecureAuth.");
      } else {
        alert(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join us today and get started in minutes"
    >
      <RegisterForm onSubmit={handleRegister} loading={loading} />

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>

      {/* Social Registration Options */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="ml-2">Google</span>
          </button>

          <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="ml-2">Facebook</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
