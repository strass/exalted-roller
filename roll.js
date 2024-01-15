const range = require("lodash/range.js");
const times = require("lodash/times.js");
const sample = require("lodash/sample.js");
const reduce = require("lodash/reduce.js");
const isNumber = require("lodash/isNumber.js");
const isArray = require("lodash/isArray.js");
const isEmpty = require("lodash/isEmpty.js");
const map = require("lodash/map.js");
const compact = require("lodash/compact.js");
const every = require("lodash/every.js");

/**
 * Roll a d10
 * @returns {number} returns a number between 1 and 10
 */
const d10 = () => sample(range(1, 11));

/**
 * Count successes of a roll
 * @param {(number|number[])} roll - a dice roll or an array of dice rolls
 * @param {object} config - a config for settings pertinent to successes
 * @param {number} [config.targetNumber=7] - target number for the roll
 * @param {number} [config.double=10] - double successes over this number
 * @param {number} [config.autosuccesses=0] - successes to add to roll
 * @returns {number} the totall successes rolled
 */
const countSuccesses = (
  roll,
  { targetNumber = 7, double = 10, autosuccesses = 0 } = {}
) => {
  if (roll === undefined || (!isNumber(roll) && !isArray(roll))) {
    throw new Error("roll is required (die or array of dice)");
  }
  let rollArray = roll;
  if (!isNumber(targetNumber)) throw new Error("targetNumber must be a number");
  if (!isNumber(double)) throw new Error("double must be a number");
  if (!isArray(roll)) rollArray = [rollArray];
  return reduce(
    rollArray,
    (acc, r) => {
      if (!isNumber(r))
        throw new Error("One of the values in roll array is not a number");
      if (r <= 0 || r > 10)
        throw new Error("One of the values in roll array out of 1-10 range");
      return acc + (r >= targetNumber ? (r >= double ? 2 : 1) : 0);
    },
    autosuccesses
  );
};

/**
 * roll a number of dice
 * @param {number} numDice - number of dice to roll
 * @returns {number[]} the result of the dice roll
 */
const rollDice = (numDice) => {
  if (!isNumber(numDice) || numDice < 0)
    throw new Error("numDice must be a positive number");
  return times(numDice, d10);
};

/**
 * rerolls dice
 * @param {number|number[]} roll
 * @param {object} config
 * @param {object} config.rerollArray
 * @param {boolean} config.append
 * @param {boolean} config.cascade
 * @returns {number[]} reroll array
 */
const reroll = (roll, { rerollArray, append = true, cascade = true }) => {
  if (!isNumber(roll) && !isArray(roll))
    throw new Error("roll is required (die or array of dice)");

  if (!isArray(rerollArray)) throw new Error("reroll isn't an array");
  rerollArray.forEach((r) => {
    if (!isNumber(r)) throw new Error("reroll contains non-number values");
  });
  const rerollSet = new Set(rerollArray);
  if (every(times(10, (i) => rerollSet.has(i + 1))))
    throw new Error("reroll contains 1-10");

  let rollArray = roll;
  if (!isArray(roll)) rollArray = [rollArray];
  rollArray = compact(rollArray);
  if (isEmpty(rollArray)) return [];
  let rerolls = map(rollArray, (r) => {
    return rerollArray.includes(r) ? d10() : false;
  });

  if (cascade) {
    rerolls = reroll(rerolls, { rerollArray, append: true });
  }

  return compact([...(append ? rollArray : []), ...rerolls]);
};

/**
 * make a roll
 * @param {number} numDice the number of dice to roll
 * @param {object} config config object
 * @param {number} [config.targetNumber=7] target number for the roll
 * @param {number} [config.double=10] double successes over this number
 * @param {number[]} [config.rerollArray=[]] faces to reroll
 * @param {boolean} [config.cascade=true] whether rerolls should cascade
 * @param {boolean} [config.autosuccesses=0] roll autosuccesses
 */
const roll = (numDice, config = {}) => {
  const {
    targetNumber = 7,
    double = 10,
    rerollArray = [],
    cascade = true,
    autosuccesses = 0,
  } = config;
  const theRoll = rollDice(numDice);
  const result = reroll(theRoll, { rerollArray, append: true, cascade });
  const successes = countSuccesses(result, {
    targetNumber,
    double,
    autosuccesses,
  });

  return {
    result,
    diceRolled: result.length,
    successes,
    numDice,
    botch: successes === 0 && result.includes(1),
    config: {
      targetNumber,
      double,
      rerollArray,
      cascade,
      autosuccesses,
    },
  };
};

exports.default = roll;

/** @param {ReturnType<typeof roll>} results */
function parseResults(results) {
  const formattedDice = results.result
    .sort((a, b) => a - b)
    .map((roll) => {
      const { double, rerollArray, targetNumber } = results.config;
      let output = `${roll}`;
      if (roll >= targetNumber) {
        output = `**${output}**`;
      }
      if (roll >= double) {
        output = `__${output}__`;
      }
      if (rerollArray.includes(roll)) {
        output = `~~${output}~~`;
      }
      return output;
    });
  return `You rolled ${formattedDice} for a total of **${results.successes}** successes`;
}

exports.parseResults = parseResults;
