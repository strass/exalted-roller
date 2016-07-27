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
    this.rerollSet = new Set();
    this.rolls = roll(numDice);
    this.target = 7;
    this.double = 10;
    this.reroll = false;
    this.autosuccesses = 0;
}

// This is called first within Roll Object and sometimes during rerolls
// Should it live here?
function rolld10() {
    return Math.floor(Math.random() * 10 + 1);
}

function parseMessage(message) {
    message = message.toString();
    var parsed = message.split(" ");

    // log parsed message for debugging:
    console.log("parsed message: " + parsed);

    // If there's a number of dice at the end of the roll message...
    if (parsed[1].match(/^\d+/g)) {

        // get digits at beginning of string
        // I'm fairly sure this could be improved upon...
        var numDice = parsed[1].match(/^\d+/g);
        numDice = numDice[0];

        // Create a new Roll Object
        var theRoll = new Roll(numDice);

        // Parse roll options and pass to theRoll
        // To-do: test if empty array causes error
        var options = parsed[0].split("/");
        console.log("options: " + options);

        for (var i in options) {
            console.log("working through:" + options[i]);
            // set target number
            if (options[i].startsWith("tn")) {
                var target = options[i].match(/\d+/g);
                console.log("target is " + target);
                theRoll.target = target;
            }
            // set doubles
            if (options[i].startsWith("db")) {
                var double = options[i].match(/\d+/g);
                console.log("double is " + double);
                theRoll.double = double;
            }
            // set rerolls
            if (options[i].startsWith("re")) {
                var reroll = options[i].match(/10|\d/g);
                console.log("reroll is " + reroll);
                reroll.forEach(function(item) {
                    theRoll.rerollSet.add(parseInt(item, 10));
                })
            }
            // set autosuccesses
            if (options[i].startsWith("as")) {
                var autosuccesses = options[i].match(/\d+/g);
                console.log("autosuccesses is " + autosuccesses);
                theRoll.autosuccesses = autosuccesses;
            }

            // Pass theRoll through countSuccesses
        }
        console.log(theRoll);
        return parseRoll(theRoll);
    } else {
        // Bad syntax handling
        // To-do: add better support here
        return "I can't find any numbers after roll. Syntax: roll/tn#/db#s/re#s/as# 8d10";
    }
}

// Dice handling:
function parseRoll(theRoll) {
    // reroll dice
    checkForRerolls(theRoll.rolls, theRoll.rerollSet);

    // compare vs target number
    // for (var i in theRoll.rolls) {

    // }

    // double successes
    //
    // reroll dice
    //
    // add autosuccesses and return final message to be sent to chat
    return theRoll.rolls;
}

// Check whether our roll value is contained in our rerollSet
// If so, initiate a cascade
function checkForRerolls(rolls, rerollSet) {
    for (var i in rolls) {
        if (rerollSet.has(rolls[i])) {
            cascade(rolls, rerollSet);
        }
    }
}

// Make a new roll, add it to our roll array. If this new value is
// also a reroll, run cascade again
function cascade(rolls, rerollSet) {
    roll = rolld10();
    console.log("rerolling! result: " + roll);
    rolls.push(roll);
    if (rerollSet.has(roll)) {
        cascade(rolls, rerollSet);
    }
}

// function countSuccesses {

// }
