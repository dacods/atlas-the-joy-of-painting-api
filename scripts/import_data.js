const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');

const dataFile = '../datasets/MergedCleanedData.csv';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '677620Dl',
  database: 'joy_of_painting',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function importData() {
  console.log('Starting import from', dataFile);
  const rows = [];

  // read data into memory
  await new Promise((resolve, reject) => {
    fs.createReadStream(dataFile)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Read ${rows.length} rows from CSV`);

  // process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // insert episode
      const [episodeResult] = await connection.execute(
        `INSERT INTO Episode (title, air_date, episode_number) 
         VALUES (?, ?, ?)`,
        [row.TITLE, row.EPISODE_DATE || null, i + 1]
      );
      const episodeId = episodeResult.insertId;

      // process colors (if any)
      if (row.COLORS_USED && row.COLORS_USED.trim() !== '') {
        const colors = row.COLORS_USED.split(',').map(c => c.trim()).filter(Boolean);
        
        for (const color of colors) {
          // Insert color if it doesn't exist
          let colorId;
          try {
            const [colorResult] = await connection.execute(
              'INSERT INTO Color (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
              [color]
            );
            colorId = colorResult.insertId;
            
            // If insertId is 0, we need to get the existing ID
            if (colorId === 0) {
              const [rows] = await connection.execute(
                'SELECT id FROM Color WHERE name = ?',
                [color]
              );
              colorId = rows[0].id;
            }
            
            // Link episode to color
            await connection.execute(
              'INSERT INTO EpisodeColor (episode_id, color_id) VALUES (?, ?)',
              [episodeId, colorId]
            );
          } catch (err) {
            console.error(`Error processing color "${color}":`, err.message);
          }
        }
      }

      // process subjects (if any)
      if (row.SUBJECT_MATTER && row.SUBJECT_MATTER.trim() !== '') {
        const subjects = row.SUBJECT_MATTER.split(',').map(s => s.trim()).filter(Boolean);
        
        for (const subject of subjects) {
          try {
            // Insert subject if it doesn't exist
            let subjectId;
            const [subjectResult] = await connection.execute(
              'INSERT INTO Subject (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
              [subject]
            );
            subjectId = subjectResult.insertId;
            
            // If insertId is 0, we need to get the existing ID
            if (subjectId === 0) {
              const [rows] = await connection.execute(
                'SELECT id FROM Subject WHERE name = ?',
                [subject]
              );
              subjectId = rows[0].id;
            }
            
            // Link episode to subject
            await connection.execute(
              'INSERT INTO EpisodeSubject (episode_id, subject_id) VALUES (?, ?)',
              [episodeId, subjectId]
            );
          } catch (err) {
            console.error(`Error processing subject "${subject}":`, err.message);
          }
        }
      }

      await connection.commit();
      console.log(`Inserted episode ${i + 1}/${rows.length}: ${row.TITLE}`);
    } catch (err) {
      await connection.rollback();
      console.error(`Error in episode ${i + 1} (${row.TITLE}):`, err.message);
    } finally {
      connection.release();
    }
  }
}

importData()
  .then(() => {
    console.log('Import complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });