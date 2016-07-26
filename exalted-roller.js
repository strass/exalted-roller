var Discord = require("discord.js");
var mybot = new Discord.Client();
credentials = require("./token.js")
mybot.loginWithToken(credentials.token);

// var Parser = require("simple-text-parser");
// var parser = new Parser();

mybot.on("message", function(message) {
    if (message.content.startsWith("roll")) {
        mybot.reply(message, parseMessage(message));
    }
});

function parseMessage(message) {
    // get # of dice. Look for int or [int]d10
    // split at NOT int or [int]d10
    message = message.toString();
    var parsed = message.split(" ");

    // Look for a digit after "roll"
    if (parsed[1].match(/^\d+/g)) {
        // get digits at beginning of string
        numDice = parsed[1].match(/^\d+/g);
        numDice = numDice[0];
        countSuccesses(roll(numDice), target, doubleIfGreaterThan);
        return roll(numDice);

    } else {
        return "I can't find any numbers after roll. Syntax: roll 8d10";
    }
}

function roll(n) {
    var rolls = [];
    var i = 0;
    while (i < n) {
        rolls.push(rolld10());
        i++;
    }
    return rolls;
}


function rolld10() {
    return Math.floor(Math.random() * 10 + 1);
}

function countSuccesses(rolls, target, doubleIfGreaterThan) {
    for (var i in rolls) {
        if (rolls[i] >= doubleIfGreaterThan) {
            rolls[i] = [rolls[i], 2];
        } else if (rolls[i] >= target) {
            rolls[i] = [rolls[i], 1];

        } else {
            rolls[i] = [rolls[i], 0];
        }
    }
    return rolls;
}
