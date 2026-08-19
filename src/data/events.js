/**
 * src/data/events.js
 * ---------------------------------------------------------------------------
 * Hand-written fallback mystery events. These are the OFFLINE content the
 * game uses whenever the AI layer is off (the default) or when an AI request
 * fails validation.
 *
 * >>> SHAPE CONTRACT <<<
 * This is the exact JSON-like shape the AI is also asked to produce (see
 * src/ai/aiClient.js). Keep the two in lockstep:
 *
 *   {
 *     "title":   "short title",
 *     "text":    "1-3 sentences of scene text",
 *     "choices": [
 *       {
 *         "label":   "button label",
 *         "effects": { "hp": -10..10, "gold": -10..10, "maxHp": -10..10 },
 *         "result":  "one-sentence outcome"
 *       }, ...
 *     ]
 *   }
 *
 * Every event has 2-3 choices. All effect numbers are integers within
 * [-10, +10]. Tone: dark folk-horror, all-ages (no gore, no profanity).
 */
(function (RG) {
  'use strict';

  RG.EVENTS = [
    {
      title: 'The Wishing Well',
      text: 'A mossy well sinks into the fog, its rope still swaying as if someone just let go. A damp whisper promises a bargain.',
      choices: [
        { label: 'Toss in a coin', effects: { gold: -5, maxHp: 2 }, result: 'The water glows a moment; you feel sturdier, and the well keeps your coin.' },
        { label: 'Lower the bucket', effects: { hp: -4, gold: 6 }, result: 'You haul up a handful of old coins — and a thorn that pricks your hand.' },
        { label: 'Walk away', effects: { hp: 0, gold: 0 }, result: 'You leave the whisper behind. The fog feels relieved.' },
      ],
    },
    {
      title: 'A Door in the Weeds',
      text: 'Half-buried in brambles stands a green door with no wall around it. Faint scratching comes from the other side.',
      choices: [
        { label: 'Knock three times', effects: { hp: 5 }, result: 'The scratching stops. Something old and grateful leaves a blessing on you.' },
        { label: 'Try the handle', effects: { hp: -5, gold: 7 }, result: 'The door opens on a dead hollow — and a pouch of coins someone left behind.' },
        { label: 'Board it shut', effects: { maxHp: 2 }, result: 'You jam the frame with branches. The scratching fades, and your resolve hardens.' },
      ],
    },
    {
      title: 'The Lantern in the Mire',
      text: 'A single lantern hangs from a crooked post above the marsh, though no hand holds it. The light turns to face you.',
      choices: [
        { label: 'Follow the light', effects: { hp: -3, gold: 8 }, result: 'It leads you over solid stones to a cache of coin — and a cold that seeps in.' },
        { label: 'Steal the lantern', effects: { gold: 5, hp: -2 }, result: 'The flame bites your fingers as you take it, but its brass base hides coins.' },
        { label: 'Snuff it out', effects: { maxHp: -2, hp: 5 }, result: 'Darkness closes in, then lifts. You breathe easier, though the path ahead seems longer.' },
      ],
    },
    {
      title: 'The Empty Cradle',
      text: 'A willow leans over a cradle woven of pale reeds. It rocks by itself, and a lullaby hums just under the wind.',
      choices: [
        { label: 'Sing back', effects: { hp: 6 }, result: 'The wind harmonizes. A gentle warmth settles in your chest as you hum along.' },
        { label: 'Peer inside', effects: { hp: -5, maxHp: 3 }, result: 'Empty — but a token is tucked in the blanket, and the sight of it steadies you.' },
        { label: 'Cover it with your cloak', effects: { hp: 2, gold: -3 }, result: 'The humming softens to a sigh. It costs you a few coins, but you feel watched over.' },
      ],
    },
    {
      title: 'The Hanged Harvester',
      text: 'A straw man in a patched coat dangles from an old gallows at the field\'s edge. Crows sit on its shoulders, unafraid.',
      choices: [
        { label: 'Cut it down', effects: { hp: 4, gold: -2 }, result: 'The crows scatter and the straw man settles like a sleeping friend. A few coins fall from its pockets.' },
        { label: 'Search its coat', effects: { gold: 7, hp: -3 }, result: 'Its pockets are full of grain-money, but the touch of the straw leaves you shivering.' },
        { label: 'Leave an offering', effects: { gold: -5, maxHp: 2 }, result: 'You leave bread at the post. The field breathes, and your courage grows a little.' },
      ],
    },
    {
      title: 'The Toll of Shadows',
      text: 'A low bridge crosses black water. A hooded figure stands at its center, holding out an open, empty hand.',
      choices: [
        { label: 'Pay the toll', effects: { gold: -6, hp: 5 }, result: 'Coins clink into nothing. The figure bows, and you cross feeling refreshed.' },
        { label: 'Refuse and cross anyway', effects: { hp: -7, gold: 6 }, result: 'Cold hands brush you as you pass, but you keep the toll and reach the far bank.' },
        { label: 'Turn back', effects: { hp: 2 }, result: 'You find another way around, longer but kinder. Your legs ache less than expected.' },
      ],
    },
    {
      title: 'The Buried Bell',
      text: 'The corner of a great iron bell pokes from the earth, green with age. Something beneath it occasionally taps.',
      choices: [
        { label: 'Ring it', effects: { hp: 5, gold: -3 }, result: 'A clean note rolls across the moor. Whatever taps beneath grows still, and you feel lighter.' },
        { label: 'Dig it out', effects: { gold: 8, hp: -4 }, result: 'You unearth a trove of coins ringing the bell — and a chill that clings to your bones.' },
        { label: 'Listen a while', effects: { maxHp: 2 }, result: 'The tapping has a rhythm, almost like a heartbeat. You leave calmer than you came.' },
      ],
    },
    {
      title: 'The Grey Pilgrim',
      text: 'A bent traveler on the road asks for a drink from your waterskin, and for news of the village beyond the hill.',
      choices: [
        { label: 'Share water and bread', effects: { gold: -3, hp: 6 }, result: 'The pilgrim smiles with too many teeth, and blesses you with warmth that lasts for hours.' },
        { label: 'Give directions only', effects: { hp: -2, gold: 5 }, result: 'They press a few coins into your palm for your trouble, then vanish into the mist.' },
        { label: 'Walk on quickly', effects: { maxHp: 2 }, result: 'You ignore the call. Looking back, the road is empty, and your step is steadier.' },
      ],
    },
    {
      title: 'The Spider\'s Ledger',
      text: 'A heavy book lies open on a stone lectern, its pages blank. Fine silk threads run from its spine into the dark.',
      choices: [
        { label: 'Write your name', effects: { maxHp: 4, hp: -3 }, result: 'The ink drinks itself into the page. You feel a bond form — strong, but not without a price.' },
        { label: 'Tear out a page', effects: { gold: 5, hp: -4 }, result: 'The page becomes a map to hidden coins. The book hisses as you leave.' },
        { label: 'Close the book', effects: { hp: 4 }, result: 'The threads snap one by one. The silence that follows is restful.' },
      ],
    },
    {
      title: 'The Frozen Offering',
      text: 'A shrine of black stone stands in a clearing, and at its foot a bowl of milk has frozen solid in midsummer air.',
      choices: [
        { label: 'Warm the bowl', effects: { hp: 6, gold: -2 }, result: 'The milk thaws under your breath. A kind presence thanks you, and your aches ease.' },
        { label: 'Take the offering', effects: { gold: 6, hp: -3 }, result: 'Frost climbs your arm as you pocket the bowl\'s coins, but the cold coin spends fine.' },
        { label: 'Turn the bowl over', effects: { maxHp: 3 }, result: 'You face the shrine and refuse it. Something approves of your spine.' },
      ],
    },
    {
      title: 'The Nameless Feast',
      text: 'A long table is set in the woods with bread, cheese and berries, all fresh. No one sits, yet every plate is warm.',
      choices: [
        { label: 'Eat your fill', effects: { hp: 8, gold: -3 }, result: 'The food is the best you have ever tasted. You leave a few coins for the unseen hosts.' },
        { label: 'Take provisions', effects: { gold: 4, hp: -4 }, result: 'The berries bruise your hands as you gather them, but the bread keeps for days.' },
        { label: 'Say grace and go', effects: { maxHp: 3 }, result: 'The table seems pleased. You walk away stronger of will, if not of body.' },
      ],
    },
    {
      title: 'The Moth Oracle',
      text: 'A pale moth as big as your hand rests on a dead tree, its wings patterned like staring eyes. It waits for a question.',
      choices: [
        { label: 'Ask about your fate', effects: { maxHp: 3, hp: -2 }, result: 'The moth opens its wings wide. You glimpse a path through the dark — and a cost for knowing it.' },
        { label: 'Offer it a coin', effects: { gold: -4, hp: 6 }, result: 'The moth takes the coin in its legs and dusts your brow with silvery warmth.' },
        { label: 'Catch it', effects: { gold: 5, hp: -3 }, result: 'You close your hands over it. It dissolves into coins — and a sting.' },
      ],
    },
    {
      title: 'The Bargain of Roots',
      text: 'Roots have grown up through the path into the shape of a doorway, and a low voice offers safe passage — for a price.',
      choices: [
        { label: 'Accept the bargain', effects: { gold: -6, maxHp: 3 }, result: 'You pay the roots. They part for you, and something of their patience stays with you.' },
        { label: 'Take the long way', effects: { hp: -3, gold: 5 }, result: 'You walk around, and find coins caught in the brambles where others turned back.' },
        { label: 'Cut through', effects: { hp: -6, gold: 8 }, result: 'The roots fall away revealing a hidden purse, though the thorns take their due.' },
      ],
    },
    {
      title: 'The Candle in the Chapel',
      text: 'A roofless chapel holds one lit candle on the altar. The wax has not melted, no matter how long you watch.',
      choices: [
        { label: 'Light a second candle', effects: { hp: 7 }, result: 'You touch your candle to the flame. A second light springs up, and the cold leaves your bones.' },
        { label: 'Take the candle', effects: { maxHp: -3, gold: 6 }, result: 'The flame stays lit in your hand. The chapel feels emptier, and you feel smaller.' },
        { label: 'Blow it out', effects: { gold: 5, hp: -2 }, result: 'Darkness rushes in, then the altar reveals a hidden offering of coins.' },
      ],
    },
    {
      title: 'The Ferryman\'s Riddle',
      text: 'A silent boatman waits at a misty crossing. He holds up two fingers — two questions, and only one may be answered.',
      choices: [
        { label: 'Answer with the truth', effects: { maxHp: 3, gold: -2 }, result: 'You speak plainly. The boatman nods once and grants you a firmer hold on yourself.' },
        { label: 'Answer with a lie', effects: { gold: 6, hp: -3 }, result: 'The lie earns his dry laugh and a purse of coin — and a splinter of cold in your chest.' },
        { label: 'Stay silent', effects: { hp: 3 }, result: 'He waits, then rows on alone. The mist leaves you a small gift of calm.' },
      ],
    },
    {
      title: 'The Crow Court',
      text: 'A ring of crows sits in the branches like judges. In the center lies a single bright button. They watch you closely.',
      choices: [
        { label: 'Return the button to them', effects: { hp: 4, maxHp: 2 }, result: 'You set it on the branch. The crows bow, and their dark approval settles around you.' },
        { label: 'Keep the button', effects: { gold: 6, hp: -3 }, result: 'It is heavy and warm, worth a few coins — though the crows follow you for a while.' },
        { label: 'Offer them bread', effects: { gold: -4, hp: 6 }, result: 'The court accepts your gift with soft caws, and a strange, feather-light healing follows.' },
      ],
    },
    {
      title: 'The Glass Orchard',
      text: 'An orchard glitters in the gloom, every fruit made of glass. A sign reads: "Take one, and no more."',
      choices: [
        { label: 'Take one fruit', effects: { gold: 6, hp: -2 }, result: 'The glass apple is hollow and holds a few coins. Cold glass leaves a small cut.' },
        { label: 'Take two fruits', effects: { gold: 9, hp: -6 }, result: 'The second fruit shatters loudly. Coins scatter — but the orchard\'s guardians notice.' },
        { label: 'Leave them be', effects: { hp: 5 }, result: 'You admire the orchard and pass. The air itself seems to thank you.' },
      ],
    },
    {
      title: 'The Ink in the Pond',
      text: 'The pond is black as ink, and your reflection waves at you a half-second too late. It seems to want something.',
      choices: [
        { label: 'Touch the surface', effects: { hp: -5, maxHp: 3 }, result: 'Your reflection grips your hand a moment. It leaves a lesson in your bones — and a chill.' },
        { label: 'Skip a stone across', effects: { gold: 5, hp: -2 }, result: 'The ripples scatter coins onto the bank, as if the pond were paying you to stop.' },
        { label: 'Turn your back', effects: { maxHp: 2 }, result: 'You refuse to meet its eyes. The reflection settles, and you walk away more certain.' },
      ],
    },
    {
      title: 'The Trapper\'s Cache',
      text: 'A poacher\'s hide is tucked under a bank of roots — dried meat, a coin pouch, and a sprung trap nearby.',
      choices: [
        { label: 'Take the rations', effects: { hp: 6, gold: -2 }, result: 'The dried meat is tough but good. You leave coin for the trapper, whoever they were.' },
        { label: 'Take the coins', effects: { gold: 8, hp: -3 }, result: 'The pouch is heavy. The sprung trap snaps as you leave, nicking your heel.' },
        { label: 'Reset the trap and go', effects: { maxHp: 2 }, result: 'You set things right and move on, feeling the forest nod at your back.' },
      ],
    },
    {
      title: 'The Silver Snare',
      text: 'A fine silver chain lies coiled on the path, ending in a ring. It glints a little too eagerly.',
      choices: [
        { label: 'Pick it up', effects: { gold: 7, hp: -4 }, result: 'The chain is worth coin, but it clings cold around your wrist before you shake it free.' },
        { label: 'Step over it', effects: { hp: 3, maxHp: 1 }, result: 'You avoid the snare. Somewhere behind you, something sighs with disappointment.' },
        { label: 'Bury it', effects: { maxHp: 3 }, result: 'You cover the chain with stones. The path feels safer for the next traveler.' },
      ],
    },
    {
      title: 'The Wind\'s Errand',
      text: 'The wind keeps tugging at your sleeve, then toward a tangle of thornbush where something small glints.',
      choices: [
        { label: 'Follow the wind', effects: { hp: -4, gold: 8 }, result: 'Thorns rake your arm, but you find a dropped purse that the wind wanted you to have.' },
        { label: 'Speak to the wind', effects: { maxHp: 2, hp: 2 }, result: 'You ask what it wants. It only laughs, and the laughter leaves you steady.' },
        { label: 'Ignore it', effects: { gold: 2 }, result: 'The wind gives up. A single coin tumbles to your feet anyway.' },
      ],
    },
    {
      title: 'The Salt Ring',
      text: 'A perfect circle of salt surrounds a flat stone on the moor. The salt has not been disturbed by rain or wind.',
      choices: [
        { label: 'Sit on the stone', effects: { hp: 8, gold: -2 }, result: 'You rest inside the ring. Peace flows up from the stone, and you leave a coin in thanks.' },
        { label: 'Break the ring', effects: { gold: 6, hp: -5 }, result: 'Coins buried in the salt scatter free — and whatever the ring held steps out too.' },
        { label: 'Add to the ring', effects: { maxHp: 3 }, result: 'You trace more salt around it. The moor holds its breath, then relaxes.' },
      ],
    },
    {
      title: 'The False Campfire',
      text: 'A campfire crackles in a clearing, ringed with empty log seats. No one tends it, yet it burns cheerfully.',
      choices: [
        { label: 'Warm your hands', effects: { hp: 7, gold: -2 }, result: 'The fire is real and kind. You feed it a coin and it feeds you warmth.' },
        { label: 'Search the camp', effects: { gold: 7, hp: -3 }, result: 'You find a pouch under one of the logs. The flames lean toward you as you take it.' },
        { label: 'Smother it', effects: { maxHp: 3 }, result: 'You stamp out the fire to keep others safe. The clearing darkens, but your purpose hardens.' },
      ],
    },
    {
      title: 'The Doll in the Tree',
      text: 'A cloth doll sits in the crook of an old oak, stitched with bright thread and looking back the way you came.',
      choices: [
        { label: 'Take it down', effects: { gold: 4, hp: -3 }, result: 'It is stuffed with dried petals and a few coins. Its button eyes follow you.' },
        { label: 'Leave it a ribbon', effects: { hp: 5, gold: -2 }, result: 'You tie a ribbon beside it. The doll\'s stitched smile seems a little warmer.' },
        { label: 'Wave and pass', effects: { maxHp: 2 }, result: 'You wave. The tree creaks in reply, and your way forward feels lighter.' },
      ],
    },
    {
      title: 'The Hearthless House',
      text: 'A cottage stands with its door ajar, warm light spilling out — but there is no chimney and no hearth to be seen.',
      choices: [
        { label: 'Step inside', effects: { hp: 8, gold: -3 }, result: 'The warmth wraps around you like a blanket. You leave coin on the table for the house.' },
        { label: 'Call from the doorway', effects: { hp: 3, maxHp: 2 }, result: 'A voice from inside bids you well. The greeting alone fortifies you.' },
        { label: 'Shut the door', effects: { gold: 5, hp: -2 }, result: 'You close it gently. Coins chime somewhere inside, and one rolls out to you.' },
      ],
    },
    {
      title: 'The Starless Field',
      text: 'In this clearing the sky holds no stars at all, and your own shadow is missing. The dark is almost thoughtful.',
      choices: [
        { label: 'Lie down and rest', effects: { hp: 7, maxHp: 1 }, result: 'You rest in the starless dark. It returns you to the path steadier than before.' },
        { label: 'Call out a wish', effects: { maxHp: 4, gold: -2 }, result: 'The dark folds your wish into itself. You stand a little taller, a little poorer.' },
        { label: 'Hurry through', effects: { gold: 5, hp: -2 }, result: 'You cross quickly and find coins at the far edge, cold as lost stars.' },
      ],
    },
  ];

  /**
   * Deterministic pick from the fallback pool. Uses the global RG.RNG when
   * present so the choice is reproducible given a seed; falls back to Math.random.
   * `avoidTitle` prevents the same event appearing back-to-back.
   */
  RG.EVENTS.pick = function (avoidTitle) {
    const pool = RG.EVENTS.filter(function (e) { return e.title !== avoidTitle; });
    const list = pool.length ? pool : RG.EVENTS;
    const rng = (RG.RNG && RG.RNG.integerInRange) ? RG.RNG.integerInRange(0, list.length - 1) : Math.floor(Math.random() * list.length);
    return list[rng];
  };
})(window.RG = window.RG || {});
