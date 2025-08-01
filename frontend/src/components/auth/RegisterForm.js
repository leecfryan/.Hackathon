import React, { useState } from "react";
import styles from "../../pages/LoginPage.module.css";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    gender: "",
    faculty: "",
    year: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle registration logic here
    console.log("Register:", formData);
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className={styles.form}>
      <div className={styles.tabContainer}>
        <div className={styles.tabButtonActive}>Register</div>
        <button onClick={onSwitchToLogin} className={styles.tabButton}>
          Login
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.content}>
          <div className={styles.fieldRow}>
            <span className={styles.label}>I am</span>
            <div className={styles.genderButtons}>
              <button
                type="button"
                onClick={() => updateFormData("gender", "female")}
                className={
                  formData.gender === "female"
                    ? styles.genderButtonActive
                    : styles.genderButton
                }
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => updateFormData("gender", "male")}
                className={
                  formData.gender === "male"
                    ? styles.genderButtonActive
                    : styles.genderButton
                }
              >
                Male
              </button>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.label}>Faculty</span>
            <select
              value={formData.faculty}
              onChange={(e) => updateFormData("faculty", e.target.value)}
              className={styles.select}
              required
            >
              <option value="">Click to select</option>
              <option value="engineering">Engineering</option>
              <option value="business">Business</option>
              <option value="arts">Arts</option>
              <option value="science">Science</option>
              <option value="medicine">Medicine</option>
              <option value="law">Law</option>
            </select>
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.label}>Year</span>
            <select
              value={formData.year}
              onChange={(e) => updateFormData("year", e.target.value)}
              className={styles.select}
              required
            >
              <option value="">Click to select</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
              <option value="graduate">Graduate</option>
            </select>
          </div>

          <div className={styles.field}>
            <Input
              type="email"
              placeholder="Enter your email address here"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              required
            />
          </div>

          <div className={styles.submitContainer}>
            <Button type="submit">Register</Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default RegisterForm;
