"use strict";

/**
 * Module dependencies
 */
var config = require('../../config/config');
var logger = require('../logger');
const TeleBot = require('telebot');
var database = require('../database/database');
var kraken = require('../exchanges/kraken/apis');
let tradingControl = require('../tradingControl');

const TEST_MODE = true;
const REAL_MODE = false;

/**
 * Package Functions
 */
const BUTTONS = {
    start: {
        label: '🏁 INICI!',
        command: '/start'
    },
    info: {
        label: '🏁 INFO!',
        command: '/info'
    },
    balance: {
        label: '💰 BALANCE',
        command: '/balance'
    },
    logs: {
        label: '📊 LOGS',
        command: '/logs'
    },
    buy: {
        label: '📉 COMPRA',
        command: '/buy'
    },
    sell: {
        label: '📈 VEN',
        command: '/sell'
    },
    buy_test: {
        label: '📉 COMPRA TEST',
        command: '/buy_test'
    },
    sell_test: {
        label: '📈 VEN TEST',
        command: '/sell_test'
    },
    bot: {
        label: '⚙️ BOT',
        command: '/trading_bot'
    },
    bot_activate: {
        label: '/activate_bot'
    },
    bot_deactivate: {
        label: '/deactivate_bot'
    }
};

const TEXT = {
    wellcome: {
        label: `, Comandes disponibles:\n\n` + 
               `<b>\/balance</b>` +
               `<b>\/buy [pair]</b>, Ex: /buy XBTEUR, /buy XBTUSD, /buy ETHEUR, /buy ADAEUR, /buy USDTEUR\n` +
               `<b>\/buy_test [pair]</b>, Ex: /buy_test XBTEUR\n` +
               `<b>\/sell [pair]</b>, Ex: /sell XBTEUR\n` +
               `<b>\/sell_test [pair]</b>, Ex: /sell_test XBTEUR\n`
    },
    activate_bot: {
        label: `🟢 ACTIVAR BOT`
    },
    activate_bot_description: {
        label: `En este estado el Bot realizará operaciones de forma automática cuando reciba señales de TradingView`
    },
    deactivate_bot: {
        label: `🔴 DESACTIVAR BOT`
    },
    deactivate_bot_description: {
        label: `En este estado el Bot NO realizará ninguna operación de forma automática cuando reciba señales de TradingView`
    },
}

const bot = new TeleBot({
    token: config.TELEGRAM.TOKEN,
    usePlugins: ['askUser', 'namedButtons'],
    pluginConfig: {
        namedButtons: {
            buttons: BUTTONS
        }
    }
});

/**
 * Commands
 */

// Start
bot.on(BUTTONS.start.command, async (msg) => {
    let id = msg.from.id
    let first_name = msg.from.first_name
    let parseMode = 'html';
    // Validación usuario
    if (await database.boolCheckTelegramUser(id)) {
        // Menú Principal
        let replyMarkup = bot.keyboard([
            [BUTTONS.info.label, BUTTONS.balance.label],
            [BUTTONS.buy.label, BUTTONS.sell.label],
            [BUTTONS.logs.label, BUTTONS.bot.label]
        ], { resize: true });
        return bot.sendMessage(id, `<b>` + `👋 Hola ` + first_name+ `</b>` + TEXT.wellcome.label, { replyMarkup, parseMode })
    }
});

// Info
bot.on(BUTTONS.info.command, async (msg) => {
    let id = msg.from.id
    let first_name = msg.from.first_name
    let parseMode = 'html';
    // Validación usuario
    if (await database.boolCheckTelegramUser(id)) {
        // Menú Principal
        let replyMarkup = bot.keyboard([
            [BUTTONS.info.label, BUTTONS.balance.label],
            [BUTTONS.buy.label, BUTTONS.sell.label],
            [BUTTONS.logs.label, BUTTONS.bot.label]
        ], { resize: true });
        return bot.sendMessage(id, `<b>` + `👋 Hola ` + first_name+ `</b>` + TEXT.wellcome.label, { replyMarkup, parseMode })
    }
});

// Balance
bot.on(BUTTONS.balance.command, async (msg) => {
    let id = msg.from.id
    let first_name = msg.from.first_name
    let parseMode = 'html';
    // Validación usuario
    if (await database.boolCheckTelegramUser(id)) {
        // Muestra logs usuario
        var data = await kraken.getBalance()
        // Menú Principal
        let replyMarkup = bot.keyboard([
            [BUTTONS.info.label, BUTTONS.balance.label],
            [BUTTONS.buy.label, BUTTONS.sell.label],
            [BUTTONS.logs.label, BUTTONS.bot.label]
        ], { resize: true });
        return bot.sendMessage(id, `<b>` + data + `</b>`, { replyMarkup, parseMode })
        console.log(data)
    }
})

