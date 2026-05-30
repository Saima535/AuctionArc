"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

// Each uploaded image gets a stable UI identifier plus an object URL so the
// seller can preview the image before submitting the listing.
function createPreviewRecord(file) {
  return {
    id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

// File signatures are used to prevent the same image from being added twice
// when the user reopens the file picker.
function fileSignature(file) {
  return `${file.name}-${file.lastModified}-${file.size}`;
}

export default function SellerNewListingPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [imageRecords, setImageRecords] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [premiumSelected, setPremiumSelected] = useState(false);

  // Revoke preview URLs when the component unmounts so object URLs do not leak.
  useEffect(() => {
    return () => {
      imageRecords.forEach((record) => URL.revokeObjectURL(record.previewUrl));
    };
  }, [imageRecords]);

  // Buy now is mandatory and must always exceed the opening auction price.
  // This helper is shared between submit-time validation and field-level cleanup.
  function validateBuyNowValues(startingPriceValue, buyNowPriceValue) {
    const startingPrice = Number(startingPriceValue || 0);
    const buyNowPrice = Number(buyNowPriceValue || 0);

    if (!buyNowPrice || buyNowPrice <= 0) {
      return "Buy now price is required.";
    }

    if (buyNowPrice <= startingPrice) {
      return "Buy now price must be greater than the starting price.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // We inspect the pressed submit button so the same form can save either a
    // draft or an approval-ready listing without duplicating the component.
    const form = event.currentTarget;
    const submitter = event.nativeEvent.submitter;
    const intent = submitter?.value || "draft";
    const nativeFormData = new FormData(form);
    const payload = new FormData();

    setSubmitError("");
    setSubmitSuccess("");

    // Approval-ready listings must include at least one image because that is
    // what admins and buyers use to review the product.
    if (intent === "approval" && imageRecords.length < 1) {
      setSubmitError("Upload at least one image before submitting for approval.");
      return;
    }

    if (imageRecords.length > 3) {
      setSubmitError("You can upload a maximum of 3 images.");
      return;
    }

    // The seller-defined instant-purchase price is mandatory for this product
    // flow and must always sit above the opening auction price.
    const buyNowValidationError = validateBuyNowValues(
      nativeFormData.get("price"),
      nativeFormData.get("buyNowPrice"),
    );

    if (buyNowValidationError) {
      setSubmitError(buyNowValidationError);
      return;
    }

    // Copy all normal fields into the outgoing multipart payload while leaving
    // image handling and duration normalization to dedicated logic below.
    for (const [key, value] of nativeFormData.entries()) {
      if (key === "images" || key === "auctionDurationPreset") {
        continue;
      }

      payload.append(key, value);
    }

    const selectedDurationPreset = durationOptions.find(
      (option) => `${option.value}:${option.unit}` === nativeFormData.get("auctionDurationPreset"),
    ) || durationOptions[4];

    // The backend stores duration value and unit separately, so we split the
    // UI preset back into those two fields before submission.
    payload.set("auctionDurationDays", selectedDurationPreset.value);
    payload.set("auctionDurationUnit", selectedDurationPreset.unit);

    // Image files are appended after basic field copying so the multipart body
    // reflects the user’s current preview selection exactly.
    imageRecords.forEach((record) => {
      payload.append("images", record.file);
    });

    // Drafts stay internal to the seller; approval submissions enter admin review.
    payload.set("status", intent === "approval" ? "Pending approval" : "Draft");

    setIsSubmitting(true);

    try {
      // Listing creation is always the first step, even when the seller also
      // opts into the separate $1 featured placement checkout.
      const result = await apiRequest("/auctions/listings", {
        method: "POST",
        body: payload,
      });

      const createdListingId = result.data?._id;

      // Featured placement is modeled as a second payment step after the base
      // listing exists, so we branch into Stripe only after creation succeeds.
      if (premiumSelected && createdListingId) {
        setSubmitSuccess("Listing saved. Redirecting to the $1 featured placement checkout...");

        try {
          const checkoutResult = await apiRequest("/payments/checkout-session", {
            method: "POST",
            body: {
              purpose: "featured-listing",
              listingId: createdListingId,
            },
          });

          if (!checkoutResult.data?.url) {
            throw new Error("Stripe checkout could not be opened.");
          }

          window.location.assign(checkoutResult.data.url);
          return;
        } catch (paymentError) {
          // If Stripe cannot open, we still preserve the created listing and
          // send the seller back to the listing management page to retry later.
          setSubmitError("Listing saved, but we could not open the $1 feature payment. You can complete it from the listings page.");
          window.setTimeout(() => {
            router.push(`/seller/listings?featurePayment=setup-failed&listing=${createdListingId}`);
          }, 700);
          return;
        }
      }

      setSubmitSuccess(result.message || "Listing saved successfully.");
      // Reset both the native form controls and preview state so the seller
      // lands on a clean form after a successful create action.
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
      // API errors are shown inline so the seller can correct the listing
      // without losing the page state.
      setSubmitError(error.message || "Could not save the listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleImageChange(event) {
    // New files are merged into the existing preview collection so the seller
    // can build the final set across multiple file-picker interactions.
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

    // Reset the input so selecting the same file again still triggers change.
    event.target.value = "";
  }

  function handleRemoveImage(imageId) {
    // Removing a preview also revokes its object URL and reopens capacity for
    // additional uploads without refreshing the page.
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

  // Most field changes only need to clear transient success/error messages so
  // the seller gets fresh feedback on the next interaction.
  function clearMessages() {
    setSubmitError("");
    setSubmitSuccess("");
  }

  // Price fields clear existing messages and immediately surface the
  // buy-now-specific rule when the user enters an invalid combination.
  function handlePriceFieldChange(event) {
    clearMessages();

    const form = event.target.form;
    const validationError = validateBuyNowValues(
      form?.price?.value,
      form?.buyNowPrice?.value,
    );

    if (validationError && form?.buyNowPrice?.value) {
      setSubmitError(validationError);
    }
  }

  // Featured placement is a simple opt-in UI toggle that does not affect the
  // core listing validation rules.
  function handlePremiumToggle() {
    clearMessages();
    setPremiumSelected((current) => !current);
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
                  onChange={handlePriceFieldChange}
                />
              </div>
            </div>

            <div>
              <label className={shared.fieldLabel} htmlFor="listing-buy-now">Buy now price *</label>
              <div className={shared.inputWrap}>
                <span>$</span>
                <input
                  id="listing-buy-now"
                  name="buyNowPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Higher than the starting price"
                  required
                  onChange={handlePriceFieldChange}
                />
              </div>
              <p className={shared.mutedText}>Buyers can instantly purchase the product at this price without continuing the auction.</p>
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
                <p>After you save this listing, Stripe will open so you can pay $1 and place it higher in AuctionArc.</p>
              </div>
            </label>
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
