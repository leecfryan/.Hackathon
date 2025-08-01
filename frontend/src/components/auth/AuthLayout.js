import React from "react";
import styles from "./AuthLayout.module.css";
import Card from "../ui/Card";

const AuthLayout = ({ children }) => {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Card>
            <div className={styles.logo}>Logo</div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.main}>{children}</div>
    </div>
  );
};

export default AuthLayout;
