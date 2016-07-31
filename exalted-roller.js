var Discord = require("discord.js");
var mybot = new Discord.Client();
credentials = require("./token.js");
mybot.loginWithToken(credentials.token);

rerollString = ".roll"


// Look for messages starting with roll
// To-do: change to .roll
mybot.on("message", function(message) {
    if (message.content.startsWith(rerollString)) {
        mybot.reply(message, parseMessage(message));
    }
});

// A quick guide to Exalted rolling:
//
// Roll a pool of d10, each individual dice showing
// a number greater than the target number (7 by default)
// generates a success. 10's generate two successes. If
// you roll more successes than the difficulty of an action,
// you succeed. To roll n dice, simply type `.roll n`.
//
// Some powers let you change how you roll:i
//
// * The simplest is an autosucces. Each autosuccess adds
// 1 success to the result of your roll. Autosuccess
// can be added with the \as# command, `.roll\as1 4`
// would roll 4 dice and then add an additional success
// to the result.
// * The default target number is 7. All results greater than
// or equal to 7 will be rerolled. The target number can be
// changed with \tn. For example `.roll\tn6 #` will roll #
// dice, generating a success for each number greater than or
// euqal to 6.
// * Doubles generate twice the number of successes. If you
// are rolling double 9's, each 9 in your pool would add two
// successes instead of one. `.roll\db789 #` would roll # dice
// and double the successes of 7, 8, 9, and 10 (since 10 is
// doubled by default). If you don't want to double your 10s,
// use /no10 in the roll: `.roll\no10 #`.
// * Rerolls faces are rerolled after recording successes.
// `.roll\re56 8` will roll 8 dice, rerolling 5's and 6's.
// These cascade, meaning that if another 5 or 6 is rerolled,
// it will be rerolled as well.
//
// Text output: D10 bot will reply with the dice you rolled
// and computes the number of successes. Successes are bolded,
// doubles are underlined, and rerolls have strikethrough.


function Roll(numDice) {
    var roll = function(numDice) {
        var rolls = [];
        for (var i = 0; i < numDice; i++) {
            rolls.push(rolld10());
        }
        return rolls;
    };
    this.doubleSet = new Set([10]);
    this.rerollSet = new Set();
    this.rolls = roll(numDice);
    this.target = 7;
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
    if (message.length == 1) {
        return "syntax guide: MIA"
    }
    // log parsed message for debugging:
    // console.log("parsed message: " + parsed);

    // Some variables and shortcuts to use:
    var anyNumber = "/^\d+/g";
    var tenOrSingleDigit = "/10|\d/g" 

    // If there's a number of dice at the end of the roll message...
    if (parsed[1].match(anyNumber)) {

        // get digits at beginning of second split string
        // I'm fairly sure this could be improved upon...
        var numDice = parsed[1].match(anyNumber);
        numDice = numDice[0];

        // Create a new Roll Object
        var theRoll = new Roll(numDice);

        // Parse roll options and pass to theRoll
        // To-do: test if empty array causes error
        var options = parsed[0].split("/");
        // console.log("options: " + options);

        for (var i in options) {
            // set target number
            if (options[i].startsWith("tn")) {
                var target = options[i].match(anyNumber);
                theRoll.target = parseInt(target, 10);
            }
            // set doubles
            // To-do: add code to not double 10's
            // To-do: add code for double 7+ (doub;les 7,8,9,and 10)
            if (options[i].startsWith("db")) {
                var double = options[i].match(tenOrSingleDigit);
                double.forEach(function(item) {
                    theRoll.doubleSet.add(parseInt(item, 10));
                })
            }
            // set rerolls
            if (options[i].startsWith("re")) {
                var reroll = options[i].match(tenOrSingleDigit);
                reroll.forEach(function(item) {
                    theRoll.rerollSet.add(parseInt(item, 10));
                })
                set = theRoll.rerollSet;
                if (set.has(1) &&
                    set.has(2) &&
                    set.has(3) &&
                    set.has(4) &&
                    set.has(5) &&
                    set.has(6) &&
                    set.has(7) &&
                    set.has(8) &&
                    set.has(9) &&
                    set.has(10)
                ) {
                    return = "Reroll every face? What are you trying to do, give me a headache?";
                }
            }
            // set autosuccesses
            if (options[i].startsWith("as")) {
                var autosuccesses = options[i].match(/\d+/g);
                theRoll.autosuccesses = parseInt(autosuccesses, 10);
            }
            if (options[i].startsWith("no10")) {
                theRoll.rerollSet.delete(10);
            }

        }
        checkForRerolls(theRoll.rolls, theRoll.rerollSet);

        // Pass theRoll through countSuccessesAndDisplayResults
        return countSuccessesAndDisplayResults(theRoll);

    } else {
        // Bad syntax handling
        // To-do: add better support here
        return "I can't find any numbers after roll. Syntax: .roll/tn#/db#s/re#s/as#/no10 8d10";
    }
}

// Check whether any of our roll values are contained in our rerollSet
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
    rolls.push(roll);
    if (rerollSet.has(roll)) {
        cascade(rolls, rerollSet);
    }
}

function countSuccessesAndDisplayResults(theRoll) {
    // Sort dice rolls
    theRoll.rolls = theRoll.rolls.sort(function(a, b){return a-b});
    // Count successes and format results
    var successes = theRoll.autosuccesses;
    for (var i in theRoll.rolls) {
        if (theRoll.rolls[i] >= theRoll.target && theRoll.doubleSet.has(theRoll.rolls[i]) && theRoll.rerollSet.has(theRoll.rolls[i])) {
            successes+=2;
            theRoll.rolls[i] = "~~__**"+theRoll.rolls[i]+"**__~~";
        } else if (theRoll.rolls[i] >= theRoll.target && theRoll.doubleSet.has(theRoll.rolls[i])) {
            successes+=2;
            theRoll.rolls[i] = "__**"+theRoll.rolls[i]+"**__";
        } else if (theRoll.rolls[i] >= theRoll.target && theRoll.rerollSet.has(theRoll.rolls[1])) { // code for > target && reroll
            successes+=1;
            theRoll.rolls[i] = "~~**"+theRoll.rolls[i] + "**~~";
        } else if (theRoll.rolls[i] >= theRoll.target) {
            successes+=1;
            theRoll.rolls[i] = "**"+theRoll.rolls[i]+"**";
        } else if (theRoll.rerollSet.has(theRoll.rolls[i])) {
            theRoll.rolls[i] = "~~"+theRoll.rolls[i]+"~~";
        }
    }
    console.log(theRoll.rolls);
    return "you rolled " + theRoll.rolls + " for a total of **" + successes + "** successes";
}
