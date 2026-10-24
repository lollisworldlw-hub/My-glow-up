// Daily message on Home. Pick a style in Settings; a new one shows each day.
export type QuoteStyle = 'motivational' | 'whip' | 'soft';

export const QUOTE_STYLES: { v: QuoteStyle; label: string; sample: string }[] = [
  { v: 'motivational', label: 'Motivational', sample: 'Small steps every day add up to big change.' },
  { v: 'whip', label: 'Whip me', sample: 'Get your lazy ass up. That workout isn’t doing itself.' },
  { v: 'soft', label: 'Soft & sweet', sample: 'Be gentle with yourself today. You’re doing better than you think.' }
];

export const QUOTES: Record<QuoteStyle, string[]> = {
  motivational: [
    'Small steps every day add up to big change.',
    'You don’t have to be perfect to be consistent.',
    'Progress isn’t always loud. Keep showing up.',
    'Discipline is choosing what you want most over what you want now.',
    'Every healthy choice is a vote for the person you’re becoming.',
    'Strong is built one rep, one meal, one day at a time.',
    'The hardest part is starting. You’ve already done that.',
    'Motivation gets you going. Habits keep you going.',
    'Your only competition is who you were yesterday.',
    'Show up for yourself the way you show up for everyone else.',
    'One good meal won’t change everything. Neither will one bad one.',
    'You’re not starting over. You’re continuing.',
    'Make today count. Future you is watching.',
    'Results come from what you do most of the time, not some of the time.',
    'Be stronger than your excuses.',
    'A 10-minute walk beats a skipped workout every time.',
    'Fall in love with taking care of yourself.',
    'Slow progress is still progress.',
    'Consistency is the real glow-up.',
    'You’ve survived every hard day so far. Today is no different.',
    'Drink the water. Eat the protein. Take the walk.',
    'Done is better than perfect.',
    'Your body hears everything your mind says. Keep it kind and strong.',
    'Habits are the compound interest of self-care.',
    'Win the morning, win the day.',
    'You are one decision away from a better day.',
    'Trust the process. The scale isn’t the only proof.',
    'Build the life you don’t need a vacation from.',
    'Effort today, results tomorrow.',
    'Keep going. You’re closer than you were yesterday.'
  ],
  whip: [
    'Get your lazy ass up. That workout isn’t doing itself.',
    'The couch called. Hang up.',
    'Your excuses are weak and so are your legs. Fix both.',
    'Nobody is coming to do your squats for you, princess.',
    'You had energy to scroll for an hour. You have energy for a walk.',
    'Drink your damn water.',
    'Stop negotiating with yourself. Lace up.',
    'That snack is not a love language. Put it back.',
    'You said “tomorrow” yesterday. Liar.',
    'Sweat now, flex later. Move.',
    'Hit your protein or I’m telling everyone.',
    'Your goals can’t hear you whining. Get to work.',
    'Less snoozing, more moving. Up.',
    'If you can binge a whole season, you can do 20 minutes.',
    'Log the food. Yes, the bite you “didn’t count.”',
    'Comfort zone? Never heard of her. Go.',
    'Champions don’t skip leg day. Neither do you today.',
    'The scale isn’t broken. Your weekend was. Reset.',
    'Quit staring at this and go walk.',
    'Hydrate or die-drate. Your choice.',
    'You’re not tired, you’re uninspired. Here’s your inspiration: move.',
    'Put the phone down and pick the dumbbells up.',
    'Abs are made in the kitchen, not the drive-thru.',
    'Warm up, shut up, show up.',
    'Your bed will be there later. Your goals won’t wait.',
    'Earn that dessert. Go.',
    'Today’s forecast: 100% chance of you working out.',
    'Excuses don’t burn calories. Walking does.',
    'You’re one workout away from a better mood. Stop stalling.',
    'Main character energy. Act like it and get moving.'
  ],
  soft: [
    'Be gentle with yourself today. You’re doing better than you think.',
    'You deserve to feel good in your body, and you’re getting there.',
    'Rest is part of the plan too.',
    'Every kind thing you do for your body counts.',
    'You are worthy of love at every step of this journey.',
    'Take a deep breath. You’ve got this, and you’re not alone.',
    'Nourish yourself like someone you love.',
    'Your pace is the right pace.',
    'Little by little, you’re blooming.',
    'You showed up today. That matters so much.',
    'Celebrate the small wins. They’re yours.',
    'Your body has carried you through everything. Thank it today.',
    'It’s okay to have a hard day. Tomorrow is soft and new.',
    'You are allowed to take up space and take care of yourself.',
    'Kindness to yourself is the best fuel there is.',
    'Progress, not perfection, sweetheart.',
    'Drink some water and give yourself some grace.',
    'You’re building something beautiful, one day at a time.',
    'You don’t have to earn rest. You deserve it.',
    'Proud of you for trying. Proud of you for staying.',
    'Let today be easy where it can be.',
    'You are more than a number on a scale.',
    'Softly, steadily, you’re getting stronger.',
    'Treat yourself with the patience you give others.',
    'There’s no rush. You’re right on time.',
    'Your effort is enough today.',
    'You’re glowing more than you know.',
    'Hug your future self. She’s so grateful.',
    'Wherever you are today is a good place to begin.',
    'You are doing a lovely job taking care of you.'
  ]
};

