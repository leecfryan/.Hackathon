import React from "react";
import styles from "./Input.module.css";

const Input = ({
  placeholder,
  type = "text",
  value,
  onChange,
  className = "",
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`${styles.input} ${className}`}
    />
  );
};

export default Input;
