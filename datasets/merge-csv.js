const fs = require('fs');
const csv = require('csv-parser');
const papa = require('papaparse');

const episodeFile = 'dateDataCleaned.csv';
const subjectMatterFile = 'subjectMatterCleaned.csv';
const colorsUsedFile = 'colorsUsedCleaned.csv';

const cleanedData = [];

// read all datasets into memory
function mergeData() {
  const episodeData = [];
  const subjectMatterData = [];
  const colorsUsedData = [];

  // read ep data
  fs.createReadStream(episodeFile)
    .pipe(csv())
    .on('data', (row) => episodeData.push(row))
    .on('end', () => {
      console.log('Episode data loaded');

      // read subject matter data
      fs.createReadStream(subjectMatterFile)
        .pipe(csv())
        .on('data', (row) => {
          const subjectsUsed = [];
          // skip columns to get subjects
          const subjectNames = Object.keys(row).slice(2);

          subjectNames.forEach((subject) => {
            if (row[subject] === '1') {
              subjectsUsed.push(subject);
            }
          });

          // store transformed data
          subjectMatterData.push({
            TITLE: row.TITLE,
            SUBJECT_MATTER: subjectsUsed.join(', '),
          });
        })
        .on('end', () => {
          console.log('Subject matter data loaded');

          // read colors used data
          fs.createReadStream(colorsUsedFile)
            .pipe(csv())
            .on('data', (row) => {
              const colorUsed = [];

              const colorNames = Object.keys(row).slice(9);

              colorNames.forEach((color) => {
                if (row[color] === '1') {
                  colorUsed.push(color);
                }
              });

              colorsUsedData.push({
                TITLE: row.TITLE,
                COLORS_USED: colorUsed.join(', '),
              });
            })
            .on('end', () => {
              console.log('Colors used data loaded');

              // combine data based on title
              for (let i = 0; i < colorsUsedData.length; i++) {
                const colorRow = colorsUsedData[i];
                const subjectRow = subjectMatterData[i];
                const dateRow = episodeData[i];

                // merge datasets to single object for each row
                if (subjectRow && dateRow) {
                  const mergedRow = {
                    TITLE: colorRow.TITLE,
                    COLORS_USED: colorRow.COLORS_USED,
                    SUBJECT_MATTER: subjectRow.SUBJECT_MATTER,
                    EPISODE_DATE: dateRow.date,
                  };

                  cleanedData.push(mergedRow);
                }
              }
              // save merged data to new CSV file
              const csvOutput = papa.unparse(cleanedData);
              fs.writeFileSync('../datasets/MergedCleanedData.csv', csvOutput);
              console.log('Merged cleaned data saved to MergedCleanedData.csv');
            });
        });
    });
}

mergeData();