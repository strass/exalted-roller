var Discord = require("discord.js");
var mybot = new Discord.Client();
credentials = require("./token.js")
mybot.loginWithToken(credentials.token);

// Look for messages starting with roll
// To-do: change to .roll
mybot.on("message", function(message) {
    if (message.content.startsWith("roll")) {
        mybot.reply(message, parseMessage(message));
    }
});

//
// SYNTAX GUIDE:
// Handle: target number, double successes (single and #+),
// rerolls (single and cascading), autosuccess
//
// .roll/tn6/
// tn: single target number, values >= to this will count as a success. Default: 7
// db: double x's. 7 double's 7 only, 7+ is 7 and up. Default: 10
// re: reroll #
// as: adds a flat number of successes
//


function parseMessage(message) {
    message = message.toString();
    var parsed = message.split(" ");

    // log parsed message for debugging:
    console.log(parsed);

    // Look for a digit after "roll"
    if (parsed[1].match(/^\d+/g)) {
        // get digits at beginning of string
        // I'm fairly sure this could be improved upon...
        numDice = parsed[1].match(/^\d+/g);
        numDice = numDice[0];
        countSuccesses(roll(numDice), target, doubleIfGreaterThan);
        return roll(numDice);

    } else {
        // Bad syntax handling
        // To-do: add better support here
        return "I can't find any numbers after roll. Syntax: roll 8d10";
    }
}

// Dice rolling:
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

// Dice handling:
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
