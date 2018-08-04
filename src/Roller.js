import range from "lodash/range";
import times from "lodash/times";
import sample from "lodash/sample";
import reduce from "lodash/reduce";
import isNumber from "lodash/isNumber";
import isArray from "lodash/isArray";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import compact from "lodash/compact";
import every from "lodash/every";

/**
 * Roll a d10
 * @returns {number} returns a number between 1 and 10
 */
export const d10 = () => sample(range(1, 10));

/**
 * Count successes of a roll
 * @param {(number|number[])} roll - a dice roll or an array of dice rolls
 * @param {object} config - a config for settings pertinent to successes
 * @param {number} [config.targetNumber=7] - target number for the roll
 * @param {number} [config.double=10] - double successes over this number
 * @returns {number} the totall successes rolled
 */
export const countSuccesses = (
  roll,
  { targetNumber = 7, double = 10 } = {}
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
    0
  );
};

/**
 * roll a number of dice
 * @param {number} numDice - number of dice to roll
 * @returns {number[]} the result of the dice roll
 */
export const rollDice = numDice => {
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
export const reroll = (
  roll,
  { rerollArray, append = true, cascade = true }
) => {
  if (!isNumber(roll) && !isArray(roll))
    throw new Error("roll is required (die or array of dice)");

  if (!isArray(rerollArray)) throw new Error("reroll isn't an array");
  rerollArray.forEach(r => {
    if (!isNumber(r)) throw new Error("reroll contains non-number values");
  });
  const rerollSet = new Set(rerollArray);
  if (every(times(10, i => rerollSet.has(i + 1))))
    throw new Error("reroll contains 1-10");

  let rollArray = roll;
  if (!isArray(roll)) rollArray = [rollArray];
  rollArray = compact(rollArray);
  if (isEmpty(rollArray)) return [];
  let rerolls = map(rollArray, r => {
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
 */
export const roll = (numDice, config) => {
  const { targetNumber, double = 10, rerollArray = [], cascade = true } =
    config || {};
  const theRoll = rollDice(numDice);
  const result = reroll(theRoll, { rerollArray, append: true, cascade });
  const successes = countSuccesses(theRoll, { targetNumber, double });

  return {
    result,
    diceRolled: result.length,
    successes,
    numDice,
    botch: successes === 0 && result.includes(1)
  };
};

export default roll;
