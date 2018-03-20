var express = require('express');
var router = express.Router();
var http = require('http');
var request = require('request');

router.get('/api/extension/oplevsyddjurs', function (req, response) {
    var url;

    url = "https://oplevsyddjurs.dk/os2web-taxonomies-tax-places-data";

    var options = {
        rejectUnauthorized: false,
        method: 'GET',
        uri: url
    };

    request.get(options, function (err, res, body) {
        if (err) {

            response.header('content-type', 'application/json');
            response.status(400).send({
                success: false,
                message: err
            });

            return;
        }

        response.send(JSON.parse(body));
    })
});
module.exports = router;
