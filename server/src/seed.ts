import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Workspace, User, Theme, Feedback, Report, ChatSession } from './models';

dotenv.config();

const feedbackTemplates = [
  // positive
  {
    content: "The dashboard loads incredibly fast now. The charts are super intuitive and easy to read. Great job team!",
    channel: "app_store",
    customerLabel: "Enterprise User",
    sentiment: "POS",
    sentimentScore: 0.85,
    themeIndex: 2 // Performance & Reliability
  },
  {
    content: "I've been using this tool for a week and it has already saved me hours of manual data reporting. Highly recommended!",
    channel: "nps_survey",
    customerLabel: "Pro Plan User",
    sentiment: "POS",
    sentimentScore: 0.9,
    themeIndex: 1 // User Interface & Experience
  },
  {
    content: "Customer support was amazing. They resolved my login issue within 5 minutes. Outstanding service!",
    channel: "support_ticket",
    customerLabel: "Free Tier User",
    sentiment: "POS",
    sentimentScore: 0.95,
    themeIndex: 5 // Customer Support
  },
  {
    content: "The new integration with Slack is a game changer for our team. We get real-time alerts instantly.",
    channel: "community_post",
    customerLabel: "Team Lead",
    sentiment: "POS",
    sentimentScore: 0.8,
    themeIndex: 4 // Integrations & API
  },
  {
    content: "Had a great call with the sales rep today. The platform seems to cover all our compliance requirements.",
    channel: "sales_call",
    customerLabel: "Prospect - Compliance Director",
    sentiment: "POS",
    sentimentScore: 0.75,
    themeIndex: 3 // Feature Requests
  },
  // negative
  {
    content: "This app keeps crashing every time I try to upload a large CSV file. Extremely frustrating.",
    channel: "support_ticket",
    customerLabel: "Enterprise User",
    sentiment: "NEG",
    sentimentScore: -0.85,
    themeIndex: 2 // Performance & Reliability
  },
  {
    content: "The pricing is way too high for small teams. We are looking for cheaper alternatives.",
    channel: "nps_survey",
    customerLabel: "Pro Plan User",
    sentiment: "NEG",
    sentimentScore: -0.7,
    themeIndex: 0 // Pricing & Billing
  },
  {
    content: "I hate the new user interface. It is confusing and requires too many clicks to perform basic tasks.",
    channel: "app_store",
    customerLabel: "Long-time User",
    sentiment: "NEG",
    sentimentScore: -0.9,
    themeIndex: 1 // User Interface & Experience
  },
  {
    content: "Our team is facing significant latency issues in the EU region. Page loads take up to 10 seconds.",
    channel: "support_ticket",
    customerLabel: "EU Customer",
    sentiment: "NEG",
    sentimentScore: -0.8,
    themeIndex: 2 // Performance & Reliability
  },
  {
    content: "The API documentation is outdated and missing crucial details about webhook authentication.",
    channel: "community_post",
    customerLabel: "Developer",
    sentiment: "NEG",
    sentimentScore: -0.65,
    themeIndex: 4 // Integrations & API
  },
  // neutral / mixed
  {
    content: "The tool works fine for basic task tracking, but it lacks advanced reporting capabilities.",
    channel: "nps_survey",
    customerLabel: "Project Manager",
    sentiment: "NEU",
    sentimentScore: 0.1,
    themeIndex: 3 // Feature Requests
  },
  {
    content: "It does what it says on the box, but the mobile experience could be improved.",
    channel: "app_store",
    customerLabel: "Mobile User",
    sentiment: "NEU",
    sentimentScore: -0.05,
    themeIndex: 1 // User Interface & Experience
  },
  {
    content: "We discussed importing data from their legacy systems. It seems possible but requires a custom script.",
    channel: "sales_call",
    customerLabel: "Prospect - Tech Lead",
    sentiment: "NEU",
    sentimentScore: 0.05,
    themeIndex: 4 // Integrations & API
  },
  {
    content: "Is there a way to customize the automated email notifications? The default layout is too generic.",
    channel: "community_post",
    customerLabel: "Operations Manager",
    sentiment: "NEU",
    sentimentScore: 0.0,
    themeIndex: 1 // User Interface & Experience
  },
  {
    content: "A quick request to support regarding team permission structures. Received standard documentation.",
    channel: "support_ticket",
    customerLabel: "Admin User",
    sentiment: "NEU",
    sentimentScore: 0.15,
    themeIndex: 5 // Customer Support
  }
];

// Generate deterministic pseudo-random embedding vector
function generateMockEmbedding(text: string): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const vector: number[] = [];
  for (let i = 0; i < 1536; i++) {
    const val = Math.sin(hash + i) * 0.5 + 0.5;
    vector.push(val);
  }
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / (magnitude || 1));
}

