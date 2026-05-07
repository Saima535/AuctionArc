"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import shared from "@/components/seller/SellerShared.module.css";
import { SparklesIcon, UploadIcon } from "@/components/seller/SellerIcons";
import { apiRequest } from "@/lib/api";

const categories = ["Electronics", "Vehicles", "Watches", "Collectibles", "Fashion", "Home", "Art", "Other"];

export default function SellerNewListingPage() {
  const router = useRouter();
  const [selectedImageText, setSelectedImageText] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitter = event.nativeEvent.submitter;
    const intent = submitter?.value || "draft";
    const formData = new FormData(form);
    const files = formData.getAll("images").filter((file) => file instanceof File && file.size > 0);

    setSubmitError("");
    setSubmitSuccess("");

    if (intent === "approval" && files.length < 1) {
      setSubmitError("Upload at least one image before submitting for approval.");
      return;
    }

    if (files.length > 3) {
      setSubmitError("You can upload a maximum of 3 images.");
      return;
    }

    if (!files.length) {
      formData.delete("images");
    }

    formData.set("status", intent === "approval" ? "Pending approval" : "Draft");
    formData.set("premiumHighlight", formData.get("premiumHighlight") ? "true" : "false");

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/auctions/listings", {
        method: "POST",
        body: formData,
      });

      setSubmitSuccess(result.message || "Listing saved successfully.");
      form.reset();
      setSelectedImageText("");

      window.setTimeout(() => {
        router.push("/seller/listings");
      }, 700);
    } catch (error) {
      setSubmitError(error.message || "Could not save the listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []);
    setSubmitError("");
    setSubmitSuccess("");

    if (files.length > 3) {
      event.target.value = "";
      setSelectedImageText("");
      setSubmitError("You can upload a maximum of 3 images.");
      return;
    }

    setSelectedImageText(files.length ? `${files.length} image${files.length === 1 ? "" : "s"} selected` : "");
  }

  function clearMessages() {
    setSubmitError("");
    setSubmitSuccess("");
  }

  return (
    <div className={shared.page}>
      <section className={shared.sectionHeader}>
        <div>
          <h1>Create New Listing</h1>
          <p>Build a polished auction listing for review and approval</p>
        </div>
      </section>

      <form className={`${shared.panel} ${shared.formPanel}`} onSubmit={handleSubmit}>
        <div className={shared.formSection}>
          <div className={shared.fieldGrid}>
            <div>
              <label className={shared.fieldLabel} htmlFor="listing-title">Product Title *</label>
              <div className={shared.inputWrap}>
                <input
                  id="listing-title"
                  name="title"
                  type="text"
                  placeholder="MacBook Pro 16 inch M3"
                  required
                  onChange={clearMessages}
                />
              </div>
            </div>
            <div>
              <label className={shared.fieldLabel} htmlFor="listing-category">Category *</label>
              <div className={shared.inputWrap}>
                <select id="listing-category" name="category" defaultValue="Electronics" required onChange={clearMessages}>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={shared.fieldLabel} htmlFor="listing-duration">Auction Duration *</label>
              <div className={shared.inputWrap}>
                <select id="listing-duration" name="auctionDurationDays" defaultValue="5" required onChange={clearMessages}>
                  <option value="3">3 Days</option>
                  <option value="5">5 Days</option>
                  <option value="7">7 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className={shared.formSection}>
          <label className={shared.fieldLabel} htmlFor="listing-description">Description</label>
          <textarea
            id="listing-description"
            name="description"
            className={shared.textarea}
            placeholder="Add the product details, provenance, included accessories, and any buyer notes."
            rows={5}
            onChange={clearMessages}
          />
        </div>

        <div className={shared.formSection}>
          <label className={shared.fieldLabel}>Upload Images (1 to 3 photos)</label>
          <label className={shared.uploadZone} htmlFor="listing-images">
            <div className={shared.uploadInner}>
              <UploadIcon />
              <div style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.72)" }}>Click to upload or drag and drop</div>
              <div style={{ marginTop: 12 }}>{selectedImageText || "PNG, JPG up to 5MB each. Maximum 3 photos."}</div>
            </div>
            <input
              id="listing-images"
              className={shared.fileInput}
              name="images"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              onChange={handleImageChange}
            />
          </label>
        </div>

        <div className={shared.formSection}>
          <label className={shared.fieldLabel}>Condition *</label>
          <div className={shared.radioGrid}>
            {["New", "Like New", "Good", "Fair"].map((item) => (
              <label key={item} className={shared.radioCard}>
                <input type="radio" name="condition" value={item} defaultChecked={item === "Good"} onChange={clearMessages} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={shared.formSection}>
          <div>
            <label className={shared.fieldLabel}>Starting Price *</label>
            <div className={shared.inputWrap}>
              <span>$</span>
              <input name="price" type="number" min="0" step="0.01" defaultValue="0.00" required onChange={clearMessages} />
            </div>
          </div>
        </div>

        <div className={shared.formSection}>
          <div className={shared.premiumBox}>
            <div className={shared.premiumHeader}>
              <SparklesIcon />
              <span>Premium Features</span>
            </div>
            <label className={shared.premiumOption}>
              <input type="checkbox" name="premiumHighlight" value="true" onChange={clearMessages} />
              <div>
                <strong>Highlight Listing ($9.99)</strong>
                <p>Make your listing stand out with premium highlighting</p>
              </div>
            </label>
          </div>
        </div>

        {submitError ? <p className={shared.errorText}>{submitError}</p> : null}
        {submitSuccess ? <p className={shared.successText}>{submitSuccess}</p> : null}

        <div className={shared.formActions}>
          <button type="submit" name="intent" value="approval" className={shared.primaryCta} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Submit for Approval"}
          </button>
          <button type="submit" name="intent" value="draft" className={shared.secondaryCta} disabled={isSubmitting}>
            Save Draft
          </button>
        </div>
      </form>
    </div>
  );
}
