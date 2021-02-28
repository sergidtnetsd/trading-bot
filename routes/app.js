"use strict";

/**
 * Module dependencies
 */
const logger = require('../api/logger');
const moment = require('moment');
const { v1: uuidv1 } = require('uuid');
const kraken = require('../api/exchanges/kraken/apis');
const tradingControl = require('../api/tradingControl');
//const TeleBot = require('telebot')
const telegramCommands = require('../api/telegram/commands');
const config = require('../config/config');

const TEST_MODE = true;
const REAL_MODE = false;

/**
 * Package Functions
 */

exports.Get = async function (req, res) {
    res.status(200).send('OK')
};

/**
 * Funció que rep l'ordre de vendre o comprar una criptomoneda
 * Informa per telegram de la recepció de l'ordre
 * Laidea es que s'envii des del TrandingView
 * @param {*} req : req.body ha de contenir { "action": "buy"/"sell", "pair": "XBT/EUR" }  
 *                  action: comprar o vendre
 *                  pair: el que es comprarà i amb quina modeda separat per un "/"
 * @param {*} res 
 * 
 * Retorna un objecte del tipus: { "error" : [], "result" : { "descr" : action + " " + volume + " " + pair + " @ market", "txid" : [ "OAVY7T-MV5VK-KHDF5X" ] } }
 */
exports.Post = async function (req, res) {

    let postId = uuidv1();

    // Enviem missatge al telegram de l'usuari per indicar que hem rebut un post
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    logger.info(postId + `: Rebut POST des de ` + ip + ` amb les dades ` + JSON.stringify(req.body));
    await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, 
        `Rebut POST des de ` + ip + ` amb les dades ` + JSON.stringify(req.body)
    );

    // Validem les dades rebudes
    if (typeof req.body === "undefined") {
        logger.info(postId + ": request body can not be undefined");
        await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, "request body can not be undefined");
        return res.status(400).json({ error: [ "request body can not be undefined" ] });
    }
    if (req.body === null) {
        logger.info(postId + ": request body can not be null");
        await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, "request body can not be null");
        return res.status(400).json({ error: [ "request body can not be null" ] });
    }
    if (Object.keys(req.body).length <= 0) {
        logger.info(postId + ": request body can not be empty");
        await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, "request body can not be empty");
        return res.status(400).json({ error: [ "request body can not be empty" ] });
    }
    if (!req.body.hasOwnProperty("token")) {
        logger.info(postId + ": request body must have property \"token\"");
        await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, "request body must have property \"token\"");
        return res.status(400).json({ error: [ "request body must have property \"token\"" ] });
    }
    if (req.body.token != config.APP_TOKEN) {
        logger.info(postId + ": Token invalid");
        await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, "Token invalid");
        return res.status(400).json({ error: [ "Token invalid" ] });
    }
    if (!req.body.hasOwnProperty("action")) {
        logger.info(postId + ": request body must have property \"action\"");
        await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, "request body must have property \"action\"");
        return res.status(400).json({ error: [ "request body must have property \"action\"" ] });
    }
    if (req.body.action != "buy" && req.body.action != "sell") {
        logger.info(postId + ": request body property \"action\" only accepts values \"buy\" or \"sell\"");
        await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, "request body property \"action\" only accepts values \"buy\" or \"sell\"");
        return res.status(400).json({ error: [ "request body property \"action\" only accepts values \"buy\" or \"sell\"" ] });
    }
    if (!req.body.hasOwnProperty("pair")) {
        logger.info(postId + ": request body must have property \"pair\"");
        await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, "request body must have property \"pair\"");
        return res.status(400).json({ error: [ "request body must have property \"pair\"" ] });
    }

    // Creem l'ordre
    let addOrderResult = await tradingControl.addOrder(kraken, req.body.action, req.body.pair, REAL_MODE);

    // Retornem el resultat
    if (addOrderResult.error && Array.isArray(addOrderResult) && addOrderResult.length > 0) {
        logger.error(postId + ": Ordre creada amb error " + JSON.stringify(addOrderResult));
        await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, "Ordre creada amb error " + JSON.stringify(addOrderResult));
        res.status(500).json(addOrderResult);
    } else {
        logger.info(postId + ": Ordre creada amb dades " + JSON.stringify(addOrderResult));
        await telegramCommands.sendMessage(config.TELEGRAM.USER_ID, "Ordre creada amb dades " + JSON.stringify(addOrderResult));
        res.status(200).json(addOrderResult);
    }
};