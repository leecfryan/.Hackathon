import React, { useState } from "react";
import AuthLayout from "../components/auth/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <AuthLayout>
      {isLogin ? (
        <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </AuthLayout>
  );
};

export default LoginPage;
