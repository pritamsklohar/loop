export interface SimulatedFeedbackFixture {
  content: string;
  customerLabel: string;
  sourceRef: string;
}

export const appStoreFixtures: SimulatedFeedbackFixture[] = [
  {
    content: "The latest update makes page transitions feel like native app speed. Huge improvement over version 1!",
    customerLabel: "User992",
    sourceRef: "app-store-rev-101"
  },
  {
    content: "Cannot authenticate via workspace SSO on iOS. Works fine on desktop web. Please fix this blocker ASAP.",
    customerLabel: "EnterpriseMobility",
    sourceRef: "app-store-rev-102"
  },
  {
    content: "A solid project management utility, but lacking dark mode toggles in accessibility settings.",
    customerLabel: "AestheteDev",
    sourceRef: "app-store-rev-103"
  },
  {
    content: "Beautiful UI, but the analytics exports keep failing with an empty zip file. Submitting support ticket next.",
    customerLabel: "FounderLife",
    sourceRef: "app-store-rev-104"
  },
  {
    content: "Love the custom filters! Saves me 15 minutes every morning checking team milestones.",
    customerLabel: "LeadPM",
    sourceRef: "app-store-rev-105"
  },
  {
    content: "Constantly crashes when importing CSV files containing more than 50 rows. Annoying.",
    customerLabel: "CSVUser",
    sourceRef: "app-store-rev-106"
  },
  {
    content: "Very clean layout. However, it takes too long to search through archived tickets.",
    customerLabel: "SupportOps",
    sourceRef: "app-store-rev-107"
  },
  {
    content: "The best MERN stack tool I have tried. Snappy, minimalist, and exactly what we needed.",
    customerLabel: "DevOps_Dan",
    sourceRef: "app-store-rev-108"
  },
  {
    content: "I wish there was an option to share read-only dashboards without inviting team members directly.",
    customerLabel: "GrowthMarketer",
    sourceRef: "app-store-rev-109"
  },
  {
    content: "App runs fine but notifications are delayed by up to 20 minutes. Missing crucial alerts.",
    customerLabel: "AlwaysOnCall",
    sourceRef: "app-store-rev-110"
  },
  {
    content: "Simple, elegant, and fast. The new shortcuts make editing inline text an absolute breeze.",
    customerLabel: "ProductDesigner1",
    sourceRef: "app-store-rev-111"
  },
  {
    content: "Cannot import custom avatar images. The upload button does not react to clicks.",
    customerLabel: "AvatarFail",
    sourceRef: "app-store-rev-112"
  }
];

export const supportFixtures: SimulatedFeedbackFixture[] = [
  {
    content: "URGENT: Billing discrepancy on our last invoice. We were charged double for seats we removed last month.",
    customerLabel: "Acme Corp (Billing)",
    sourceRef: "ticket-5501"
  },
  {
    content: "Can you confirm if your security architecture is compliant with SOC2 Type II guidelines? Our compliance team needs documentation.",
    customerLabel: "Global Logistics Ltd",
    sourceRef: "ticket-5502"
  },
  {
    content: "A user from our team has left the company. How do we securely transfer all their dashboards and reports to a new owner?",
    customerLabel: "Fintech Systems Inc",
    sourceRef: "ticket-5503"
  },
  {
    content: "Error code ERR_WS_502 is appearing when attempting to hook up the Slack integration. Logs attached.",
    customerLabel: "DevOps Support",
    sourceRef: "ticket-5504"
  },
  {
    content: "The report exports are returning truncated text inside table columns. Is there a PDF formatting setting we can adjust?",
    customerLabel: "Data Team (Corp)",
    sourceRef: "ticket-5505"
  },
  {
    content: "How do we upgrade our current plan from Starter to Enterprise? We need to add 35 more seats today.",
    customerLabel: "Growth Co",
    sourceRef: "ticket-5506"
  },
  {
    content: "Our analysts cannot view the report tab despite being assigned the ANALYST role. Is there a permission cache?",
    customerLabel: "TechCorp",
    sourceRef: "ticket-5507"
  },
  {
    content: "Requesting custom data retention policies. We need feedback logs deleted automatically after 90 days for compliance.",
    customerLabel: "SecureBank Group",
    sourceRef: "ticket-5508"
  },
  {
    content: "Is there a rate limit on the custom API endpoint? We are getting 429 status codes during batch uploads.",
    customerLabel: "Integrations Dev",
    sourceRef: "ticket-5509"
  },
  {
    content: "The UI layout breaks completely on iPad Safari. Sidebar overlays the main content grid.",
    customerLabel: "Design Agency",
    sourceRef: "ticket-5510"
  },
  {
    content: "We need to set up custom webhooks for app event triggers. Is this feature supported on the Pro plan?",
    customerLabel: "WebhooksRUs",
    sourceRef: "ticket-5511"
  },
  {
    content: "My password reset email never arrived. Checked spam folders and confirmed correct address. Help!",
    customerLabel: "ForgotPWDUser",
    sourceRef: "ticket-5512"
  }
];

