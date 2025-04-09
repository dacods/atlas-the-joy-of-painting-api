const csv = require('csv-parser');
const papa = require('papaparse');
const fs = require('fs');

// File paths
const colorsUsed = 'color_data.csv';
const subjectMatter = 'subject_data.csv';
const episodeDates = 'episode_data.csv';

// Create output directory if it doesn't exist
const outputDir = '../datasets';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}

// Simple title case function
function toTitleCase(str) {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

// Extract date and note from title
function extractInfoFromTitle(title) {
  if (!title) return { cleanTitle: '', date: null, note: null };
  
  // First, handle case where there's no parentheses
  if (!title.includes('(')) {
    return { cleanTitle: title.trim(), date: null, note: null };
  }
  
  // Look for content in parentheses
  const parenthesesPattern = /\(([^)]+)\)/g;
  const matches = [...title.matchAll(parenthesesPattern)];
  
  let dateStr = null;
  let note = null;
  
  // If we have at least one set of parentheses, try to extract date
  if (matches.length > 0) {
    const firstParenContent = matches[0][1].trim();
    
    // Try to parse as date
    try {
      const parsedDate = new Date(firstParenContent);
      if (!isNaN(parsedDate.getTime())) {
        dateStr = parsedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      } else {
        // If not a date, it might be a note
        note = firstParenContent;
      }
    } catch (e) {
      // If parsing fails, treat as note
      note = firstParenContent;
    }
  }
  
  // If we have a second set of parentheses, it's likely a note
  if (matches.length > 1) {
    note = matches[1][1].trim();
  }
  
  // Remove all parenthetical content to get clean title
  let cleanTitle = title.replace(/\s*\([^)]*\)/g, '').trim();
  // Remove quotes around the title if present
  cleanTitle = cleanTitle.replace(/^["']+|["']+$/g, '').trim();
  
  return { cleanTitle, date: dateStr, note };
}

function cleanSubjectData(fileName, outputFileName) {
  // Check if input file exists
  if (!fs.existsSync(fileName)) {
    console.error(`Error: Input file not found: ${fileName}`);
    return;
  }

  // read csv files
  const cleanedData = [];

  fs.createReadStream(fileName)
    .pipe(csv())
    .on('data', (row) => {
      // Create a copy of the row to modify
      const cleanedRow = { ...row };
      
      if (cleanedRow.TITLE) {
        const { cleanTitle, date, note } = extractInfoFromTitle(cleanedRow.TITLE);
        cleanedRow.TITLE = toTitleCase(cleanTitle);
        
        // Add date and note if extracted
        if (date) cleanedRow.date = date;
        if (note) cleanedRow.note = note;
      }

      cleanedData.push(cleanedRow);
    })
    .on('error', (error) => {
      console.error(`Error reading ${fileName}: ${error.message}`);
    })
    .on('end', () => {
      const csvOutput = papa.unparse(cleanedData);

      try {
        fs.writeFileSync(outputFileName, csvOutput);
        console.log(`Cleaned data saved to ${outputFileName}`);
      } catch (error) {
        console.error(`Error writing to ${outputFileName}: ${error.message}`);
      }
    });
}

function cleanColorData(fileName, outputFileName) {
  // Check if input file exists
  if (!fs.existsSync(fileName)) {
    console.error(`Error: Input file not found: ${fileName}`);
    return;
  }

  // read csv files
  const cleanedData = [];

  fs.createReadStream(fileName)
    .pipe(csv())
    .on('data', (row) => {
      // Create a copy of the row to modify
      const cleanedRow = { ...row };
      
      // For the color data file, check if the column is painting_title instead of TITLE
      if (cleanedRow.painting_title) {
        const { cleanTitle, date, note } = extractInfoFromTitle(cleanedRow.painting_title);
        cleanedRow.painting_title = toTitleCase(cleanTitle);
        
        // Add date and note if extracted
        if (date) cleanedRow.date = date;
        if (note) cleanedRow.note = note;
      } else if (cleanedRow.TITLE) {
        const { cleanTitle, date, note } = extractInfoFromTitle(cleanedRow.TITLE);
        cleanedRow.TITLE = toTitleCase(cleanTitle);
        
        // Add date and note if extracted
        if (date) cleanedRow.date = date;
        if (note) cleanedRow.note = note;
      }

      cleanedData.push(cleanedRow);
    })
    .on('error', (error) => {
      console.error(`Error reading ${fileName}: ${error.message}`);
    })
    .on('end', () => {
      const csvOutput = papa.unparse(cleanedData);

      try {
        fs.writeFileSync(outputFileName, csvOutput);
        console.log(`Cleaned data saved to ${outputFileName}`);
      } catch (error) {
        console.error(`Error writing to ${outputFileName}: ${error.message}`);
      }
    });
}

function cleanDateData(fileName, outputFileName) {
  // Check if input file exists
  if (!fs.existsSync(fileName)) {
    console.error(`Error: Input file not found: ${fileName}`);
    return;
  }

  const cleanedData = [];

  fs.createReadStream(fileName)
    .pipe(csv())
    .on('data', (row) => {
      // Create a copy of the row to modify
      const cleanedRow = { ...row };
      
      if (cleanedRow.TITLE) {
        const { cleanTitle, date, note } = extractInfoFromTitle(cleanedRow.TITLE);
        cleanedRow.TITLE = toTitleCase(cleanTitle);
        
        // Add extracted date
        if (date) {
          cleanedRow.date = date;
        }
        
        // Add extracted note
        if (note) {
          cleanedRow.note = note;
        }
      }

      // Keep any existing date or note if not already set
      if (row.date && !cleanedRow.date) {
        const parsedDate = new Date(row.date);
        if (!isNaN(parsedDate.getTime())) {
          cleanedRow.date = parsedDate.toISOString().split('T')[0];
        }
      }
      
      if (row.note && !cleanedRow.note) {
        cleanedRow.note = row.note;
      }

      cleanedData.push(cleanedRow);
    })
    .on('error', (error) => {
      console.error(`Error reading ${fileName}: ${error.message}`);
    })
    .on('end', () => {
      if (cleanedData.length === 0) {
        console.error(`No data was read from ${fileName}`);
        return;
      }
      
      // Debug: Log first 5 rows to verify extraction
      console.log("Sample of processed date data (first 5 rows):");
      for (let i = 0; i < Math.min(5, cleanedData.length); i++) {
        console.log(`Row ${i+1}: Title="${cleanedData[i].TITLE}", Date=${cleanedData[i].date}, Note=${cleanedData[i].note}`);
      }
      
      const csvOutput = papa.unparse(cleanedData);

      try {
        fs.writeFileSync(outputFileName, csvOutput);
        console.log(`Cleaned data saved to ${outputFileName}`);
      } catch (error) {
        console.error(`Error writing to ${outputFileName}: ${error.message}`);
      }
    });
}

// Log which files we're processing
console.log(`Processing colors file: ${colorsUsed}`);
console.log(`Processing subject file: ${subjectMatter}`);
console.log(`Processing dates file: ${episodeDates}`);

// Run the cleaning functions
cleanSubjectData(subjectMatter, `${outputDir}/subjectMatterCleaned.csv`);
cleanColorData(colorsUsed, `${outputDir}/colorsUsedCleaned.csv`);
cleanDateData(episodeDates, `${outputDir}/dateDataCleaned.csv`);

console.log('Cleaning process initiated for all files.');