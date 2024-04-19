const Joi = require('joi');
const sql = require('mssql');

module.exports = async function (context, req) {
    const schema = Joi.object({
        filmTitle: Joi.string().required(),
        opinion: Joi.string().required(),
        rating: Joi.number().integer().min(1).max(10).required(),
        date: Joi.date().iso().required(),
        author: Joi.string().required(),
        code: Joi.string().optional()
    });

    const validationResult = schema.validate(req.body);
    if (validationResult.error) {
        context.res = {
            status: 400,
            body: validationResult.error.details[0].message
        };
        return;
    }

    const reviewInfo = req.body;

    try {
        await sql.connect(process.env.AzureSQLConnectionString);
        
        const tableCheck = await sql.query`IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'Reviews') CREATE TABLE Reviews (FilmTitle NVARCHAR(100), Opinion NVARCHAR(MAX), Rating INT, Date DATE, Author NVARCHAR(100))`;
        console.log('Table check complete.');

        const result = await sql.query`INSERT INTO Reviews (FilmTitle, Opinion, Rating, Date, Author) VALUES (${reviewInfo.filmTitle}, ${reviewInfo.opinion}, ${reviewInfo.rating}, ${reviewInfo.date}, ${reviewInfo.author})`;
        sql.close();
        context.res = {
            status: 200,
            body: "Review information saved successfully."
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: err.message
        };
    }
};