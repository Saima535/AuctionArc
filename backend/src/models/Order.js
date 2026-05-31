/**
 * Represents a completed auction outcome that continues through payment and fulfilment.
 */
import mongoose from "mongoose";
import { ORDER_STATUSES } from "../constants/enums.js";

// Orders are created for both traditional auction wins and instant "buy now"
// purchases. The schema captures the shared commercial lifecycle after either
// acquisition path succeeds.
const orderSchema = new mongoose.Schema(
  {
    // Human-readable support/reference code shown in dashboards and payment flows.
    code: { type: String, required: true, unique: true },
    // Snapshot of the sold item title so order history remains readable even if
    // the source listing title changes later.
    item: { type: String, required: true },
    // Seller owns fulfilment and payout responsibilities for the order.
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Bidder is the buyer who either won the auction or used the buy now path.
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Listing is the catalog source for the purchased product.
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    // Purchase type distinguishes auction settlement orders from instant
    // checkout orders without requiring separate collections.
    purchaseType: {
      type: String,
      enum: ["Auction win", "Buy now"],
      default: "Auction win",
    },
    // Amount is the payable purchase value in platform currency units.
    amount: { type: Number, required: true },
    // Commission amount is the platform fee deducted from won-product revenue.
    commissionAmount: { type: Number, default: 0 },
    // Seller payout amount is the seller's net proceeds after commission.
    sellerPayoutAmount: { type: Number, default: 0 },
    // Escrow amount allows the same model to support payout-hold workflows.
    escrowAmount: { type: Number, default: 0 },
    // Stripe references are persisted for support, reconciliation, and idempotency.
    paymentSessionId: { type: String, default: "" },
    paymentIntentId: { type: String, default: "" },
    // Paid-at is null until Stripe confirmation finishes successfully.
    paidAt: { type: Date, default: null },
    // Payout release time records when the seller-side funds were marked released.
    payoutReleasedAt: { type: Date, default: null },
    // Status tracks the post-purchase fulfilment lifecycle through delivery.
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Payment pending",
    },
  },
  {
    timestamps: true,
  },
);

// Seller/buyer/status index supports dashboard and operational order views.
orderSchema.index({ seller: 1, bidder: 1, status: 1 });
// Listing/status index supports listing-centric purchase lookups.
orderSchema.index({ listing: 1, status: 1 });
// This unique constraint prevents duplicate orders for the same listing,
// buyer, and amount combination during idempotent payment flows.
orderSchema.index({ listing: 1, bidder: 1, amount: 1 }, { unique: true, sparse: true });

export const Order = mongoose.model("Order", orderSchema);
