"use client";

import Link from "next/link";
import shared from "@/components/seller/SellerShared.module.css";
import {
  EditIcon,
  EyeIcon,
  PauseIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/seller/SellerIcons";

const rows = [
  { name: 'MacBook Pro 16" M3', status: "Active", bid: "$2,400", views: "156", watchers: "12" },
  { name: "Vintage Leica M6 Camera", status: "Active", bid: "$1,850", views: "89", watchers: "8" },
  { name: "Rolex Submariner Watch", status: "Pending", bid: "$8,200", views: "234", watchers: "45" },
];

export default function SellerListingsPage() {
  return (
    <div className={shared.page}>
      <section className={shared.sectionHeader}>
        <div>
          <h1>Listings Management</h1>
          <p>Create and manage your auction listings</p>
        </div>

        <Link href="/seller/listings/new" className={shared.primaryCta}>
          <PlusIcon />
          <span>Create New Listing</span>
        </Link>
      </section>

      <section className={`${shared.panel} ${shared.tablePanel}`}>
        <div className={shared.tableWrap}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Status</th>
                <th>Current Bid</th>
                <th>Views</th>
                <th>Watchers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>
                    <span className={`${shared.badge} ${row.status === "Active" ? shared.badgeActive : shared.badgePending}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={shared.accentText}>{row.bid}</td>
                  <td className={shared.mutedText}>
                    <span className={shared.tableMetric}>
                      <span className={shared.tableIcon}><EyeIcon /></span>
                      <span>{row.views}</span>
                    </span>
                  </td>
                  <td className={shared.mutedText}>
                    <span className={shared.tableMetric}>
                      <span className={shared.tableIcon}><UsersIcon /></span>
                      <span>{row.watchers}</span>
                    </span>
                  </td>
                  <td>
                    <div className={shared.tableActions}>
                      <button type="button" aria-label={`Edit ${row.name}`}><EditIcon /></button>
                      <button type="button" aria-label={`Pause ${row.name}`}><PauseIcon /></button>
                      <button type="button" aria-label={`Delete ${row.name}`}><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
