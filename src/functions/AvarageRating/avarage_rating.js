const sql = require('mssql');

module.exports = async function (context, myTimer) {
    const timeStamp = new Date().toISOString();

    try {
        await sql.connect(process.env.AzureSQLConnectionString);
        const result = await sql.query`SELECT FilmTitle, AVG(Rating) AS AverageRating FROM Reviews GROUP BY FilmTitle`;
        for (let record of result.recordset) {
            if (!record.FilmTitle || !record.AverageRating) {
                context.log.warn('Invalid data found while calculating average ratings.');
                continue;
            }
            await sql.query`UPDATE Films SET AverageRating = ${record.AverageRating} WHERE Title = ${record.FilmTitle}`;
        }
        sql.close();
        context.log('Average ratings updated successfully.');
    } catch (err) {
        context.log.error(err.message);
    }
};