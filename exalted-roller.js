"use strict";
const Clapp = require("./modules/clapp-discord");
const Discord = require("discord.js");
const bot = new Discord.Client();
const credentials = require("./token.js");

console.log('starting dicebot');

var app = new Clapp.App({
  name: "d10",
  desc: "A dice rolling bot for Exalted 3rd edition",
  prefix: ".",
  version: "2.0",
  onReply: (msg, context) => {
    // Fired when input is needed to be shown to the user.
    // context.msg.reply('\n' + msg).then(bot_response => {
    //   if (cfg.deleteAfterReply.enabled) {
    //     context.msg.delete(cfg.deleteAfterReply.time)
    //       .then(msg => console.log(`Deleted message from ${msg.author}`))
    //       .catch(console.log);
    //     bot_response.delete(cfg.deleteAfterReply.time)
    //       .then(msg => console.log(`Deleted message from ${msg.author}`))
    //       .catch(console.log);
    //   }
    // });
  }
});

bot.on("message", msg => {
  if (msg.content.startsWith(".roll")) {
    msg.reply(parseMessage(msg.content));
  }

  if (msg.content.startsWith(".role")) {
    msg.reply(changeRoles(msg));
  }
});

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

// Roll 1d10 function
function rolld10() {
  return Math.floor(Math.random() * 10 + 1);
}

// Message parsing
function parseMessage(message) {
  message = message.toString();

  console.log(message);

  var parsed = message.split(" ");

  console.log(parsed);

  if (parsed.length === 1) {
    console.log("syntax requested");
    return "syntax guide: `.roll/db#s/re#s/tn#/as#/no10 #`";
  }
  // log parsed message for debugging:
  // console.log("parsed message: " + parsed);

  // Some variables and shortcuts to use:
  var anyNumber = /^\d+/g;
  var tenOrSingleDigitOptionalPlus = /(10|\d)\+?/g;

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
        // THIS IS A REALLY UGLY HOTFIX :-\
        var target = options[i].match(/\d+/g);
        console.log(target);
        theRoll.target = parseInt(target, 10);
      }
      // set doubles
      if (options[i].startsWith('db')) {
        var double = options[i].match(tenOrSingleDigitOptionalPlus)
        double && double.forEach(function (item) {
          if (item.includes("+")) {
            // db#+ doubles successes on rolls from # to 10
            // note that this does not override no10
            for (var j = parseInt(item, 10); j <= 10; j++) {
              theRoll.doubleSet.add(j)
            }
          } else {
            theRoll.doubleSet.add(parseInt(item, 10))
          }
        })
      }
      // set rerolls
      if (options[i].startsWith('re')) {
        var reroll = options[i].match(tenOrSingleDigitOptionalPlus)
        reroll && reroll.forEach(function (item) {
          if (item.includes("+")) {
            // re#+ rerolls rolls from # to 10
            for (var j = parseInt(item, 10); j <= 10; j++) {
              theRoll.rerollSet.add(j)
            }
          } else {
            theRoll.rerollSet.add(parseInt(item, 10))
          }
        })
        let set = theRoll.rerollSet
        // Stop infinite cascading reroll
        if (
          set.has(1) &&
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
          return "Reroll every face? What are you trying to do, give me a headache?";
        }
      }
      // set autosuccesses
      if (options[i].startsWith("as")) {
        var autosuccesses = options[i].match(/\d+/g);
        theRoll.autosuccesses = parseInt(autosuccesses, 10);
      }
      // Don't double 10s of the /no10/ flag is active
      if (options[i].startsWith("no10")) {
        theRoll.doubleSet.delete(10);
        console.log("no10 flag found");
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
  let roll = rolld10();
  rolls.push(roll);
  if (rerollSet.has(roll)) {
    cascade(rolls, rerollSet);
  }
}

function countSuccessesAndDisplayResults(theRoll) {
  // Sort dice rolls
  theRoll.rolls = theRoll.rolls.sort(function(a, b) {
    return a - b;
  });
  console.log(theRoll);
  // Count successes and format results
  var successes = theRoll.autosuccesses;
  for (var i in theRoll.rolls) {
    if (
      theRoll.rolls[i] >= theRoll.target &&
      theRoll.doubleSet.has(theRoll.rolls[i]) &&
      theRoll.rerollSet.has(theRoll.rolls[i])
    ) {
      successes += 2;
      theRoll.rolls[i] = "~~__**" + theRoll.rolls[i] + "**__~~";
    } else if (
      theRoll.rolls[i] >= theRoll.target &&
      theRoll.doubleSet.has(theRoll.rolls[i])
    ) {
      successes += 2;
      theRoll.rolls[i] = "__**" + theRoll.rolls[i] + "**__";
    } else if (
      theRoll.rolls[i] >= theRoll.target &&
      theRoll.rerollSet.has(theRoll.rolls[i])
    ) {
      // code for > target && reroll
      successes += 1;
      theRoll.rolls[i] = "~~**" + theRoll.rolls[i] + "**~~";
    } else if (theRoll.rolls[i] >= theRoll.target) {
      successes += 1;
      theRoll.rolls[i] = "**" + theRoll.rolls[i] + "**";
    } else if (theRoll.rerollSet.has(theRoll.rolls[i])) {
      theRoll.rolls[i] = "~~" + theRoll.rolls[i] + "~~";
    }
  }
  console.log(theRoll.rolls);
  return (
    "you rolled " +
    theRoll.rolls +
    " for a total of **" +
    successes +
    "** successes"
  );
}

// ROLE MANAGEMENT
// TODO: restrict to Exalted Gaming server, turn off caps sensitivity
function changeRoles(message) {
  var availableroles = [
    "1e",
    "2e",
    "3e",
    "Godbound",
    "Looking For Group",
    "Member",
    "Looking For Players",
    "Storytellers",
    "Players",
    "Voice",
    "Text"
  ];
  var rolestotoggle = [];
  var newroles = [];
  var flavortext = "";
  var basetags = message.content.split("(");
  basetags.shift();
  basetags.forEach(function(potentialtag) {
    var toggletag = potentialtag.match(/([a-z A-Z0-9',]+)/);
    if (toggletag) {
      const index = availableroles.map(r => r.toLowerCase()).indexOf(toggletag[1].toLowerCase());
      if (index >= 0) {
        rolestotoggle.push(availableroles[index]);
      }
    }
  });

  if (message.guild && rolestotoggle.length > 0) {
    var roles = message.guild.roles.array();
    // var originalroles = message.member.roles // never used?
    roles.forEach(function(role) {
      if (message.member.roles.has(role.id)) {
        if (rolestotoggle.includes(role.name)) {
          console.log(
            "Removed " + role.name + " for " + message.author.username
          );
          flavortext += "-" + role.name + " ";
        } else {
          newroles.push(role.id);
        }
      } else {
        if (rolestotoggle.includes(role.name)) {
          console.log("Added " + role.name + " for " + message.author.username);
          newroles.push(role.id);
          flavortext += "+" + role.name + " ";
        }
      }
    });
  } else {
    return "No toggleable roles found";
  }

  // var nickname = 'User' // nicknames not used
  // if (!message.member.nickname) {
  //   nickname = message.author.username
  // } else {
  //   nickname = message.member.nickname
  // }
  if (newroles.length > 0) {
    message.member.setRoles(newroles);
    return "tags: " + flavortext;
  }
}

bot.login(credentials.token).then(() => {
  console.log("Running!");
});
