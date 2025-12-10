const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

const server = require("./server/server");

exports.server = onRequest({ region: "europe-west1" }, (req, rest) => {
    logger.info("Received request", {structuredData: true});
    server.emit("request", req, rest);
});

setGlobalOptions({ maxInstances: 1 });
