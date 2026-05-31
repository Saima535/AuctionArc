import { Auction } from "../models/Auction.js";
import { Bid } from "../models/Bid.js";
import { Listing } from "../models/Listing.js";
import { Order } from "../models/Order.js";
import { Report } from "../models/Report.js";
import { Thread } from "../models/Thread.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { compactAmount, toStats } from "./mapperService.js";
import { getOrderFinancials } from "./commissionService.js";
import { formatCurrency } from "../utils/formatters.js";

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatDateLong(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function sanitizePdfText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function addPdfObject(objects, body) {
  const id = objects.length;
  objects.push(body);
  return id;
}

function splitText(value, width) {
  const text = String(value ?? "");
  if (!text) {
    return [""];
  }

  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [text.slice(0, width)];
}

function buildPdfDocument(pages) {
  const objects = [null];
  const catalogId = addPdfObject(objects, "");
  const pagesId = addPdfObject(objects, "");
  const bodyFontId = addPdfObject(objects, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = addPdfObject(objects, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const pageIds = [];

  for (const page of pages) {
    const stream = page.join("\n");
    const contentId = addPdfObject(
      objects,
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
    );
    const pageId = addPdfObject(
      objects,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /ProcSet [/PDF /Text] /Font << /F1 ${bodyFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  }

  objects[pagesId] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;
  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = Buffer.byteLength(pdf, "utf8");
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

function toPdfColor([r, g, b]) {
  return `${r} ${g} ${b}`;
}

function createPdfPainter() {
  const pages = [];

  function startPage() {
    pages.push({ commands: [], y: 760 });
    return pages.at(-1);
  }

  function currentPage() {
    return pages.at(-1) || startPage();
  }

  function ensureSpace(height) {
    const page = currentPage();
    if (page.y - height < 50) {
      return startPage();
    }
    return page;
  }

  function drawRect(page, x, y, width, height, fillColor = null, strokeColor = [0.85, 0.89, 0.94], lineWidth = 1) {
    if (fillColor) {
      page.commands.push(`${toPdfColor(fillColor)} rg`);
      page.commands.push(`${x} ${y} ${width} ${height} re f`);
    }
    page.commands.push(`${toPdfColor(strokeColor)} RG`);
    page.commands.push(`${lineWidth} w`);
    page.commands.push(`${x} ${y} ${width} ${height} re S`);
  }

  function drawText(page, text, x, y, { font = "F1", size = 11, color = [0.13, 0.18, 0.24] } = {}) {
    page.commands.push("BT");
    page.commands.push(`/${font} ${size} Tf`);
    page.commands.push(`${toPdfColor(color)} rg`);
    page.commands.push(`1 0 0 1 ${x} ${y} Tm`);
    page.commands.push(`(${sanitizePdfText(text)}) Tj`);
    page.commands.push("ET");
  }

  function drawWrappedText(page, text, x, y, width, options = {}) {
    const maxChars = Math.max(Math.floor(width / ((options.size || 11) * 0.52)), 8);
    const lines = splitText(text, maxChars);
    lines.forEach((line, index) => {
      drawText(page, line, x, y - index * ((options.lineHeight || 13)), options);
    });
    return lines.length;
  }

  return {
    pages,
    ensureSpace,
    currentPage,
    startPage,
    drawRect,
    drawText,
    drawWrappedText,
  };
}

function buildSeries(days) {
  const end = endOfDay(new Date());
  const start = startOfDay(addDays(end, -(days - 1)));
  const labels = Array.from({ length: days }, (_, index) => formatDateLabel(addDays(start, index)));

  return { start, end, labels, days };
}

function buildReportingWindow(range = "weekly") {
  const days = range === "monthly" ? 30 : 7;
  const currentEnd = endOfDay(new Date());
  const currentStart = startOfDay(addDays(currentEnd, -(days - 1)));
  const previousEnd = endOfDay(addDays(currentStart, -1));
  const previousStart = startOfDay(addDays(previousEnd, -(days - 1)));

  return {
    key: range,
    label: range === "monthly" ? "Monthly report" : "Weekly report",
    days,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}

function sumAmounts(items = []) {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
}

function countBy(items = [], predicate) {
  return items.reduce((sum, item) => sum + (predicate(item) ? 1 : 0), 0);
}

function seriesFromItems(items, { start, days, dateField = "createdAt", value = () => 1 }) {
  const buckets = Array.from({ length: days }, () => 0);

  items.forEach((item) => {
    if (!item?.[dateField]) {
      return;
    }

    const offset = Math.floor((startOfDay(item[dateField]).getTime() - start.getTime()) / 86400000);
    if (offset < 0 || offset >= days) {
      return;
    }

    buckets[offset] += value(item);
  });

  return buckets.map((entry) => Math.round(entry * 100) / 100);
}

function formatDelta(current, previous, { suffix = "", inverse = false, empty = "No prior data" } = {}) {
  if (!previous) {
    return empty;
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.abs(change).toFixed(1);

  if (rounded === "0.0") {
    return `0.0%${suffix}`;
  }

  const direction = change >= 0 ? "+" : "-";
  return `${direction}${rounded}%${suffix}`;
}

function toneFromDelta(current, previous, inverse = false) {
  if (current === previous) {
    return "neutral";
  }
  const improved = inverse ? current <= previous : current >= previous;
  return improved ? "good" : "warn";
}

function computeAverageResolutionHours(reports = []) {
  const resolved = reports.filter((report) => ["Resolved", "Closed"].includes(report.status));
  if (!resolved.length) {
    return 0;
  }

  const totalHours = resolved.reduce((sum, report) => {
    const createdAt = new Date(report.createdAt).getTime();
    const updatedAt = new Date(report.updatedAt).getTime();
    return sum + Math.max((updatedAt - createdAt) / 3600000, 0);
  }, 0);

  return totalHours / resolved.length;
}

function toPercent(value) {
  return `${Math.round(value)}%`;
}

function suspiciousBidPredicate(bid) {
  return /held|review|pending/i.test(String(bid.status || "")) || /alert|suspicious|risk/i.test(String(bid.signal || ""));
}

function buildTopCategories({ orders, listingById, auctionByListingId }) {
  const totals = new Map();

  orders.forEach((order) => {
    const listing = listingById.get(String(order.listing?._id || order.listing));
    const auction = auctionByListingId.get(String(order.listing?._id || order.listing));
    const category = listing?.category || auction?.category || "Uncategorized";
    const current = totals.get(category) || { revenue: 0, orders: 0 };
    current.revenue += getOrderFinancials(order).sellerPayoutAmount;
    current.orders += 1;
    totals.set(category, current);
  });

  return [...totals.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, totals]) => ({
      name,
      metric: `${formatCurrency(totals.revenue)} revenue`,
      status: `${totals.orders} orders`,
      value: totals.revenue,
    }));
}

function buildTopSellers({ orders }) {
  const totals = new Map();

  orders.forEach((order) => {
    const sellerId = String(order.seller?._id || order.seller || "");
    const current = totals.get(sellerId) || {
      name: order.seller?.name || "Unknown seller",
      revenue: 0,
      orders: 0,
    };
    current.revenue += getOrderFinancials(order).sellerPayoutAmount;
    current.orders += 1;
    totals.set(sellerId, current);
  });

  return [...totals.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((item) => ({
      name: item.name,
      metric: `${item.orders} sales`,
      status: formatCurrency(item.revenue),
      value: item.revenue,
    }));
}

function buildTopProducts({ auctions, listingById }) {
  return auctions
    .map((auction) => {
      const listing = listingById.get(String(auction.listing?._id || auction.listing));
      const score = (auction.bidCount || 0) * 4 + (auction.currentBid || 0) / 100;
      return {
        name: listing?.title || auction.title || "Untitled listing",
        metric: `${auction.bidCount || 0} bids`,
        status: formatCurrency(auction.currentBid || listing?.currentBid || listing?.price || 0),
        value: score,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export async function buildAdminInsights(period = "30") {
  const days = [7, 30, 90].includes(Number(period)) ? Number(period) : 30;
  const current = buildSeries(days);
  const previousStart = startOfDay(addDays(current.start, -days));
  const previousEnd = endOfDay(addDays(current.start, -1));

  const [
    users,
    listings,
    auctions,
    bids,
    orders,
    transactions,
    reports,
    previousListings,
    previousAuctions,
    previousBids,
    previousOrders,
    previousTransactions,
    previousReports,
  ] = await Promise.all([
    User.find({ createdAt: { $gte: current.start, $lte: current.end }, role: { $in: ["Seller", "Bidder"] } }).lean(),
    Listing.find({ createdAt: { $gte: current.start, $lte: current.end } }).populate("seller").lean(),
    Auction.find({ createdAt: { $gte: current.start, $lte: current.end } }).populate("seller listing").lean(),
    Bid.find({ createdAt: { $gte: current.start, $lte: current.end } }).populate("bidder auction listing").lean(),
    Order.find({ createdAt: { $gte: current.start, $lte: current.end } }).populate("seller listing").lean(),
    Transaction.find({ createdAt: { $gte: current.start, $lte: current.end } }).populate("user").lean(),
    Report.find({ createdAt: { $gte: current.start, $lte: current.end } }).lean(),
    Listing.find({ createdAt: { $gte: previousStart, $lte: previousEnd } }).lean(),
    Auction.find({ createdAt: { $gte: previousStart, $lte: previousEnd } }).lean(),
    Bid.find({ createdAt: { $gte: previousStart, $lte: previousEnd } }).lean(),
    Order.find({ createdAt: { $gte: previousStart, $lte: previousEnd } }).lean(),
    Transaction.find({ createdAt: { $gte: previousStart, $lte: previousEnd } }).lean(),
    Report.find({ createdAt: { $gte: previousStart, $lte: previousEnd } }).lean(),
  ]);

  const listingById = new Map(listings.map((listing) => [String(listing._id), listing]));
  const auctionByListingId = new Map(
    auctions.map((auction) => [String(auction.listing?._id || auction.listing), auction]),
  );

  const closedAuctions = auctions.filter((auction) => auction.status === "Closed").length;
  const soldOrders = orders.length;
  const completionRate = closedAuctions ? (soldOrders / closedAuctions) * 100 : 0;
  const previousCompletionRate = (() => {
    const previousClosed = previousAuctions.filter((auction) => auction.status === "Closed").length;
    return previousClosed ? (previousOrders.length / previousClosed) * 100 : 0;
  })();

  const suspiciousBidCount = bids.filter(suspiciousBidPredicate).length;
  const previousSuspiciousBidCount = previousBids.filter(suspiciousBidPredicate).length;
  const fraudRate = bids.length ? (suspiciousBidCount / bids.length) * 100 : 0;
  const previousFraudRate = previousBids.length ? (previousSuspiciousBidCount / previousBids.length) * 100 : 0;

  const avgResolutionHours = computeAverageResolutionHours(reports);
  const previousAvgResolutionHours = computeAverageResolutionHours(previousReports);

  return {
    period: {
      days,
      start: current.start,
      end: current.end,
      labels: current.labels,
    },
    insightSeries: {
      marketplaceGrowth: current.labels.map((_, index) => {
        const date = addDays(current.start, index);
        const key = formatDateKey(date);
        const userCount = users.filter((item) => formatDateKey(item.createdAt) === key).length;
        const listingCount = listings.filter((item) => formatDateKey(item.createdAt) === key).length;
        const orderCount = orders.filter((item) => formatDateKey(item.createdAt) === key).length;
        return userCount + listingCount + orderCount;
      }),
      bidVolume: seriesFromItems(bids, {
        start: current.start,
        days,
        value: (bid) => bid.amount || 0,
      }),
      conversion: current.labels.map((_, index) => {
        const day = addDays(current.start, index);
        const key = formatDateKey(day);
        const dailyClosedAuctions = auctions.filter(
          (auction) => auction.status === "Closed" && formatDateKey(auction.updatedAt) === key,
        ).length;
        const dailyOrders = orders.filter((order) => formatDateKey(order.createdAt) === key).length;
        return dailyClosedAuctions ? Math.round((dailyOrders / dailyClosedAuctions) * 100) : 0;
      }),
      fraudSignals: current.labels.map((_, index) => {
        const day = addDays(current.start, index);
        const key = formatDateKey(day);
        const dailySuspiciousBids = bids.filter(
          (bid) => suspiciousBidPredicate(bid) && formatDateKey(bid.createdAt) === key,
        ).length;
        const dailyReports = reports.filter((report) => formatDateKey(report.createdAt) === key).length;
        return dailySuspiciousBids + dailyReports;
      }),
    },
    insightCards: [
      toStats(
        "Gross marketplace activity",
        formatCurrency(sumAmounts(transactions)),
        formatDelta(sumAmounts(transactions), sumAmounts(previousTransactions)),
        toneFromDelta(sumAmounts(transactions), sumAmounts(previousTransactions)),
      ),
      toStats(
        "Average auction completion",
        toPercent(completionRate),
        formatDelta(completionRate, previousCompletionRate),
        toneFromDelta(completionRate, previousCompletionRate),
      ),
      toStats(
        "Fraud review rate",
        `${fraudRate.toFixed(1)}%`,
        formatDelta(fraudRate, previousFraudRate, { inverse: true }),
        toneFromDelta(fraudRate, previousFraudRate, true),
      ),
      toStats(
        "Support resolution time",
        avgResolutionHours ? `${Math.round(avgResolutionHours)}h` : "0h",
        formatDelta(avgResolutionHours, previousAvgResolutionHours, { inverse: true }),
        toneFromDelta(avgResolutionHours, previousAvgResolutionHours, true),
      ),
    ],
    topPerformers: {
      sellers: buildTopSellers({ orders }),
      categories: buildTopCategories({ orders, listingById, auctionByListingId }),
    },
  };
}

export async function buildAdminReport(range = "weekly") {
  const window = buildReportingWindow(range);
  const rangeQuery = { createdAt: { $gte: window.currentStart, $lte: window.currentEnd } };
  const previousQuery = { createdAt: { $gte: window.previousStart, $lte: window.previousEnd } };

  const [
    users,
    previousUsers,
    listings,
    previousListings,
    auctions,
    previousAuctions,
    bids,
    previousBids,
    orders,
    previousOrders,
    transactions,
    previousTransactions,
    reports,
    previousReports,
    threads,
    previousThreads,
    liveAuctions,
  ] = await Promise.all([
    User.find({ ...rangeQuery, role: { $in: ["Seller", "Bidder"] } }).lean(),
    User.find({ ...previousQuery, role: { $in: ["Seller", "Bidder"] } }).lean(),
    Listing.find(rangeQuery).lean(),
    Listing.find(previousQuery).lean(),
    Auction.find(rangeQuery).populate("listing seller").lean(),
    Auction.find(previousQuery).lean(),
    Bid.find(rangeQuery).populate("bidder auction listing").lean(),
    Bid.find(previousQuery).lean(),
    Order.find(rangeQuery).populate("seller bidder listing").lean(),
    Order.find(previousQuery).lean(),
    Transaction.find(rangeQuery).populate("user").lean(),
    Transaction.find(previousQuery).lean(),
    Report.find(rangeQuery).lean(),
    Report.find(previousQuery).lean(),
    Thread.find(rangeQuery).lean(),
    Thread.find(previousQuery).lean(),
    Auction.countDocuments({ status: { $in: ["Live", "Extended"] } }),
  ]);

  const listingById = new Map(listings.map((listing) => [String(listing._id), listing]));
  const auctionByListingId = new Map(
    auctions.map((auction) => [String(auction.listing?._id || auction.listing), auction]),
  );
  const revenue = sumAmounts(transactions);
  const previousRevenue = sumAmounts(previousTransactions);
  const orderValue = sumAmounts(orders);
  const sellerPayoutValue = orders.reduce((sum, order) => sum + getOrderFinancials(order).sellerPayoutAmount, 0);
  const commissionValue = orders.reduce((sum, order) => sum + getOrderFinancials(order).commissionAmount, 0);
  const suspiciousBidCount = countBy(bids, suspiciousBidPredicate);
  const previousSuspiciousBidCount = countBy(previousBids, suspiciousBidPredicate);
  const openReports = countBy(reports, (report) => !["Resolved", "Closed"].includes(report.status));
  const previousOpenReports = countBy(previousReports, (report) => !["Resolved", "Closed"].includes(report.status));
  const avgResolutionHours = computeAverageResolutionHours(reports);
  const previousAvgResolutionHours = computeAverageResolutionHours(previousReports);
  const sellerCount = countBy(users, (user) => user.role === "Seller");
  const bidderCount = countBy(users, (user) => user.role === "Bidder");
  const conversionRate = listings.length ? (orders.length / listings.length) * 100 : 0;
  const previousConversionRate = previousListings.length ? (previousOrders.length / previousListings.length) * 100 : 0;
  const averageBidAmount = bids.length ? sumAmounts(bids) / bids.length : 0;
  const supportBacklog = countBy(threads, (thread) => !["Resolved", "Closed"].includes(thread.status));
  const previousSupportBacklog = countBy(previousThreads, (thread) => !["Resolved", "Closed"].includes(thread.status));
  const packageTransactions = countBy(transactions, (transaction) => /package|registration/i.test(transaction.type));

  return {
    key: range,
    title: window.label,
    generatedAt: new Date().toISOString(),
    periodLabel: `${formatDateLong(window.currentStart)} to ${formatDateLong(window.currentEnd)}`,
    period: {
      start: window.currentStart,
      end: window.currentEnd,
      days: window.days,
    },
    summaryCards: [
      {
        label: "Revenue processed",
        value: formatCurrency(revenue),
        delta: formatDelta(revenue, previousRevenue),
        tone: toneFromDelta(revenue, previousRevenue),
      },
      {
        label: "Orders closed",
        value: String(orders.length),
        delta: formatDelta(orders.length, previousOrders.length),
        tone: toneFromDelta(orders.length, previousOrders.length),
      },
      {
        label: "Bids placed",
        value: compactAmount(bids.length),
        delta: formatDelta(bids.length, previousBids.length),
        tone: toneFromDelta(bids.length, previousBids.length),
      },
      {
        label: "Open risk items",
        value: String(openReports + supportBacklog),
        delta: formatDelta(openReports + supportBacklog, previousOpenReports + previousSupportBacklog, { inverse: true }),
        tone: toneFromDelta(openReports + supportBacklog, previousOpenReports + previousSupportBacklog, true),
      },
    ],
    sections: [
      {
        title: "Marketplace overview",
        description: "Core activity across users, listings, auctions, and closed orders.",
        rows: [
          { label: "New users", value: String(users.length), detail: `${sellerCount} sellers | ${bidderCount} bidders` },
          { label: "Listings created", value: String(listings.length), detail: `Conversion ${toPercent(conversionRate)}` },
          { label: "Auctions launched", value: String(auctions.length), detail: `${liveAuctions} currently live` },
          { label: "Orders won", value: String(orders.length), detail: `${formatCurrency(orderValue)} GMV` },
        ],
      },
      {
        title: "Financial performance",
        description: "Commercial performance for processed payments and bidding depth.",
        rows: [
          { label: "Transaction volume", value: formatCurrency(revenue), detail: `${transactions.length} processed payments` },
          { label: "Seller payout", value: formatCurrency(sellerPayoutValue), detail: "Net proceeds after 5% commission" },
          { label: "Platform commission", value: formatCurrency(commissionValue), detail: "Collected from won products" },
          { label: "Bid throughput", value: bids.length ? formatCurrency(averageBidAmount) : formatCurrency(0), detail: "Average bid amount" },
          { label: "Marketplace conversion", value: toPercent(conversionRate), detail: `Previous ${toPercent(previousConversionRate)}` },
        ],
      },
      {
        title: "Operations",
        description: "Short operational view of disputes, flagged bids, and support workload.",
        rows: [
          { label: "Open reports", value: String(openReports), detail: "Marketplace disputes and review items" },
          { label: "Suspicious bids", value: String(suspiciousBidCount), detail: `Previous ${previousSuspiciousBidCount}` },
          { label: "Support backlog", value: String(supportBacklog), detail: `${threads.length} support threads updated` },
          { label: "Avg. report resolution", value: avgResolutionHours ? `${Math.round(avgResolutionHours)}h` : "0h", detail: `Previous ${previousAvgResolutionHours ? `${Math.round(previousAvgResolutionHours)}h` : "0h"}` },
        ],
      },
    ],
    topPerformers: {
      sellers: buildTopSellers({ orders }),
      categories: buildTopCategories({ orders, listingById, auctionByListingId }),
    },
  };
}

export function buildReportCsv(report) {
  const lines = [
    ["Report", report.title],
    ["Generated at", report.generatedAt],
    ["Period", report.periodLabel],
    [],
    ["Summary label", "Value", "Delta", "Tone"],
    ...report.summaryCards.map((card) => [card.label, card.value, card.delta, card.tone]),
    [],
  ];

  report.sections.forEach((section) => {
    lines.push([section.title]);
    if (section.description) {
      lines.push([section.description]);
    }
    lines.push(["Metric", "Value", "Detail"]);
    section.rows.forEach((row) => {
      lines.push([row.label, row.value, row.detail]);
    });
    lines.push([]);
  });

  lines.push(["Top sellers", "Metric", "Status"]);
  report.topPerformers.sellers.forEach((item) => lines.push([item.name, item.metric, item.status]));
  lines.push([]);
  lines.push(["Top categories", "Metric", "Status"]);
  report.topPerformers.categories.forEach((item) => lines.push([item.name, item.metric, item.status]));

  return lines.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function buildReportPdf(report) {
  const painter = createPdfPainter();
  painter.startPage();

  function sectionHeading(title) {
    const page = painter.ensureSpace(28);
    page.y -= 10;
    painter.drawText(page, title, 50, page.y, {
      font: "F2",
      size: 13,
      color: [0.12, 0.2, 0.38],
    });
    page.y -= 18;
  }

  function subtitle(text) {
    const page = painter.ensureSpace(18);
    painter.drawText(page, text, 50, page.y, {
      font: "F1",
      size: 10,
      color: [0.39, 0.45, 0.53],
    });
    page.y -= 16;
  }

  function drawTable(headers, rows, columnWidths) {
    const pageWidth = 612;
    const left = 50;
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const colors = {
      headerBg: [0.13, 0.31, 0.62],
      headerText: [1, 1, 1],
      border: [0.82, 0.86, 0.91],
      text: [0.13, 0.18, 0.24],
      muted: [0.38, 0.43, 0.5],
      stripe: [0.97, 0.98, 0.99],
    };

    const drawHeader = () => {
      const page = painter.ensureSpace(34);
      painter.drawRect(page, left, page.y - 22, tableWidth, 24, colors.headerBg, colors.headerBg, 0.8);
      let cursorX = left;
      headers.forEach((header, index) => {
        painter.drawText(page, header, cursorX + 8, page.y - 14, {
          font: "F2",
          size: 10,
          color: colors.headerText,
        });
        cursorX += columnWidths[index];
      });
      page.y -= 24;
    };

    drawHeader();

    rows.forEach((row, rowIndex) => {
      const wrappedCells = row.map((cell, index) => {
        const maxChars = Math.max(Math.floor((columnWidths[index] - 16) / 5.8), 8);
        return splitText(cell, maxChars);
      });
      const lineCount = Math.max(...wrappedCells.map((cell) => cell.length), 1);
      const rowHeight = Math.max(24, lineCount * 12 + 12);
      const page = painter.ensureSpace(rowHeight + 8);

      if (page.y < 140) {
        page.y -= 10;
      }

      if (page.y - rowHeight < 50) {
        painter.startPage();
        drawHeader();
      }

      const activePage = painter.currentPage();
      if (rowIndex % 2 === 0) {
        painter.drawRect(activePage, left, activePage.y - rowHeight, tableWidth, rowHeight, colors.stripe, colors.stripe, 0.4);
      }

      let cursorX = left;
      wrappedCells.forEach((cellLines, index) => {
        painter.drawRect(activePage, cursorX, activePage.y - rowHeight, columnWidths[index], rowHeight, null, colors.border, 0.6);
        cellLines.forEach((line, lineIndex) => {
          painter.drawText(activePage, line, cursorX + 8, activePage.y - 16 - lineIndex * 12, {
            font: index === 0 ? "F2" : "F1",
            size: 10,
            color: index === 2 ? colors.muted : colors.text,
          });
        });
        cursorX += columnWidths[index];
      });

      activePage.y -= rowHeight;
    });

    const page = painter.currentPage();
    page.y -= 18;

    if (tableWidth > pageWidth - 100) {
      page.y -= 0;
    }
  }

  const firstPage = painter.currentPage();
  painter.drawRect(firstPage, 42, 720, 528, 82, [0.95, 0.97, 1], [0.84, 0.88, 0.94], 1);
  painter.drawRect(firstPage, 42, 770, 528, 32, [0.12, 0.28, 0.55], [0.12, 0.28, 0.55], 1);
  painter.drawText(firstPage, `AuctionArc ${report.title}`, 56, 780, {
    font: "F2",
    size: 18,
    color: [1, 1, 1],
  });
  painter.drawText(firstPage, `Generated ${report.generatedAt.slice(0, 10)}`, 56, 748, {
    font: "F1",
    size: 10,
    color: [0.3, 0.36, 0.44],
  });
  painter.drawText(firstPage, report.periodLabel, 56, 730, {
    font: "F1",
    size: 12,
    color: [0.12, 0.18, 0.24],
  });
  firstPage.y = 700;

  sectionHeading("Executive summary");
  drawTable(
    ["Metric", "Value", "Change", "Status"],
    report.summaryCards.map((card) => [card.label, card.value, card.delta, card.tone]),
    [190, 90, 100, 82],
  );

  report.sections.forEach((section) => {
    sectionHeading(section.title);
    if (section.description) {
      subtitle(section.description);
    }
    drawTable(
      ["Metric", "Value", "Detail"],
      section.rows.map((row) => [row.label, row.value, row.detail]),
      [170, 90, 220],
    );
  });

  sectionHeading("Top sellers");
  drawTable(
    ["Seller", "Performance", "Revenue"],
    report.topPerformers.sellers.map((item) => [item.name, item.metric, item.status]),
    [180, 150, 150],
  );

  sectionHeading("Top categories");
  drawTable(
    ["Category", "Performance", "Status"],
    report.topPerformers.categories.map((item) => [item.name, item.metric, item.status]),
    [180, 150, 150],
  );

  return buildPdfDocument(painter.pages.map((page) => page.commands));
}