export const socialFixtures: SimulatedFeedbackFixture[] = [
  {
    content: "LOOP has completely solved our team permission bottleneck. The RBAC model works flawlessly. @loop_analytics",
    customerLabel: "Twitter / @jack_dev",
    sourceRef: "social-tweet-8891"
  },
  {
    content: "Why does @loop_analytics not have a webhook event for customer label edits? Hard to sync with our internal CRM.",
    customerLabel: "Twitter / @crm_specialist",
    sourceRef: "social-tweet-8892"
  },
  {
    content: "Reviewing @loop_analytics for MERN stack setups. The workspace scoping is very solid. Highly recommend looking at their model architecture.",
    customerLabel: "LinkedIn / TechReviews",
    sourceRef: "social-li-3021"
  },
  {
    content: "Struggling to parse raw survey outputs into LOOP. Does anyone have a Python conversion script? @loop_help",
    customerLabel: "Reddit / r/analytics",
    sourceRef: "social-reddit-551"
  },
  {
    content: "Shoutout to the LOOP support team for solving our Slack channel integration issue within minutes. Top notch. @loop_analytics",
    customerLabel: "Twitter / @ops_expert",
    sourceRef: "social-tweet-8893"
  },
  {
    content: "The speed of the LOOP API is outstanding. Bulk CSV ingestion with Zod validation parses 500 rows in less than a second. @loop_analytics",
    customerLabel: "LinkedIn / FullstackEngineer",
    sourceRef: "social-li-3022"
  },
  {
    content: "Is LOOP down? Keep getting connection timeouts when fetching dashboard templates. @loop_status",
    customerLabel: "Twitter / @downtime_tracker",
    sourceRef: "social-tweet-8894"
  },
  {
    content: "Can we get custom colors for dashboard theme badges? The defaults are good but branding is key. @loop_analytics",
    customerLabel: "Twitter / @brand_designer",
    sourceRef: "social-tweet-8895"
  },
  {
    content: "Comparing LOOP vs legacy tools. The tenant boundary isolation is the cleanest setup I have seen. @loop_analytics",
    customerLabel: "Reddit / r/saas",
    sourceRef: "social-reddit-552"
  },
  {
    content: "We migrated our customer feedback streams to LOOP yesterday. Visualizing trends is much easier now. @loop_analytics",
    customerLabel: "LinkedIn / ProductVP",
    sourceRef: "social-li-3023"
  },
  {
    content: "The mobile responsive dashboard is slightly cramped. Please improve layout spacing on small viewports. @loop_analytics",
    customerLabel: "Twitter / @ui_critic",
    sourceRef: "social-tweet-8896"
  },
  {
    content: "Loving the new workspace dashboard. The real-time charts give us full clarity on support backlogs. @loop_analytics",
    customerLabel: "Twitter / @happy_customer",
    sourceRef: "social-tweet-8897"
  }
];
