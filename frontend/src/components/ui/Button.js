import React from "react";
import styles from "./Button.module.css";

const Button = ({
  children,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
}) => {
  const getButtonClass = () => {
    const baseClass = styles.button;
    const variantClass = styles[variant] || styles.primary;
    return `${baseClass} ${variantClass} ${className}`;
  };

  return (
    <button type={type} onClick={onClick} className={getButtonClass()}>
      {children}
    </button>
  );
};

export default Button;