/** Same message all day, a new one tomorrow. */
export function dailyQuote(style: QuoteStyle | undefined, dayIndex: number): string {
  const list = QUOTES[style ?? 'motivational'] ?? QUOTES.motivational;
  return list[((dayIndex % list.length) + list.length) % list.length];
}

// --- Messages that react to the time of day and what's been logged ---
export type Moment = 'morning' | 'breakfast' | 'water' | 'log' | 'move' | 'protein' | 'evening' | 'ontrack' | 'night';

const CTX: Record<QuoteStyle, Record<Moment, string[]>> = {
  motivational: {
    morning: ['Good morning. Set the tone with one healthy choice.', 'New day, clean slate. Let’s make it count.', 'Start strong: water, protein, a little movement.'],
    breakfast: ['Fuel up. A protein-packed breakfast sets up the whole day.', 'Breakfast first, then conquer the day.', 'Don’t run on empty. Log a good breakfast.'],
    water: ['You’re behind on water. A full glass right now gets you back on track.', 'Hydration check: grab a glass and sip.', 'Water first. Your energy will thank you.'],
    log: ['Nothing logged yet today. A quick log keeps you on track.', 'What gets tracked gets done. Log your first meal.', 'Take 30 seconds and log what you’ve eaten.'],
    move: ['Your workout is still waiting. Even 10 minutes counts.', 'Time to move. Future you will be glad you did.', 'A quick walk or your workout now makes tonight feel great.'],
    protein: ['Protein is running low. A high-protein dinner closes the gap.', 'Add some protein tonight to stay strong and full.', 'Almost there on protein. A yogurt or eggs would do it.'],
    evening: ['Strong day. Finish it with a calm evening.', 'Look at you showing up. Keep it steady tonight.', 'You put in the work today. Be proud.'],
    ontrack: ['You’re right on track. Keep this energy going.', 'Everything’s lining up today. Nice work.', 'On pace and looking good. Keep going.'],
    night: ['Rest well. Tomorrow you go again.', 'Sleep is part of the plan. Wind down.', 'Good night. Today counted.']
  },
  whip: {
    morning: ['Rise and grind, sleepyhead. The day isn’t going to crush itself.', 'Morning. Coffee is not a meal plan. Get moving.', 'Up and at ’em. Your goals woke up before you did.'],
    breakfast: ['Skipping breakfast isn’t a strategy. Eat something with protein.', 'Feed the beast. Log breakfast.', 'Your stomach is filing a complaint. Eat.'],
    water: ['You’re basically a raisin. Drink some damn water.', 'Water. Now. I’m not asking.', 'Your water bottle is lonely and so is your hydration. Chug.'],
    log: ['Zero food logged? Either you’re a cactus or you’re hiding snacks. Log it.', 'Log your food. The cookies count too.', 'If you ate it, track it. Stop playing.'],
    move: ['Your workout is waiting and you’re over here scrolling. Move your ass.', 'Shoes on. Excuses off. Go.', 'The couch has had enough of you today. Get up.'],
    protein: ['Your protein is pathetic today. Fix it at dinner.', 'Muscles don’t build on vibes. Eat protein.', 'Eggs, chicken, yogurt. Pick one and handle it.'],
    evening: ['Not bad. Don’t ruin it with a midnight snack attack.', 'You earned the couch tonight. Barely.', 'Solid day. Now don’t undo it in the pantry.'],
    ontrack: ['Look at you doing everything right. Suspicious, but keep it up.', 'On track? Who are you and what did you do with the old you?', 'Crushing it. Don’t get cocky.'],
    night: ['Go to bed. Scrolling at midnight won’t make you skinny.', 'Lights out. Tomorrow I’m coming for you again.', 'Sleep. Champions recover.']
  },
  soft: {
    morning: ['Good morning, love. Today is a fresh, gentle start.', 'Rise softly. You’ve got a beautiful day ahead.', 'Morning, sunshine. Take it one kind step at a time.'],
    breakfast: ['Treat yourself to a nourishing breakfast. You deserve it.', 'A warm, filling breakfast is a lovely way to care for you.', 'Fuel your body with something good this morning.'],
    water: ['A little water would feel so good right now.', 'Sip, sip. Your body will love you for it.', 'Take a moment and drink some water, sweet one.'],
    log: ['Whenever you’re ready, log what you’ve eaten. No pressure.', 'A quick log helps you see how well you’re caring for yourself.', 'Jot down your meals when you can. Every bit helps.'],
    move: ['A gentle walk could feel really nice right now.', 'Your body would love a little movement today.', 'Even a short stretch is a gift to yourself.'],
    protein: ['Something cozy and protein-rich for dinner would be perfect.', 'Let’s nourish those muscles tonight with a little extra protein.', 'You’re close on protein. A yummy snack would round out your day.'],
    evening: ['You did so well today. Rest easy.', 'What a lovely day of caring for yourself.', 'Proud of you. Enjoy a calm, cozy evening.'],
    ontrack: ['Everything’s flowing so nicely today. Keep shining.', 'You’re doing beautifully. Truly.', 'Right on track, and glowing.'],
    night: ['Sweet dreams. You were wonderful today.', 'Rest your body and your heart. You earned it.', 'Good night. Tomorrow is yours.']
  }
};

/** Pick a message that fits the moment. Changes with the time of day and what's been logged. */
export function momentQuote(style: QuoteStyle | undefined, m: { hour: number; waterPct: number; ate: boolean; breakfast: boolean; proteinPct: number; workoutDue: boolean }, seed: number): string {
  const st = style ?? 'motivational';
  const h = m.hour;
  let k: Moment;
  if (h >= 22 || h < 4) k = 'night';
  else if (h < 11 && !m.breakfast) k = h < 7 ? 'morning' : 'breakfast';
  else if (h >= 12 && !m.ate) k = 'log';
  else if (h >= 10 && m.waterPct < Math.min(1, (h - 7) / 13) * 0.6) k = 'water';
  else if (h >= 14 && h < 21 && m.workoutDue) k = 'move';
  else if (h >= 17 && m.proteinPct < 0.6) k = 'protein';
  else if (h >= 19) k = 'evening';
  else if (h < 11) k = 'morning';
  else k = 'ontrack';
  // a general quote now and then so it doesn't feel robotic
  if (seed % 4 === 3 && k !== 'night') return dailyQuote(st, seed);
  const list = CTX[st][k];
  return list[seed % list.length];
}
