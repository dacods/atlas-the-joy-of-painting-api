const csv = require('csv-parser');
const papa = require('papaparse');
const fs = require('fs');

// Function to convert string to title case
function toTitleCase(str) {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

// Function to extract date and note from a string with format "Title (Month Day, Year) Special guest ..."
function extractInfoFromTitle(title) {
  if (!title) return { cleanTitle: '', date: null, note: '' };
  
  // Look for a pattern like "(January 11, 1983)"
  const datePattern = /\(([^)]+)\)/;
  const match = title.match(datePattern);
  
  let cleanTitle = title;
  let date = null;
  let note = '';
  
  if (match && match[1]) {
    const dateStr = match[1].trim();
    try {
      // Try to parse the date
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        // Format as YYYY-MM-DD
        date = parsedDate.toISOString().split('T')[0];
        
        // Find where the date parentheses end
        const dateEndPos = title.indexOf(')', title.indexOf(dateStr)) + 1;
        
        // Check if there's anything after the date
        if (dateEndPos < title.length) {
          const textAfterDate = title.substring(dateEndPos).trim();
          
          // Check if this text contains "Special guest" or similar
          if (textAfterDate.toLowerCase().includes('guest')) {
            note = textAfterDate;
            cleanTitle = title.substring(0, title.indexOf('(', 0)).trim();
          } else {
            cleanTitle = title.substring(0, dateEndPos).trim();
          }
        } else {
          cleanTitle = title.substring(0, dateEndPos).trim();
        }
      }
    } catch (e) {
      console.warn(`Could not parse date from: ${dateStr}`);
    }
  }
  
  // Remove the date part and any trailing parentheses
  cleanTitle = cleanTitle.replace(datePattern, '').trim();
  // Remove quotes if present
  cleanTitle = cleanTitle.replace(/^["']+|["']+$/g, '').trim();
  
  return { cleanTitle, date, note };
}

// Process the episode data file
function processDates(inputFile, outputFile) {
  // Read the file as raw text first to examine the structure
  const content = fs.readFileSync(inputFile, 'utf8');
  
  // Now process line by line for more control
  const lines = content.split('\n');
  const header = lines[0]; // Should be "TITLE,date,note"
  
  const parsedData = [];
  
  // Process header
  const headerColumns = header.split(',');
  
  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Extract the full title part (including date and possible special guest)
    const fullTitle = line;
    
    // Extract date and note from title and clean title
    const { cleanTitle, date, note } = extractInfoFromTitle(fullTitle);
    
    // Create a row with the extracted data
    const row = {
      TITLE: cleanTitle,
      date: date || '', // Use extracted date
      note: note || '' // Use extracted note
    };
    
    parsedData.push(row);
  }
  
  // Output the processed data
  const csvOutput = papa.unparse(parsedData);
  fs.writeFileSync(outputFile, csvOutput);
  console.log(`Processed data saved to ${outputFile}`);
}

// Process the file
const inputFile = 'episode_data.csv';
const outputFile = '../datasets/dateDataCleaned.csv';

// Create output directory if needed
const outputDir = '../datasets';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

processDates(inputFile, outputFile);
console.log('Processing completed.');