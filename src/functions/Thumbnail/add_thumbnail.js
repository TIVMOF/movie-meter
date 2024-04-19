const azure = require('azure-storage');
const sql = require('mssql');

module.exports = async function (context, req) {
    const title = req.query.title;
    if (!title) {
        context.res = {
            status: 400,
            body: "Title parameter is required."
        };
        return;
    }

    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'no-store'
        }
    };

    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    const accountName = process.env.AccountName;
    const accountKey = process.env.AccountKey;

    const blobService = azure.createBlobService(accountName, accountKey);
    const containerName = 'imdbthumbnails'; 

    try {
        await sql.connect(process.env.AzureSQLConnectionString);
        const result = await sql.query`SELECT ImageUrl FROM Films WHERE Title = ${title}`;
        sql.close();

        if (!result.recordset || result.recordset.length === 0 || !result.recordset[0].ImageUrl) {
            context.res = {
                status: 404,
                body: "Thumbnail image not found for the given title."
            };
            return;
        }

        const imageUrl = result.recordset[0].ImageUrl;
        const sasToken = blobService.generateSharedAccessSignature(containerName, imageUrl, {
            AccessPolicy: {
                Permissions: azure.BlobUtilities.SharedAccessPermissions.READ,
                Expiry: azure.date.minutesFromNow(5)
            },
        });
        const imageUrlWithSAS = blobService.getUrl(containerName, imageUrl, sasToken);

        context.res = {
            status: 200,
            body: { imageUrl: imageUrlWithSAS }
        };
    } catch (err) {
        console.error('Error: ', err);
        context.res = {
            status: 500,
            body: err.message
        };
    }
};