import { Feedback, Theme } from '../models';
import { classifyFeedback, getEmbedding } from './ai';

const getRandomColor = () => {
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export async function classifyFeedbackDocument(feedbackId: string): Promise<void> {
  const feedbackDoc = await Feedback.findById(feedbackId);
  if (!feedbackDoc) {
    console.error(`Classifier: Feedback doc not found for ID ${feedbackId}`);
    return;
  }

  try {
    // 1. Fetch existing themes in this workspace
    const existingThemes = await Theme.find({ workspaceId: feedbackDoc.workspaceId });
    const existingThemeNames = existingThemes.map(t => t.name);

    // 2. Call AI classification service
    const results = await classifyFeedback(feedbackDoc.content, existingThemeNames);

    // 3. Map returned themes to ObjectIds
    const themeConfidenceList = [];
    
    for (const themeName of results.themes) {
      // Find theme case-insensitively
      let matchedTheme = existingThemes.find(
        t => t.name.toLowerCase() === themeName.toLowerCase()
      );

      if (!matchedTheme) {
        // Create new theme in the workspace dynamically using upsert to avoid race conditions
        matchedTheme = await Theme.findOneAndUpdate(
          { 
            name: { $regex: new RegExp(`^${themeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, 
            workspaceId: feedbackDoc.workspaceId 
          },
          {
            $setOnInsert: {
              name: themeName,
              description: `Automatically created via AI classifier during review. Primary area: ${results.featureArea}.`,
              color: getRandomColor()
            }
          },
          { upsert: true, new: true }
        );
        
        if (matchedTheme) {
          existingThemes.push(matchedTheme);
        }
      }

      if (matchedTheme) {
        themeConfidenceList.push({
          themeId: matchedTheme._id as any,
          confidence: 0.95 // High confidence from AI classifier
        });
      }
    }

    // 4. Get embedding vector
    const embedding = await getEmbedding(feedbackDoc.content).catch(err => {
      console.warn(`Classifier: Failed to retrieve embedding vector for document:`, err);
      return null;
    });

    // 5. Save updates to document
    feedbackDoc.sentiment = results.sentiment;
    feedbackDoc.sentimentScore = results.sentimentScore;
    feedbackDoc.themeIds = themeConfidenceList;
    feedbackDoc.needsReview = false;
    if (embedding) {
      feedbackDoc.embedding = embedding;
    }
    await feedbackDoc.save();

    console.log(`Classifier: Successfully classified feedback ID ${feedbackDoc._id} (Sentiment: ${results.sentiment})`);
  } catch (error) {
    console.error(`Classifier: Failed to classify feedback ID ${feedbackDoc._id}. Marking needsReview: true. Error:`, error);
    
    // Set needsReview: true on document instead of crashing
    feedbackDoc.needsReview = true;
    feedbackDoc.status = 'NEW';
    await feedbackDoc.save().catch(err => {
      console.error(`Classifier: Double fault failing to save error status on feedback ID ${feedbackId}`, err);
    });
  }
}
