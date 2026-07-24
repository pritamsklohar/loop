const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/loop').then(async () => {
  try {
    const db = mongoose.connection.db;
    
    // Process each workspace separately
    const workspaces = await db.collection('workspaces').find({}).toArray();
    
    for (const workspace of workspaces) {
      console.log('Processing workspace:', workspace.name);
      
      const themes = await db.collection('themes').find({ workspaceId: workspace._id }).toArray();
      const themeMap = new Map();
      
      for (const theme of themes) {
        const lowerName = theme.name.toLowerCase();
        if (!themeMap.has(lowerName)) {
          themeMap.set(lowerName, []);
        }
        themeMap.get(lowerName).push(theme);
      }
      
      for (const [lowerName, duplicateThemes] of themeMap.entries()) {
        if (duplicateThemes.length > 1) {
          console.log(`Found ${duplicateThemes.length} duplicates for theme: ${lowerName}`);
          
          // Use the first one as canonical
          const canonicalTheme = duplicateThemes[0];
          
          for (let i = 1; i < duplicateThemes.length; i++) {
            const dup = duplicateThemes[i];
            
            // Reassign feedbacks using this duplicate theme to use the canonical theme instead
            const result = await db.collection('feedbacks').updateMany(
              { 'themeIds.themeId': dup._id },
              { $set: { 'themeIds.$[elem].themeId': canonicalTheme._id } },
              { arrayFilters: [ { 'elem.themeId': dup._id } ] }
            );
            
            console.log(`  - Reassigned ${result.modifiedCount} feedbacks from duplicate ${dup._id}`);
            
            // Delete the duplicate theme
            await db.collection('themes').deleteOne({ _id: dup._id });
            console.log(`  - Deleted duplicate theme ${dup._id}`);
          }
        }
      }
    }
    
    console.log('Done merging duplicates.');
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
});
