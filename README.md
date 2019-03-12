# exalted-roller
Dice roller for the Exalted RPG system by Onyx Path Publishing.

Node app, rolling logic written in javascript, uses Discord.js to connect to chat.

I'm proud of the recursive rerolling feature. Writing it taught me a whole bunch. I also learned to use Objects and they're pretty magical.

## Dice rolling logic
A quick guide to Exalted rolling:

Roll a pool of d10, each individual dice showing
a number greater than the target number (7 by default)
generates a success. 10's generate two successes. If
you roll more successes than the difficulty of an action,
you succeed. To roll n dice, simply type `.roll n`.

Some powers let you change how you roll:i

* The simplest is an autosucces. Each autosuccess adds
1 success to the result of your roll. Autosuccess
can be added with the `/as#` command, `.roll/as1 4`
would roll 4 dice and then add an additional success
to the result.
* The default target number is 7. All results greater than
or equal to 7 will be rerolled. The target number can be
changed with `/tn`. For example `.roll/tn6 #` will roll #
dice, generating a success for each number greater than or
euqal to 6.
* Doubles generate twice the number of successes. If you
are rolling double 9's, each 9 in your pool would add two
successes instead of one. `.roll/db789 #` would roll # dice
and double the successes of 7, 8, 9, and 10 (since 10 is
doubled by default). If you don't want to double your 10s,
use /no10 in the roll: `.roll/no10 #`.
* Rerolls faces are rerolled after recording successes.
`.roll/re56 8` will roll 8 dice, rerolling 5's and 6's.
These cascade, meaning that if another 5 or 6 is rerolled,
it will be rerolled as well.

Text output: D10 bot will reply with the dice you rolled
and computes the number of successes. Successes are bolded,
doubles are underlined, and rerolls have strikethrough.

## How to use
I have the bot deployed on an ec2 instance. You can invite it
to your discord channel by going [here](https://discordapp.com/oauth2/authorize?client_id=207977122462040064&scope=bot&permissions=0) and
inviting him to a channel you administrate.

## To-do:
* ~~Better error handling~~ **added somewhat subpar error handling 2016-07-31 let's see if it's enough**
* ~~More helpful help (really any help feature at all)~~
* ~~Option to not double 10's~~ **/no10 flag added2016-07-30**
* Option to have /db7+ mean double 7, 8, 9, and 10
