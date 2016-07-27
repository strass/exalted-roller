var Discord = require("discord.js");
var mybot = new Discord.Client();
credentials = require("./token.js");
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

function Roll(numDice) {
    var roll = function(numDice) {
        var rolls = [];
        var i = 0;
        while (i < numDice) {
            rolls.push(rolld10());
            i++;
        }
        return rolls;
    };
    var rolld10 = function() {
        return Math.floor(Math.random() * 10 + 1);
    };
    this.rolls = roll(numDice);
    this.target = 7;
    this.double = 10;
    this.reroll = false;
    this.autosuccesses = 0;
}

function parseMessage(message) {
    message = message.toString();
    var parsed = message.split(" ");

    // log parsed message for debugging:
    console.log("parsed message: " + parsed);

    // Look for a digit after "roll"
    if (parsed[1].match(/^\d+/g)) {
        // get digits at beginning of string
        // I'm fairly sure this could be improved upon...
        var numDice = parsed[1].match(/^\d+/g);
        numDice = numDice[0];
        // countSuccesses(roll(numDice), target, doubleIfGreaterThan);
        // return roll(numDice);

        // Create a new Roll Object
        var theRoll = new Roll(numDice);

        // Parse roll options and pass to theRoll
        var options = parsed[0].split("/");
        for (var i in options) {
            if (options[i].startsWith("tn")) {
                var target = options[i].match(/\d+/g);
                console.log("target is " + target);
                theRoll.target = target;
            }
            if (options[i].startsWith("db")) {
                var double = options[i].match(/\d+/g);
                console.log("double is " + double);
                theRoll.double = double;
            }
            if (options[i].startsWith("re")) {
                var reroll = options[i].match(/\d+/g);
                console.log("reroll is " + reroll);
                theRoll.reroll = reroll;
            }
            if (options[i].startsWith("as")) {
                var autosuccesses = options[i].match(/\d+/g);
                console.log("autosuccesses is " + autosuccesses);
                theRoll.autosuccesses = autosuccesses;
            }
            console.log(theRoll);
        }

    } else {
        // Bad syntax handling
        // To-do: add better support here
        return "I can't find any numbers after roll. Syntax: roll/tn#/db#s/re#s/as# 8d10";
    }
}

// Dice handling:
function countSuccesses(rolls, target, double, reroll, autosuccesses) {
    for (var i in rolls) {
        if (rolls[i] >= doubleIfGreaterThan) {
            rolls[i] = [rolls[i], 2];
        } else if (rolls[i] >= target) {
            rolls[i] = [rolls[i], 1];

        } else {
            rolls[i] = [rolls[i], 0];
        }
    }

    // Apply autosuccesses to roll
    rolls.push(autosuccesses);
    return rolls;
}
