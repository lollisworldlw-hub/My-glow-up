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
