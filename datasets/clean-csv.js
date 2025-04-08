const csv = require('csv-parser');
const papa = require('papaparse');
const fs = require('fs');

function titleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const colorsUsed = 'color_data.csv';
const subjectMatter = 'subject_data.csv';
const episodeDates = 'episode_data.csv';

function cleanSubjectData(fileName, outputFileName) {
  // read csv files
  const cleanedData = [];

  fs.createReadStream(fileName)
    .pipe(csv())
    .on('data', (row) => {
      if (row.TITLE) {
        // remove triple quote and make lowercase
        row.TITLE = row.TITLE.replace(/^["']+|["']+$/g, '').toLowerCase();
        // consistent title case - subject matter
        row.TITLE = titleCase(row.TITLE);
      }

      cleanedData.push(row);
    })
    .on('end', () => {
      const csvOutput = papa.unparse(cleanedData);

      fs.writeFileSync(outputFileName, csvOutput);
      console.log(`cleaned data saved to ${outputFileName}`);
    });
}

function cleanColorData(fileName, outputFileName) {
  // read csv files
  const cleanedData = [];

  fs.createReadStream(fileName)
    .pipe(csv())
    .on('data', (row) => {
      // consistent title case for - colors used
      if (row.TITLE) {
        row.TITLE = titleCase(row.TITLE);
      }

      cleanedData.push(row);
    })
    .on('end', () => {
      const csvOutput = papa.unparse(cleanedData);

      fs.writeFileSync(outputFileName, csvOutput);
      console.log(`cleaned data saved to ${outputFileName}`);
    });
}

function cleanDateData(fileName, outputFileName) {
  const cleanedData = [];

  fs.createReadStream(fileName)
    .pipe(csv())
    .on('data', (row) => {
      if (row.TITLE) {
        row.TITLE = titleCase(row.TITLE);
      }

      if (row.date) {
        row.date = row.date.replace(/[()]/g, '');

        const parsedDate = new Date(row.date);
        if (!isNaN(parsedDate)) {
          row.date = parsedDate.toISOString().split('T')[0];
        } else {
          console.warn(`Invalid date format: ${row.date}`);
          row.date = null;
        }
      }

      cleanedData.push(row);
    })
    .on('end', () => {
      const csvOutput = papa.unparse(cleanedData);

      fs.writeFileSync(outputFileName, csvOutput);
      console.log(`cleaned data saved to ${outputFileName}`);
    });
}

cleanSubjectData(subjectMatter, '../datasets/subjectMatterCleaned.csv');
cleanColorData(colorsUsed, '../datasets/colorsUsedCleaned.csv');
cleanDateData(episodeDates, '../datasets/dateDataCleaned.csv');