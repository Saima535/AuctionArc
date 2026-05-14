"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import shared from "@/components/seller/SellerShared.module.css";
import {
  CloseIcon,
  PlusIcon,
  UploadIcon,
} from "@/components/seller/SellerIcons";
import { apiRequest } from "@/lib/api";

const categories = [
  "Electronics",
  "Vehicles",
  "Watches",
  "Collectibles",
  "Fashion",
  "Home",
  "Art",
  "Other",
];

const deliveryOptions = ["AuctionArc Delivery"];
const durationOptions = [
  { value: "1", unit: "minute", label: "1 Minute" },
  { value: "2", unit: "minute", label: "2 Minutes" },
  { value: "3", unit: "minute", label: "3 Minutes" },
  { value: "3", unit: "day", label: "3 Days" },
  { value: "5", unit: "day", label: "5 Days" },
  { value: "7", unit: "day", label: "7 Days" },
  { value: "10", unit: "day", label: "10 Days" },
];

function createPreviewRecord(file) {
  return {
    id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

function fileSignature(file) {
  return `${file.name}-${file.lastModified}-${file.size}`;
}

export default function SellerNewListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useAuth();
  const fileInputRef = useRef(null);
  const [imageRecords, setImageRecords] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [premiumSelected, setPremiumSelected] = useState(false);
  const [showFeaturePayment, setShowFeaturePayment] = useState(false);
  const [isCreatingFeatureSession, setIsCreatingFeatureSession] = useState(false);
  const [featureMessage, setFeatureMessage] = useState("");
  const [featureError, setFeatureError] = useState("");
  const [confirmingSessionId, setConfirmingSessionId] = useState("");
  const featureCredits = user?.wallet?.featureCredits || 0;

  useEffect(() => {
    return () => {
      imageRecords.forEach((record) => URL.revokeObjectURL(record.previewUrl));
    };
  }, [imageRecords]);

  useEffect(() => {
    const paymentState = searchParams.get("featurePayment");
    const sessionId = searchParams.get("session_id");
    const confirmationKey = sessionId ? `auctionarc-feature-confirmed:${sessionId}` : "";

    if (paymentState === "cancelled") {
      setFeatureMessage("");
      setFeatureError("Feature payment was cancelled before completion.");
      setShowFeaturePayment(true);
      router.replace("/seller/listings/new");
      return;
    }

    if (
      paymentState !== "success" ||
      !sessionId ||
      confirmingSessionId === sessionId ||
      (typeof window !== "undefined" && window.sessionStorage.getItem(confirmationKey))
    ) {
      return;
    }

    let isMounted = true;

    async function confirmFeatureSession() {
      setConfirmingSessionId(sessionId);
      setFeatureError("");
      setFeatureMessage("");

      try {
        await apiRequest("/payments/confirm-session", {
          method: "POST",
          body: {
            sessionId,
          },
        });

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(confirmationKey, "done");
        }

        await refresh();

        if (isMounted) {
          setPremiumSelected(true);
          setShowFeaturePayment(true);
          setFeatureMessage("Your $1 feature credit is ready. This listing can now be featured.");
          router.replace("/seller/listings/new");
        }
      } catch (error) {
        if (isMounted) {
          setFeatureError(error.message || "The feature payment could not be confirmed.");
        }
      }
    }

    confirmFeatureSession();

    return () => {
      isMounted = false;
    };
  }, [confirmingSessionId, refresh, router, searchParams]);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitter = event.nativeEvent.submitter;
    const intent = submitter?.value || "draft";
    const nativeFormData = new FormData(form);
    const payload = new FormData();

    setSubmitError("");
    setSubmitSuccess("");

    if (intent === "approval" && imageRecords.length < 1) {
      setSubmitError("Upload at least one image before submitting for approval.");
      return;
    }

    if (imageRecords.length > 3) {
      setSubmitError("You can upload a maximum of 3 images.");
      return;
    }

    if (nativeFormData.get("premiumHighlight") && featureCredits < 1) {
      setSubmitError("Complete the $1 feature payment before featuring this listing.");
      return;
    }

    for (const [key, value] of nativeFormData.entries()) {
      if (key === "images" || key === "auctionDurationPreset") {
        continue;
      }

      payload.append(key, value);
    }

    const selectedDurationPreset = durationOptions.find(
      (option) => `${option.value}:${option.unit}` === nativeFormData.get("auctionDurationPreset"),
    ) || durationOptions[4];

    payload.set("auctionDurationDays", selectedDurationPreset.value);
    payload.set("auctionDurationUnit", selectedDurationPreset.unit);

    imageRecords.forEach((record) => {
      payload.append("images", record.file);
    });

    payload.set("status", intent === "approval" ? "Pending approval" : "Draft");
    payload.set(
      "premiumHighlight",
      nativeFormData.get("premiumHighlight") ? "true" : "false",
    );

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/auctions/listings", {
        method: "POST",
        body: payload,
      });

      setSubmitSuccess(result.message || "Listing saved successfully.");
      if (nativeFormData.get("premiumHighlight")) {
        await refresh();
      }
      form.reset();
      imageRecords.forEach((record) => URL.revokeObjectURL(record.previewUrl));
      setImageRecords([]);
      setPremiumSelected(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

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
    const nextFiles = Array.from(event.target.files || []);
    setSubmitError("");
    setSubmitSuccess("");

    setImageRecords((current) => {
      const existingSignatures = new Set(current.map((record) => fileSignature(record.file)));
      const uniqueNewFiles = nextFiles.filter((file) => !existingSignatures.has(fileSignature(file)));
      const remainingSlots = Math.max(3 - current.length, 0);

      if (!remainingSlots) {
        setSubmitError("You can upload a maximum of 3 images.");
        return current;
      }

      if (uniqueNewFiles.length > remainingSlots) {
        setSubmitError("You can upload a maximum of 3 images.");
      }

      const filesToAdd = uniqueNewFiles.slice(0, remainingSlots);
      return [...current, ...filesToAdd.map(createPreviewRecord)];
    });

    event.target.value = "";
  }

  function handleRemoveImage(imageId) {
    setImageRecords((current) => {
      const nextRecords = current.filter((record) => record.id !== imageId);
      const removed = current.find((record) => record.id === imageId);

      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return nextRecords;
    });
    setSubmitError("");
    setSubmitSuccess("");
  }

  function clearMessages() {
    setSubmitError("");
    setSubmitSuccess("");
    setFeatureError("");
  }

  function handlePremiumToggle() {
    clearMessages();

    if (premiumSelected) {
      setPremiumSelected(false);
      return;
    }

    if (featureCredits > 0) {
      setPremiumSelected(true);
      setShowFeaturePayment(true);
      return;
    }

    setShowFeaturePayment((current) => !current);
  }

  async function handleFeaturePayment() {
    setFeatureError("");
    setFeatureMessage("");
    setIsCreatingFeatureSession(true);

    try {
      const result = await apiRequest("/payments/checkout-session", {
        method: "POST",
        body: {
          purpose: "listing-feature",
        },
      });

      if (result.data?.url) {
        window.location.href = result.data.url;
        return;
      }

      setFeatureError("The feature payment session could not be started.");
    } catch (error) {
      setFeatureError(error.message || "Could not start the feature payment.");
    } finally {
      setIsCreatingFeatureSession(false);
    }
  }

  return (
    <div className={shared.page}>
      <section className={shared.sectionHeader}>
        <div>
          <h1>Create New Listing</h1>
          <p>Prepare a complete auction product with real pricing, delivery, timing, and up to three listing photos.</p>
        </div>
      </section>

      <form className={`${shared.panel} ${shared.formPanel}`} onSubmit={handleSubmit}>
        <section className={shared.formSection}>
          <div className={shared.sectionTop}>
            <h2 className={shared.panelTitle}>Core listing details</h2>
          </div>

          <div className={shared.fieldGrid}>
            <div>
              <label className={shared.fieldLabel} htmlFor="listing-title">Product title *</label>
              <div className={shared.inputWrap}>
                <input
                  id="listing-title"
                  name="title"
                  type="text"
                  placeholder="Enter the exact product title"
                  required
                  onChange={clearMessages}
                />
              </div>
            </div>

            <div>
              <label className={shared.fieldLabel} htmlFor="listing-category">Category *</label>
              <div className={shared.inputWrap}>
                <select id="listing-category" name="category" defaultValue="" required onChange={clearMessages}>
                  <option value="" disabled>Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={shared.fieldLabel} htmlFor="listing-duration">Auction duration *</label>
              <div className={shared.inputWrap}>
                <select id="listing-duration" name="auctionDurationPreset" defaultValue="5:day" required onChange={clearMessages}>
                  {durationOptions.map((option) => (
                    <option key={`${option.value}-${option.unit}`} value={`${option.value}:${option.unit}`}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className={shared.mutedText}>The auction start time is created when admin approval makes the listing live.</p>
            </div>
          </div>
        </section>

        <section className={shared.formSection}>
          <label className={shared.fieldLabel} htmlFor="listing-description">Description</label>
          <textarea
            id="listing-description"
            name="description"
            className={shared.textarea}
            placeholder="Describe the product, included items, condition details, ownership, and anything buyers should know."
            rows={6}
            onChange={clearMessages}
          />
        </section>

        <section className={shared.formSection}>
          <div className={shared.sectionTop}>
            <h2 className={shared.panelTitle}>Photos</h2>
            <span className={shared.mediaHint}>Up to 3 images</span>
          </div>

          <label className={shared.uploadZone} htmlFor="listing-images">
            <div className={shared.uploadInner}>
              <UploadIcon />
              <div className={shared.uploadHeadline}>Select listing photos</div>
              <div className={shared.uploadCopy}>
                JPG, PNG, or WEBP. Upload between 1 and 3 product photos.
              </div>
            </div>
            <input
              ref={fileInputRef}
              id="listing-images"
              className={shared.fileInput}
              name="images"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              onChange={handleImageChange}
            />
          </label>

          {imageRecords.length ? (
            <div className={shared.previewGrid}>
              {imageRecords.map((record, index) => (
                <article key={record.id} className={shared.previewCard}>
                  <div
                    className={shared.previewImage}
                    style={{ backgroundImage: `url(${record.previewUrl})` }}
                  />
                  <div className={shared.previewMeta}>
                    <strong>Photo {index + 1}</strong>
                    <span>{record.file.name}</span>
                  </div>
                  <button
                    type="button"
                    className={shared.previewRemove}
                    aria-label={`Remove ${record.file.name}`}
                    onClick={() => handleRemoveImage(record.id)}
                  >
                    <CloseIcon />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className={shared.mutedText}>No images selected yet.</p>
          )}
        </section>

        <section className={shared.formSection}>
          <label className={shared.fieldLabel}>Condition *</label>
          <div className={shared.radioGrid}>
            {["New", "Like New", "Good", "Fair"].map((item) => (
              <label key={item} className={shared.radioCard}>
                <input
                  type="radio"
                  name="condition"
                  value={item}
                  defaultChecked={item === "Good"}
                  onChange={clearMessages}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={shared.formSection}>
          <div className={shared.fieldGrid}>
            <div>
              <label className={shared.fieldLabel} htmlFor="listing-price">Starting price *</label>
              <div className={shared.inputWrap}>
                <span>$</span>
                <input
                  id="listing-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                  onChange={clearMessages}
                />
              </div>
            </div>

            <div>
              <label className={shared.fieldLabel} htmlFor="listing-buy-now">Buy now price</label>
              <div className={shared.inputWrap}>
                <span>$</span>
                <input
                  id="listing-buy-now"
                  name="buyNowPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  onChange={clearMessages}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={shared.formSection}>
          <div className={shared.sectionTop}>
            <h2 className={shared.panelTitle}>Delivery and visibility</h2>
          </div>

          <div className={shared.deliveryGrid}>
            {deliveryOptions.map((option) => (
              <label key={option} className={shared.deliveryCard}>
                <input
                  type="radio"
                  name="deliveryOption"
                  value={option}
                  defaultChecked={option === "AuctionArc Delivery"}
                  onChange={clearMessages}
                />
                <div>
                  <strong>{option}</strong>
                  <p>Choose how the winning buyer receives this item.</p>
                </div>
              </label>
            ))}
          </div>

          <div className={shared.premiumBox}>
            <label
              className={shared.premiumOption}
              onClick={(event) => {
                event.preventDefault();
                handlePremiumToggle();
              }}
            >
              <input
                type="checkbox"
                checked={premiumSelected}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
              />
              <div>
                <div className={shared.featureTitleRow}>
                  <strong>Feature this listing</strong>
                  {premiumSelected ? <span className={shared.featureReadyBadge}>Featured</span> : null}
                </div>
                <p>Highlight the product more strongly in the marketplace once it is approved.</p>
              </div>
            </label>

            {premiumSelected ? <input type="hidden" name="premiumHighlight" value="true" /> : null}

            {showFeaturePayment ? (
              <div className={shared.featurePaymentPanel}>
                <div className={shared.featurePaymentHeader}>
                  <div>
                    <strong>Feature payment</strong>
                    <p>Pay $1 once to add a feature credit to your seller account. One credit highlights one listing.</p>
                  </div>
                  <span className={shared.featurePrice}>$1</span>
                </div>

                <div className={shared.featurePaymentMeta}>
                  <span>Available feature credits: {featureCredits}</span>
                  <span>{featureCredits > 0 ? "This listing will use 1 credit on submit." : "No feature credit available yet."}</span>
                </div>

                {featureError ? <p className={shared.errorText}>{featureError}</p> : null}
                {featureMessage ? <p className={shared.successText}>{featureMessage}</p> : null}

                {featureCredits < 1 ? (
                  <button
                    type="button"
                    className={shared.featurePaymentButton}
                    onClick={handleFeaturePayment}
                    disabled={isCreatingFeatureSession}
                  >
                    {isCreatingFeatureSession ? "Redirecting..." : "Pay $1 to Feature"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {submitError ? <p className={shared.errorText}>{submitError}</p> : null}
        {submitSuccess ? <p className={shared.successText}>{submitSuccess}</p> : null}

        <div className={shared.formActions}>
          <button type="submit" name="intent" value="approval" className={shared.primaryCta} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Submit for Approval"}
          </button>
          <button type="submit" name="intent" value="draft" className={shared.secondaryCta} disabled={isSubmitting}>
            <PlusIcon />
            <span>Save Draft</span>
          </button>
        </div>
      </form>
    </div>
  );
}
