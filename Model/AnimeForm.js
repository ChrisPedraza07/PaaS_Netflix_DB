//Including the Connection.js file -- connecting to database
const connection = require('./connection');


// Filter records based on query parameters
async function getAll(parameters = {}) {
    let selectSql = `
    SELECT 
      AnimeForm.id AS anime_id,
      AnimeForm.anime_title,
      AnimeForm.date,
      AnimeForm.rating,
      AnimeForm.title_image,
      AnimeForm.style,
      AnimeForm.show_summary,
      AnimeForm.num_of_seasons,
      AnimeForm.stars,
      publisher.id AS publisher_id,
      publisher.name AS publisher_name,
      publisher.country,
      publisher.city
    FROM AnimeForm
    INNER JOIN publisher ON AnimeForm.publisher_id = publisher.id
    `;


    let queryParameters = [];
    let whereAdded = false;

    // Add filters to the query
    if (parameters.title && parameters.title.trim() !== "") {
        selectSql += ` WHERE anime_title LIKE ?`;
        queryParameters.push(`%${parameters.title}%`);
        whereAdded = true;
    }
    if (parameters.date && parameters.date.trim() !== "") {
        selectSql += (whereAdded ? " AND" : " WHERE") + ` date LIKE ?`;
        queryParameters.push(`%${parameters.date}%`);
        whereAdded = true;
    }
    if (parameters.publisher_name && parameters.publisher_name.trim() !== "") {
        selectSql += (whereAdded ? " AND" : " WHERE") + ` publisher.name LIKE ?`;
        queryParameters.push(`%${parameters.publisher_name}%`);
        whereAdded = true;
    }
    if (parameters.rating && parameters.rating.trim() !== "") {
        selectSql += (whereAdded ? " AND" : " WHERE") + ` rating = ?`;
        queryParameters.push(parameters.rating);
        whereAdded = true;
    }
    if (parameters.style && parameters.style.trim() !== "") {
        selectSql += (whereAdded ? " AND" : " WHERE") + ` style = ?`;
        queryParameters.push(parameters.style);
        whereAdded = true;
    }
    if (parameters.stars !== undefined && parameters.stars !== "") {
        const stars = parseInt(parameters.stars, 10);
        if (!isNaN(stars)) {
            selectSql += (whereAdded ? " AND" : " WHERE") + ` stars = ?`;
            queryParameters.push(stars);
        }
    }

    const allowedSorts = [
        'anime_title', 
        'date', 
        'rating', 
        'style', 
        'stars', 
        'publisher_name', 
        'num_of_seasons'
    ];

    if (parameters.sortBy && allowedSorts.includes(parameters.sortBy)) {
        selectSql += ` ORDER BY ${parameters.sortBy}`;
    } else {
        selectSql += ` ORDER BY anime_title`; // Default sorting
    }

    // Apply limit (ensure the limit is correctly handled)
    let limit = 10; // Default limit value
    if (parameters.limit && !isNaN(parameters.limit)) {
        limit = parseInt(parameters.limit, 10); // Ensure it's an integer
    }
    
    // Add the LIMIT clause directly to the query
    selectSql += ` LIMIT ${limit}`; // Insert the limit directly here

    console.log('SQL Query:', selectSql); // Log the SQL for debugging
    console.log('Query Params:', queryParameters); // Log the parameters being passed

    return await connection.query(selectSql, queryParameters);
}


async function getById(id) {
    let selectSql = `
    SELECT 
      AnimeForm.id AS anime_id,
      AnimeForm.anime_title,
      AnimeForm.date,
      AnimeForm.rating,
      AnimeForm.title_image,
      AnimeForm.style,
      AnimeForm.show_summary,
      AnimeForm.num_of_seasons,
      AnimeForm.stars,
      publisher.id AS publisher_id,
      publisher.name AS publisher_name,
      publisher.country,
      publisher.city
    FROM AnimeForm
    INNER JOIN publisher ON AnimeForm.publisher_id = publisher.id
    WHERE AnimeForm.id = ?`;  // Filter by ID

    let queryParameters = [id];  // Add the ID as the query parameter

    console.log('SQL Query for getById:', selectSql);  // Debugging SQL query
    console.log('Query Params for getById:', queryParameters);  // Debugging query params

    // Execute the query
    const result = await connection.query(selectSql, queryParameters);

    // Return the result, assuming the result is an array with one element
    return result[0]; // Return the first row (single record)
}


async function insert(parameters = {}) {
    let insertSql = `INSERT INTO AnimeForm (anime_title, date, rating, title_image, style, show_summary, num_of_seasons, stars, publisher_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    let queryParameters = [
        parameters.anime_title,
        parameters.date,
        parameters.rating,
        parameters.title_image, // file path
        parameters.style,
        parameters.show_summary,
        parameters.num_of_seasons,
        parameters.stars,
        parameters.publisher_id 
    ];

    return await connection.query(insertSql, queryParameters);
}

async function edit(id, parameters = {}) {
    let updateSql = `
        UPDATE AnimeForm 
        SET anime_title = ?, 
            date = ?, 
            rating = ?, 
            title_image = ?, 
            style = ?, 
            show_summary = ?, 
            num_of_seasons = ?, 
            stars = ? 
        WHERE id = ?`;

    let queryParameters = [
        parameters.anime_title ?? null,
        parameters.date ?? null,
        parameters.rating ?? null,
        parameters.title_image ?? null,
        parameters.style ?? null,
        parameters.show_summary ?? null,
        parameters.num_of_seasons ?? null,
        parameters.stars ?? null,
        id
    ];
    console.log("EDIT PARAMS:", queryParameters);

    return await connection.query(updateSql, queryParameters);
}

async function deleteById(id) {
    if (!id || isNaN(id)) {
        throw new Error("Invalid ID");
    }
    let deleteSql = `DELETE FROM AnimeForm WHERE id = ?`;
    let queryParameters = [id];
    return await connection.query(deleteSql, queryParameters);
}



module.exports = {
    getAll,
    getById,
    insert,
    edit,
    deleteById
};
