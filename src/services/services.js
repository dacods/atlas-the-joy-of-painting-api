const db = require('../db');

const episodeService = {
  getFilteredEpisodes: (filters) => {
    const { month, subjects, colors, match } = filters;
    const queryParams = [];
    let whereClauses = [];

    // Filter by month
    if (month) {
      queryParams.push(parseInt(month));
      whereClauses.push(`MONTH(e.air_date) = ?`);
    }

    // Filter by subjects
    if (subjects) {
      const subjectList = subjects.split(',').map(s => s.trim());
      
      whereClauses.push(`
        e.id IN (
          SELECT es.episode_id
          FROM EpisodeSubject es
          JOIN Subject s ON es.subject_id = s.id
          WHERE s.name IN (${subjectList.map(() => '?').join(',')})
        )
      `);
      queryParams.push(...subjectList);
    }

    // Filter by colors
    if (colors) {
      const colorList = colors.split(',').map(c => c.trim());
      
      whereClauses.push(`
        e.id IN (
          SELECT ec.episode_id
          FROM EpisodeColor ec
          JOIN Color c ON ec.color_id = c.id
          WHERE c.name IN (${colorList.map(() => '?').join(',')})
        )
      `);
      queryParams.push(...colorList);
    }

    // Base query
    let queryString = `
      SELECT 
        e.id,
        e.episode_number,
        e.title,
        e.air_date,
        (
          SELECT GROUP_CONCAT(s.name)
          FROM EpisodeSubject es
          JOIN Subject s ON es.subject_id = s.id
          WHERE es.episode_id = e.id
        ) AS subjects,
        (
          SELECT GROUP_CONCAT(c.name)
          FROM EpisodeColor ec
          JOIN Color c ON ec.color_id = c.id
          WHERE ec.episode_id = e.id
        ) AS colors
      FROM Episode e
    `;

    if (whereClauses.length > 0) {
      const operator = match === 'all' ? 'AND' : 'OR';
      queryString += ` WHERE ${whereClauses.join(` ${operator} `)}`;
    }

    queryString += ' ORDER BY e.episode_number;';

    return {
      text: queryString,
      values: queryParams
    };
  },

  getEpisodeById: (id) => {
    return {
        text: `
        SELECT 
            e.id,
            e.episode_number,
            e.title,
            DATE_FORMAT(e.air_date, '%Y-%m-%d') AS air_date,
            (
            SELECT GROUP_CONCAT(s.name SEPARATOR ',')
            FROM EpisodeSubject es
            JOIN Subject s ON es.subject_id = s.id
            WHERE es.episode_id = e.id
            ) AS subjects,
            (
            SELECT GROUP_CONCAT(c.name SEPARATOR ',')
            FROM EpisodeColor ec
            JOIN Color c ON ec.color_id = c.id
            WHERE ec.episode_id = e.id
            ) AS colors
        FROM Episode e
        WHERE e.id = ?
        `,
        values: [id]
    };
    }
};

module.exports = episodeService;