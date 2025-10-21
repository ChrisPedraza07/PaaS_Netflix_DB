const connection = require('./connection');


async function getAllPublishers(parameters = {}) {
    let selectSql = `
    SELECT 
      publisher.id AS publisher_id,
      publisher.name AS publisher_name
    FROM publisher
    `;

    let queryParameters = [];

    if (parameters.name && parameters.name.trim() !== "") {
        selectSql += ` WHERE publisher.name LIKE ?`;
        queryParameters.push(`%${parameters.name}%`);
    }

    try {
        console.log("Executing SQL Query:", selectSql); // Log the query for debugging
        const results = await connection.query(selectSql, queryParameters);
        console.log("Query Results:", results); // Log the results for debugging
        return results;
    } catch (error) {
        console.error("Error fetching publishers:", error);
        throw error; // Rethrow the error for handling in the calling function
    }
}


module.exports = {
    getAllPublishers
};


