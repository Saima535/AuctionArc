"use client";

import shared from "@/components/seller/SellerShared.module.css";
import { DeliveryIcon, PlusIcon, SparklesIcon, UploadIcon } from "@/components/seller/SellerIcons";

export default function SellerNewListingPage() {
  return (
    <div className={shared.page}>
      <section className={shared.sectionHeader}>
        <div>
          <h1>Create New Listing</h1>
          <p>Build a polished auction listing for review and approval</p>
        </div>
      </section>

      <section className={`${shared.panel} ${shared.formPanel}`}>
        <div className={shared.formSection}>
          <label className={shared.fieldLabel}>Upload Images * (Minimum 2)</label>
          <div className={shared.uploadZone}>
            <div className={shared.uploadInner}>
              <UploadIcon />
              <div style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.72)" }}>Click to upload or drag and drop</div>
              <div style={{ marginTop: 12 }}>PNG, JPG up to 10MB</div>
            </div>
          </div>
        </div>

        <div className={shared.formSection}>
          <label className={shared.fieldLabel}>Condition *</label>
          <div className={shared.radioGrid}>
            {["New", "Like New", "Good", "Fair"].map((item) => (
              <label key={item} className={shared.radioCard}>
                <input type="radio" name="condition" defaultChecked={item === "Good"} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={shared.formSection}>
          <div className={shared.fieldGrid}>
            <div>
              <label className={shared.fieldLabel}>Starting Price *</label>
              <div className={shared.inputWrap}>
                <span>$</span>
                <input defaultValue="0.00" />
              </div>
            </div>
            <div>
              <label className={shared.fieldLabel}>Reserve Price (Optional)</label>
              <div className={shared.inputWrap}>
                <span>$</span>
                <input defaultValue="0.00" />
              </div>
            </div>
            <div>
              <label className={shared.fieldLabel}>Buy Now Price (Optional)</label>
              <div className={shared.inputWrap}>
                <span>$</span>
                <input defaultValue="0.00" />
              </div>
            </div>
          </div>
        </div>

        <div className={shared.formSection}>
          <label className={shared.fieldLabel}>Auction Duration *</label>
          <div className={shared.durationGrid}>
            {["3 Days", "5 Days", "7 Days"].map((item) => (
              <label key={item} className={shared.radioCard}>
                <input type="radio" name="duration" defaultChecked={item === "5 Days"} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={shared.formSection}>
          <label className={shared.fieldLabel}>Delivery Option *</label>
          <div className={shared.deliveryGrid}>
            <label className={shared.deliveryCard}>
              <input type="radio" name="delivery" />
              <div>
                <strong>Seller Delivery</strong>
                <p style={{ marginTop: 6, color: "rgba(255,255,255,0.72)" }}>You handle shipping and delivery</p>
              </div>
            </label>
            <label className={`${shared.deliveryCard} ${shared.deliveryCardActive}`}>
              <input type="radio" name="delivery" defaultChecked />
              <div>
                <strong>AuctionArc Delivery</strong>
                <p style={{ marginTop: 6, color: "rgba(255,255,255,0.72)" }}>We handle secure delivery for you</p>
              </div>
            </label>
          </div>
        </div>

        <div className={shared.formSection}>
          <label className={shared.fieldLabel}>Delivery Fee</label>
          <div className={shared.inputWrap}>
            <span>$</span>
            <input defaultValue="0.00" />
          </div>
        </div>

        <div className={shared.formSection}>
          <div className={shared.premiumBox}>
            <div className={shared.premiumHeader}>
              <SparklesIcon />
              <span>Premium Features</span>
            </div>
            <label className={shared.premiumOption}>
              <input type="checkbox" />
              <div>
                <strong>Highlight Listing ($9.99)</strong>
                <p>Make your listing stand out with premium highlighting</p>
              </div>
            </label>
          </div>
        </div>

        <div className={shared.formActions}>
          <button type="button" className={shared.primaryCta}>
            Submit for Approval
          </button>
          <button type="button" className={shared.secondaryCta}>
            Save Draft
          </button>
        </div>
      </section>
    </div>
  );
}
