const mysql = require('mysql2/promise');


let connection = null;


async function query(sql, params) {
    //Singleton DB connection
    if (null === connection) {
        connection = await mysql.createConnection({
            host: "student-databases.cvode4s4cwrc.us-west-2.rds.amazonaws.com",
            user: "chrispedraza",
            password: "rnoAOtmneI3Qjd6fEYsyMndgxymwVoSSY5N",
            database: 'chrispedraza'
        });
    }

    //Stops and waits for the query to finish
    const [results] = await connection.execute(sql, params);
    return results;
   
}


//gives access  to query function so outside files can use it
module.exports = { 
    query 
}
