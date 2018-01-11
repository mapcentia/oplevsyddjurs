var express = require('express');
var router = express.Router();
var http = require('http');
var request = require('request');

router.get('/api/extension/oplevsyddjurs', function (req, response) {
    var url;

    url = "http://oplevtestsite.test-subsites.syddjurs.dk/os2web-taxonomies-tax-places-data";

    var options = {
        method: 'GET',
        uri: url,
        auth: {
            'user': 'syddjurs',
            'pass': 'syddjurs',
            'sendImmediately': false
        }
    };

    request.get(options, function (err, res, body) {

        if (err) {

            response.header('content-type', 'application/json');
            response.status(400).send({
                success: false,
                message: "Kunne ikke hente tax-places-data"
            });

            return;
        }

        response.send(JSON.parse(body));
    })
});
module.exports = router;
