import { SubscriptionPlan } from "@prisma/client";

export const PLAN_FEATURES = {
  // ============================================================
  // ORGANIZATION PLANS
  // ============================================================

  [SubscriptionPlan.ORGANIZATION_STARTER]: {
    maxActiveSolicitations: 1,
    unlimitedBids: false,
    vendorShortlisting: false,
    evaluation: false,
    procurementReports: false,
    emailNotifications: false,
    multipleUsers: false,
    contractManagement: false,
    advancedAnalytics: false,
  },

  [SubscriptionPlan.ORGANIZATION_PROFESSIONAL]: {
    maxActiveSolicitations: Infinity,
    unlimitedBids: true,
    vendorShortlisting: true,
    evaluation: true,
    procurementReports: true,
    emailNotifications: true,
    multipleUsers: false,
    contractManagement: false,
    advancedAnalytics: false,
  },

  [SubscriptionPlan.ORGANIZATION_ENTERPRISE]: {
    maxActiveSolicitations: Infinity,
    unlimitedBids: true,
    vendorShortlisting: true,
    evaluation: true,
    procurementReports: true,
    emailNotifications: true,
    multipleUsers: true,
    contractManagement: true,
    advancedAnalytics: true,
  },

  // ============================================================
  // VENDOR PLANS
  // ============================================================

  [SubscriptionPlan.VENDOR_FREE]: {
    advancedSearch: false,

    savedSolicitations: {
      limit: 5,
    },

    unlimitedSavedSolicitations: false,

    emailAlerts: false,
    deadlineReminders: false,

    solicitationRecommendations: "basic",

    bidTracking: "basic",
    vendorAnalytics: false,

    marketInsights: "basic",
    procurementTrends: false,
    competitorInsights: false,

    aiMatching: false,
    aiProposalAssistant: false,

    documentManagement: "basic",
    documentAnalysis: false,

    eligibilityChecking: false,

    verifiedBadge: "standard",
    featuredListing: false,

    prioritySupport: false,
  },

  [SubscriptionPlan.VENDOR_PROFESSIONAL]: {
    advancedSearch: true,

    savedSolicitations: {
      limit: Infinity,
    },

    unlimitedSavedSolicitations: true,

    emailAlerts: true,
    deadlineReminders: true,

    solicitationRecommendations: "advanced",

    bidTracking: "advanced",
    vendorAnalytics: true,

    marketInsights: "full",
    procurementTrends: true,
    competitorInsights: false,

    aiMatching: true,
    aiProposalAssistant: false,

    documentManagement: "advanced",
    documentAnalysis: false,

    eligibilityChecking: false,

    verifiedBadge: "verified",
    featuredListing: false,

    prioritySupport: false,
  },

  [SubscriptionPlan.VENDOR_PREMIUM]: {
    advancedSearch: true,

    savedSolicitations: {
      limit: Infinity,
    },

    unlimitedSavedSolicitations: true,

    emailAlerts: true,
    deadlineReminders: true,

    solicitationRecommendations: "ai",

    bidTracking: "advanced",
    vendorAnalytics: true,

    marketInsights: "advanced",
    procurementTrends: true,
    competitorInsights: true,

    aiMatching: true,
    aiProposalAssistant: true,

    documentManagement: "premium",
    documentAnalysis: true,

    eligibilityChecking: true,

    verifiedBadge: "premium",
    featuredListing: true,

    prioritySupport: true,
  },
} as const;