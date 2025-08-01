import React, { useState } from "react";
import styles from "../../pages/LoginPage.module.css";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

const LoginForm = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login:", { email, password });
  };

  return (
    <Card className={styles.form}>
      <div className={styles.tabContainer}>
        <button onClick={onSwitchToRegister} className={styles.tabButton}>
          Register
        </button>
        <div className={styles.tabButtonActive}>Login</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.content}>
          <div>
            <h2 className={styles.title}>Welcome back</h2>
            <p className={styles.subtitle}>Sign in to find your lunch buddy</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <Input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.submitContainer}>
            <Button type="submit">Login</Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default LoginForm;