// Logs
bot.on(BUTTONS.logs.command, async (msg) => {
    let id = msg.from.id
    let first_name = msg.from.first_name
    let parseMode = 'html';
    // Validación usuario
    if (await database.boolCheckTelegramUser(id)) {
        // Muestra logs usuario
        var logs = await database.arrayGetUserLogs(id)
        // Menú Principal
        let replyMarkup = bot.keyboard([
            [BUTTONS.info.label, BUTTONS.balance.label],
            [BUTTONS.buy.label, BUTTONS.sell.label],
            [BUTTONS.logs.label, BUTTONS.bot.label]
        ], { resize: true });
        return bot.sendMessage(id, `<b>` + logs + `</b>`, { replyMarkup, parseMode })
    }
});

// Bot
bot.on(BUTTONS.bot.command, async (msg) => {
    let id = msg.from.id
    let first_name = msg.from.first_name
    let parseMode = 'html'
    let replyMarkup
    // Validación usuario
    if (await database.boolCheckTelegramUser(id)) {
        // Comprobaremos el estado del Bot
        var status = await database.GetStatusBot()
        if (status.status === 1) {
            replyMarkup = bot.inlineKeyboard([
                [bot.inlineButton(TEXT.deactivate_bot.label, { callback: BUTTONS.bot_deactivate.label })]
            ]);
            return bot.sendMessage(id, `<b> 🟢 ESTADO BOT: ACTIVADO \nACCESO: ` + status.updated + '\n\n' + TEXT.activate_bot_description.label + `</b>`, { replyMarkup, parseMode });
        } else {
            replyMarkup = bot.inlineKeyboard([
                [bot.inlineButton(TEXT.activate_bot.label, { callback: BUTTONS.bot_activate.label })]
            ]);
            return bot.sendMessage(id, `<b> 🔴 ESTADO BOT: DESACTIVADO \nACCESO: ` + status.updated + '\n\n' + TEXT.deactivate_bot_description.label + `</b>`, { replyMarkup, parseMode });
        }
    }
})

// buy
bot.on(BUTTONS.buy.command, async (msg) => {
    let id = msg.from.id;
    
    // Validació usuari
    if (await database.boolCheckTelegramUser(id)) {
        // Recuperem la informació del missatge rebut
        let msgLanguageCode = msg.from.language_code; //ca
        let msgWords = msg.text.split(' ');  // Ex: '/buy_test XEUR'
        let parseMode = 'html';

        // Si hi ha un error en el missatge rebut sortim
        if (msgWords.length != 2) {
            return bot.sendMessage(id, 
                "Error, la crida a la comanda " + BUTTONS.buy.command + " ha de tenir un paràmetre amb el pair, ex: buy XBTEUR",
                { parseMode, parseMode }
            );
        }

        // Tot correcte, creem l'ordre
        let pair = msgWords[1]; //"XBTEUR"
        let response = await tradingControl.addOrder(kraken, "buy", pair, REAL_MODE);
        return bot.sendMessage(id, 
            `result = ` + JSON.stringify(response),
            { parseMode, parseMode }
        );
    }
})

// buy test mode
bot.on(BUTTONS.buy_test.command, async (msg) => {
    let id = msg.from.id;
    
    // Validació usuari
    if (await database.boolCheckTelegramUser(id)) {
        // Recuperem la informació del missatge rebut
        let msgLanguageCode = msg.from.language_code; //ca
        let msgWords = msg.text.split(' ');  // Ex: '/buy_test XEUR'
        let parseMode = 'html';

        // Si hi ha un error en el missatge rebut sortim
        if (msgWords.length != 2) {
            return bot.sendMessage(id, 
                "Error, la crida a la comanda " + BUTTONS.buy_test.command + " ha de tenir un paràmetre amb el pair, ex: buy_test XBTEUR",
                { parseMode, parseMode }
            );
        }

        // Tot correcte, creem l'ordre
        let pair = msgWords[1]; //"XBTEUR"
        let response = await tradingControl.addOrder(kraken, "buy", pair, TEST_MODE);
        return bot.sendMessage(id, 
            `result = ` + JSON.stringify(response),
            { parseMode, parseMode }
        );
    }
});

// All callbackQuery Bot
bot.on('callbackQuery', async (msg) => {
    let id = msg.from.id
    let first_name = msg.from.first_name
    let parseMode = 'html';
    // Validación usuario
    if (await database.boolCheckTelegramUser(id)) {
        let updated = null
        // Actualizaremos el estado del Bot
        switch (msg.data) {
            case BUTTONS.bot_activate.label:
                updated = await database.UpdateStatusBot(true)
                return bot.sendMessage(id, `<b> 🟢 ESTADO BOT: ACTIVADO \nACCESO: ` + updated + '\n\n' + TEXT.activate_bot_description.label + `</b>`, { parseMode, parseMode })
            case BUTTONS.bot_deactivate.label:
                updated = await database.UpdateStatusBot(false)
                return bot.sendMessage(id, `<b> 🔴 ESTADO BOT: DESACTIVADO \nACCESO: ` + updated + '\n\n' + TEXT.deactivate_bot_description.label + `</b>`, { parseMode, parseMode })
        }
    }
})


bot.start();
logger.info({ message: 'SERVIDOR BOT TELEGRAM OK!' })

module.exports = bot