async function seed() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for seeding...");

    // Clean existing data
    console.log("Cleaning existing collections...");
    await Feedback.deleteMany({});
    await Theme.deleteMany({});
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Report.deleteMany({});
    await ChatSession.deleteMany({});
    console.log("Existing data cleaned.");

    // 1. Create Workspace
    const workspace = await Workspace.create({
      name: "Acme Analytics Workspace"
    });
    console.log(`Demo Workspace created: ${workspace.name} (${workspace._id})`);

    // 2. Create Users (one per role, password "Demo1234!")
    const passwordHash = await bcrypt.hash("Demo1234!", 10);
    
    const admin = await User.create({
      name: "Alice Admin",
      email: "admin@acme.com",
      passwordHash,
      role: "ADMIN",
      workspaceId: workspace._id as mongoose.Types.ObjectId
    });

    const analyst = await User.create({
      name: "Bob Analyst",
      email: "analyst@acme.com",
      passwordHash,
      role: "ANALYST",
      workspaceId: workspace._id as mongoose.Types.ObjectId
    });

    const viewer = await User.create({
      name: "Charlie Viewer",
      email: "viewer@acme.com",
      passwordHash,
      role: "VIEWER",
      workspaceId: workspace._id as mongoose.Types.ObjectId
    });

    console.log(`Created 3 Users:
      - Admin: ${admin.email}
      - Analyst: ${analyst.email}
      - Viewer: ${viewer.email}`);

    // 3. Create 5-6 Themes
    const themesData = [
      { name: "Pricing & Billing", description: "Feedback on plan costs, subscriptions, invoices, and payment issues", color: "#EF4444" },
      { name: "User Interface & Experience", description: "Design, navigation, layout feedback and suggestions", color: "#3B82F6" },
      { name: "Performance & Reliability", description: "Speed, load times, server errors, page crashes", color: "#10B981" },
      { name: "Feature Requests", description: "User ideas and desires for new tools or capabilities", color: "#F59E0B" },
      { name: "Integrations & API", description: "Slack, Jira, Salesforce connectivity and developer APIs", color: "#8B5CF6" },
      { name: "Customer Support", description: "Interactions with support agents, response time, and helpfulness", color: "#EC4899" }
    ];

    const themes = await Theme.create(
      themesData.map(t => ({ ...t, workspaceId: workspace._id as mongoose.Types.ObjectId }))
    );
    console.log(`Created ${themes.length} Themes.`);

    // 4. Create 120+ Pre-classified Feedback rows
    const feedbacks = [];
    const count = 125;

    for (let i = 0; i < count; i++) {
      const template = feedbackTemplates[i % feedbackTemplates.length];
      const randomNum = Math.floor(Math.random() * 10000);
      
      let finalContent = template.content;
      if (i >= feedbackTemplates.length) {
        finalContent += ` (Ref ID: #${randomNum})`;
      }

      const assignedTheme = themes[template.themeIndex];
      const vector = generateMockEmbedding(finalContent);

      feedbacks.push({
        content: finalContent,
        channel: template.channel,
        sourceRef: `src-ref-${1000 + i}`,
        customerLabel: template.customerLabel,
        sentiment: template.sentiment,
        sentimentScore: template.sentimentScore,
        status: i % 3 === 0 ? 'ACTIONED' : i % 3 === 1 ? 'REVIEWED' : 'NEW',
        themeIds: [{ themeId: assignedTheme._id, confidence: 0.98 }],
        embedding: vector,
        workspaceId: workspace._id as mongoose.Types.ObjectId,
        // Distribute creation dates over the last 30 days
        createdAt: new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000)
      });
    }

    await Feedback.create(feedbacks as any);
    console.log(`Created ${count} Pre-classified Feedback logs.`);

    // 5. Pre-generate One Reports Document
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date();

    const reportContentJson = {
      stats: {
        topThemes: [
          { name: "Performance & Reliability", count: 32 },
          { name: "User Interface & Experience", count: 28 },
          { name: "Pricing & Billing", count: 25 },
          { name: "Feature Requests", count: 22 },
          { name: "Integrations & API", count: 18 }
        ],
        sentimentShift: { current: 0.15, previous: 0.08, shift: 0.07 },
        verbatimQuotes: [
          "The dashboard loads incredibly fast now. The charts are super intuitive and easy to read. Great job team!",
          "This app keeps crashing every time I try to upload a large CSV file. Extremely frustrating.",
          "The new integration with Slack is a game changer for our team. We get real-time alerts instantly.",
          "Our team is facing significant latency issues in the EU region. Page loads take up to 10 seconds."
        ]
      },
      narrative: {
        summary: "During this 30-day review period, customer satisfaction is trending positively with a net sentiment index shift of +0.07. Performance optimizations on the core dashboard charts have been widely praised for load speed improvements. However, friction points persist around large file CSV bulk uploads crashing and European region latency. Recommended actions include optimizing bulk parser chunking, scaling EU edge endpoints, and expanding integration endpoints.",
        recommendedActions: [
          "Implement chunked streaming parsing for multer bulk CSV uploads to prevent memory crashes.",
          "Provision dedicated database read-replicas or edge routing in the EU-West region to solve latency issues.",
          "Publish official webhook authentication guidelines in the developer API documentation portal."
        ]
      }
    };

    await Report.create({
      title: "VoC Digest: Boot Seed Analytics Report",
      periodStart: start,
      periodEnd: end,
      contentJson: reportContentJson,
      workspaceId: workspace._id as mongoose.Types.ObjectId,
      generatedBy: admin._id as mongoose.Types.ObjectId
    });
    console.log("Pre-generated 1 Insights Report document successfully.");

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
