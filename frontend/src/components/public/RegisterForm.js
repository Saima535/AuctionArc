"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/public/PublicPage.module.css";
import { registerUser } from "@/lib/auth-actions";

// Keep name validation aligned with the backend so the user gets immediate
// feedback before the request is submitted.
function isValidName(value) {
  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  return /^[A-Za-z][A-Za-z\s.'-]*$/.test(normalized) && !/\d/.test(normalized);
}

export function RegisterForm() {
  const router = useRouter();
  // Birthdate is managed separately because the UI is split into day/month/year
  // selectors while the backend expects a single YYYY-MM-DD field.
  const [birthdateError, setBirthdateError] = useState("");
  const [birthdateValue, setBirthdateValue] = useState("");
  // Name validation is surfaced inline so users understand why numeric input is rejected.
  const [nameError, setNameError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  // The selected image name is shown as a lightweight confirmation of the chosen file.
  const [selectedImageName, setSelectedImageName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date();
  const dayOptions = Array.from({ length: 31 }, (_, index) => index + 1);
  const monthOptions = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ];
  const yearOptions = Array.from(
    { length: 83 },
    (_, index) => today.getFullYear() - 18 - index,
  );

  function buildBirthdate(day, month, year) {
    if (!day || !month || !year) {
      return "";
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isValidBirthdate(day, month, year) {
    if (!day || !month || !year) {
      return false;
    }

    const birthdate = buildBirthdate(day, month, year);
    const parsed = new Date(birthdate);

    return (
      parsed instanceof Date &&
      !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === Number(year) &&
      parsed.getMonth() + 1 === Number(month) &&
      parsed.getDate() === Number(day)
    );
  }

  function calculateAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // FormData is sent directly because registration includes an uploaded image.
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const birthdate = formData.get("birthdate");
    const role = formData.get("role");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    const profilePicture = formData.get("profilePicture");
    const nameValue = typeof name === "string" ? name : "";
    const birthdateValue = typeof birthdate === "string" ? birthdate : "";
    setNameError("");
    setSubmitError("");
    setSubmitSuccess("");

    if (!isValidName(nameValue)) {
      setNameError("Full name can contain letters, spaces, apostrophes, periods, and hyphens only.");
      return;
    }

    if (!(profilePicture instanceof File) || profilePicture.size === 0) {
      setSubmitError("Profile picture is required.");
      return;
    }

    if (!birthdateValue) {
      setBirthdateError("Birthdate is required. Only users aged 18 or older can register.");
      return;
    }

    const [year, month, day] = birthdateValue.split("-");

    if (!isValidBirthdate(day, month, year)) {
      setBirthdateError("Please select a valid birthdate.");
      return;
    }

    if (calculateAge(birthdateValue) < 18) {
      setBirthdateError("You must be at least 18 years old to create an AuctionArc account.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Password and confirm password must match.");
      return;
    }

    setBirthdateError("");
    setIsSubmitting(true);

    try {
      const result = await registerUser(formData);

      setSubmitSuccess("Account created successfully. Redirecting...");
      router.push(result.destination || (role === "Seller" ? "/seller" : "/bidder/auctions"));
    } catch (error) {
      setSubmitError(error.message || "Could not connect to the backend. Please make sure the backend server is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBirthdateChange(event) {
    const form = event.target.form;
    const day = form?.birthdateDay?.value || "";
    const month = form?.birthdateMonth?.value || "";
    const year = form?.birthdateYear?.value || "";
    const value = buildBirthdate(day, month, year);

    setBirthdateValue(value);

    if (!value) {
      setBirthdateError("");
      return;
    }

    if (!isValidBirthdate(day, month, year)) {
      setBirthdateError("Please select a valid birthdate.");
      return;
    }

    if (calculateAge(value) < 18) {
      setBirthdateError("You must be at least 18 years old to create an AuctionArc account.");
      return;
    }

    setBirthdateError("");
  }

  function handleNameChange(event) {
    const sanitizedValue = event.target.value.replace(/[0-9]/g, "");

    if (sanitizedValue !== event.target.value) {
      event.target.value = sanitizedValue;
    }

    if (!sanitizedValue.trim()) {
      setNameError("");
      handleFieldChange();
      return;
    }

    if (!isValidName(sanitizedValue)) {
      setNameError("Full name can contain letters, spaces, apostrophes, periods, and hyphens only.");
    } else {
      setNameError("");
    }

    handleFieldChange();
  }

  function handleProfilePictureChange(event) {
    const file = event.target.files?.[0];
    setSelectedImageName(file ? file.name : "");
    setSubmitSuccess("");

    if (!file) {
      setSubmitError("Profile picture is required.");
      return;
    }

    setSubmitError("");
  }

  function handleFieldChange() {
    setSubmitError("");
    setSubmitSuccess("");
  }

  function handleContactChange(event) {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 15);
    handleFieldChange();
  }

  function handleNidChange(event) {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 30);
    handleFieldChange();
  }

  return (
    // The form is intentionally grouped by identity, eligibility, contact,
    // media, and credential fields so validation remains easy to follow.
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            required
            inputMode="text"
            onChange={handleNameChange}
          />
          {nameError ? <p className={styles.errorText}>{nameError}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            onChange={handleFieldChange}
          />
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="register-role">Account role</label>
          <select id="register-role" name="role" defaultValue="Bidder" onChange={handleFieldChange}>
            <option>Seller</option>
            <option value="Bidder">Buyer</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="register-gender">Gender</label>
          <select
            id="register-gender"
            name="gender"
            defaultValue=""
            required
            onChange={handleFieldChange}
          >
            <option value="" disabled>
              Select gender
            </option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="register-nid">NID</label>
          <input
            id="register-nid"
            name="nid"
            type="text"
            placeholder="Enter NID number"
            required
            inputMode="numeric"
            pattern="[0-9]{5,30}"
            maxLength={30}
            onChange={handleNidChange}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="register-birthdate-day">Birthdate</label>
          <div className={styles.birthdateRow}>
            <select
              id="register-birthdate-day"
              name="birthdateDay"
              defaultValue=""
              required
              onChange={handleBirthdateChange}
            >
              <option value="" disabled>
                Day
              </option>
              {dayOptions.map((day) => (
                <option key={day} value={String(day).padStart(2, "0")}>
                  {day}
                </option>
              ))}
            </select>
            <select
              id="register-birthdate-month"
              name="birthdateMonth"
              defaultValue=""
              required
              onChange={handleBirthdateChange}
            >
              <option value="" disabled>
                Month
              </option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              id="register-birthdate-year"
              name="birthdateYear"
              defaultValue=""
              required
              onChange={handleBirthdateChange}
            >
              <option value="" disabled>
                Year
              </option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <input type="hidden" name="birthdate" value={birthdateValue} />
          {birthdateError ? <p className={styles.errorText}>{birthdateError}</p> : null}
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="register-country">Country</label>
          <select
            id="register-country"
            name="country"
            defaultValue=""
            required
            onChange={handleFieldChange}
          >
            <option value="" disabled>
              Select country
            </option>
            <option>Bangladesh</option>
            <option>India</option>
            <option>Pakistan</option>
            <option>Nepal</option>
            <option>Sri Lanka</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Canada</option>
            <option>Australia</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="register-contact">Contact</label>
          <input
            id="register-contact"
            name="contact"
            type="tel"
            placeholder="Enter phone number"
            required
            inputMode="numeric"
            pattern="[0-9]{7,15}"
            maxLength={15}
            onChange={handleContactChange}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="register-profile-picture">Profile picture</label>
        <input
          id="register-profile-picture"
          name="profilePicture"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          onChange={handleProfilePictureChange}
        />
        <p className={styles.helperText}>
          Upload a JPG, PNG, or WEBP image. This is required for registration.
          {selectedImageName ? ` Selected file: ${selectedImageName}` : ""}
        </p>
      </div>

      <div className={styles.field}>
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          placeholder="Create a strong password"
          required
          minLength={8}
          onChange={handleFieldChange}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="register-confirm-password">Confirm password</label>
        <input
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          required
          minLength={8}
          onChange={handleFieldChange}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="register-human-verification">Human verification</label>
        <input
          id="register-human-verification"
          name="humanVerification"
          type="text"
          placeholder="Type: I am human"
          required
          onChange={handleFieldChange}
        />
      </div>

      {submitError ? <p className={styles.errorText}>{submitError}</p> : null}
      {submitSuccess ? <p className={styles.successText}>{submitSuccess}</p> : null}

      <div className={styles.buttonRow}>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
        <Link href="/login" className={styles.secondaryButton}>
          Already have an account?
        </Link>
      </div>
    </form>
  );
}
