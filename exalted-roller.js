const {
  AWSLambdaServer,
  CommandOptionType,
  SlashCommand,
  SlashCreator,
  CommandContext,
} = require("slash-create");
const RollModule = require("./roll.js");
const toNumber = require("lodash/toNumber.js");

const roll = RollModule.default;
const parseResults = RollModule.parseResults;

const creator = new SlashCreator({
  applicationID: process.env.DISCORD_APP_ID,
  publicKey: process.env.DISCORD_PUBLIC_KEY,
  token: process.env.DISCORD_BOT_TOKEN,
});

class RollCommand extends SlashCommand {
  constructor(creator) {
    super(creator, {
      name: "d10",
      description: "Roll d10 for exalted 3e",
      options: [
        {
          type: CommandOptionType.INTEGER,
          name: "dice",
          description: "Number of d10 to roll",
          required: true,
          min_value: 1,
        },
        {
          type: CommandOptionType.INTEGER,
          name: "double",
          description: "Double X's: dice over this number count as 2 successes",
          min_value: 1,
          max_value: 11,
        },
        {
          type: CommandOptionType.INTEGER,
          name: "autosuccesses",
          description: "Autosuccesses to add to roll",
          min_value: 1,
        },
        {
          type: CommandOptionType.STRING,
          name: "reroll",
          description: "Numbers to reroll (comma separated)",
        },
        {
          type: CommandOptionType.INTEGER,
          name: "target-number",
          description: "Roll target (default 7)",
          min_value: 1,
          max_value: 10,
        },
      ],
    });
  }

  /** @param {CommandContext} ctx */
  async run(ctx) {
    const _numDice = ctx.options.dice;
    const numDice = toNumber(_numDice);
    const results = roll(numDice, {
      autosuccesses: ctx.options.autosuccesses,
      double: ctx.options.double,
      rerollArray: ctx.options.reroll?.split(",").map((n) => toNumber(n)) ?? [],
      targetNumber: ctx.options["target-number"],
    });
    return parseResults(results);
  }
}

creator
  // The first argument is required, the second argument is the name or "target" of the export.
  // It defaults to 'interactions', so it would not be strictly necessary here.
  .withServer(new AWSLambdaServer(module.exports, "handler"))
  .registerCommands([RollCommand]);

creator.on("debug", (message) => console.log(message));
creator.on("warn", (message) => console.warn(message));
creator.on("error", (error) => console.error(error.message));
creator.on("synced", () => console.info("Commands synced!"));
creator.on("commandRun", (command, _, ctx) =>
  console.info(
    `${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`
  )
);
creator.on("commandRegister", (command) =>
  console.info(`Registered command ${command.commandName}`)
);
creator.on("commandError", (command, error) =>
  console.error(`Command ${command.commandName}:`, error)
);

if (process.env.SYNC) {
  console.log("syncing commands");
  creator.syncCommands();
  creator.syncCommandsIn("190664048147169280");
}
