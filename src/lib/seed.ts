import type {
  Food, Recipe, ScheduleDay, Habit, GroceryItem, PrepTask, Settings, GroceryCategory
} from './types';

// Generic nutrition estimates per 100 g (USDA-style averages). Brands vary —
// every food is editable from its package label in Settings → Food library.
type F = Omit<Food, 'estimate'> & { estimate?: boolean };
const f = (x: F): Food => ({ estimate: true, ...x });
const m = (cal: number, protein: number, carbs: number, fat: number) => ({ cal, protein, carbs, fat });

export const SEED_FOODS: Food[] = [
  f({ id: 'egg', name: 'Large egg', state: 'raw', category: 'Protein', per100g: m(143, 12.6, 0.7, 9.5),
    units: { each: 50 }, eachLabel: 'egg',
    grocery: { key: 'eggs', name: 'Large eggs', factor: 1, unitLabel: 'eggs', gramsPerUnit: 50, round: 'ceil' } }),
  f({ id: 'turkey-sausage', name: 'Turkey breakfast sausage', state: 'cooked', category: 'Protein', per100g: m(196, 20, 2, 12),
    units: { each: 28 }, eachLabel: 'link', note: 'Brands vary a lot — check your label.',
    grocery: { key: 'turkey-sausage', name: 'Turkey breakfast sausage', factor: 1, unitLabel: 'oz', gramsPerUnit: 28.35, round: 'ceil' } }),
  f({ id: 'ww-bread', name: 'Whole-wheat bread', state: 'packaged', category: 'Grains', per100g: m(252, 12.4, 43, 3.5),
    units: { each: 32 }, eachLabel: 'slice',
    grocery: { key: 'ww-bread', name: 'Whole-wheat bread', factor: 1, unitLabel: 'loaf', gramsPerUnit: 570, round: 'ceil' } }),
  f({ id: 'blueberries', name: 'Blueberries', state: 'raw', category: 'Fruits', per100g: m(57, 0.7, 14.5, 0.3),
    units: { cup: 148 },
    grocery: { key: 'blueberries', name: 'Blueberries', factor: 1, unitLabel: 'pint', gramsPerUnit: 300, round: 'ceil' } }),
  f({ id: 'oats', name: 'Rolled oats', state: 'dry', category: 'Grains', per100g: m(379, 13.2, 67.7, 6.5),
    units: { cup: 81, tbsp: 5 },
    grocery: { key: 'oats', name: 'Rolled oats', factor: 1, unitLabel: 'cups dry', gramsPerUnit: 81, round: 'half', pantry: true } }),
  f({ id: 'greek-yogurt', name: 'Plain nonfat Greek yogurt', state: 'packaged', category: 'Dairy', per100g: m(59, 10.3, 3.6, 0.4),
    units: { cup: 245, tbsp: 15 },
    grocery: { key: 'greek-yogurt', name: 'Nonfat Greek yogurt (32 oz tub)', factor: 1, unitLabel: 'tub', gramsPerUnit: 907, round: 'ceil' } }),
  f({ id: 'milk-2', name: '2% milk', state: 'packaged', category: 'Dairy', per100g: m(50, 3.3, 4.8, 2),
    units: { cup: 244, tbsp: 15 },
    grocery: { key: 'milk-2', name: '2% milk (half gallon)', factor: 1, unitLabel: 'carton', gramsPerUnit: 1950, round: 'ceil' } }),
  f({ id: 'strawberries', name: 'Strawberries', state: 'raw', category: 'Fruits', per100g: m(32, 0.7, 7.7, 0.3),
    units: { cup: 152, each: 12 }, eachLabel: 'berry',
    grocery: { key: 'strawberries', name: 'Strawberries (1 lb)', factor: 1, unitLabel: 'container', gramsPerUnit: 454, round: 'ceil' } }),
  f({ id: 'chicken-cooked', name: 'Chicken breast', state: 'cooked', category: 'Protein', per100g: m(165, 31, 0, 3.6),
    units: {}, note: 'Weighed after cooking. Raw chicken shrinks ~25%.',
    grocery: { key: 'chicken-raw', name: 'Chicken breast (raw)', factor: 1.33, unitLabel: 'lb', gramsPerUnit: 453.6, round: 'quarter' } }),
  f({ id: 'rice-cooked', name: 'White rice', state: 'cooked', category: 'Grains', per100g: m(130, 2.7, 28.2, 0.3),
    units: { cup: 158 }, note: '1 cup dry rice makes about 3 cups cooked.',
    grocery: { key: 'rice', name: 'White rice', factor: 0.36, unitLabel: 'cups dry', gramsPerUnit: 185, round: 'half', pantry: true } }),
  f({ id: 'avocado', name: 'Avocado', state: 'raw', category: 'Fruits', per100g: m(160, 2, 8.5, 14.7),
    units: { each: 136, tbsp: 15 }, eachLabel: 'avocado',
    grocery: { key: 'avocado', name: 'Avocados', factor: 1, unitLabel: 'avocados', gramsPerUnit: 136, round: 'ceil' } }),
  f({ id: 'corn', name: 'Corn kernels (frozen)', state: 'cooked', category: 'Vegetables', per100g: m(85, 3, 19, 1.2),
    units: { cup: 165, tbsp: 10 },
    grocery: { key: 'corn', name: 'Frozen corn (12 oz bag)', factor: 1, unitLabel: 'bag', gramsPerUnit: 340, round: 'ceil' } }),
  f({ id: 'salsa', name: 'Salsa', state: 'packaged', category: 'Sauces', per100g: m(36, 1.5, 6.6, 0.2),
    units: { tbsp: 16, cup: 256 },
    grocery: { key: 'salsa', name: 'Salsa (16 oz jar)', factor: 1, unitLabel: 'jar', gramsPerUnit: 454, round: 'ceil' } }),
  f({ id: 'turkey-93-cooked', name: '93% lean ground turkey', state: 'cooked', category: 'Protein', per100g: m(213, 27.1, 0, 11.6),
    units: {}, note: 'Weighed after browning. Raw weight is ~25% more.',
    grocery: { key: 'turkey-raw', name: '93% lean ground turkey (raw)', factor: 1.33, unitLabel: 'lb', gramsPerUnit: 453.6, round: 'quarter' } }),
  f({ id: 'black-beans', name: 'Black beans (canned, drained)', state: 'prepared', category: 'Pantry', per100g: m(110, 7, 20, 0.4),
    units: { cup: 172 },
    grocery: { key: 'black-beans', name: 'Black beans (15 oz can)', factor: 1, unitLabel: 'can', gramsPerUnit: 250, round: 'ceil' } }),
  f({ id: 'taco-seasoning', name: 'Taco seasoning', state: 'dry', category: 'Pantry', per100g: m(300, 6, 55, 6),
    units: { tsp: 2.8, tbsp: 8.4 },
    grocery: { key: 'taco-seasoning', name: 'Taco seasoning', factor: 1, unitLabel: 'packet', gramsPerUnit: 28, round: 'ceil', pantry: true } }),
  f({ id: 'salmon-raw', name: 'Salmon fillet', state: 'raw', category: 'Protein', per100g: m(180, 21, 0, 10),
    units: {}, note: 'Average of farmed and wild. Weighed raw.',
    grocery: { key: 'salmon', name: 'Salmon fillets', factor: 1, unitLabel: 'lb', gramsPerUnit: 453.6, round: 'quarter' } }),
  f({ id: 'potato-raw', name: 'Potatoes', state: 'raw', category: 'Grains', per100g: m(77, 2, 17.5, 0.1),
    units: { each: 213 }, eachLabel: 'medium potato',
    grocery: { key: 'potatoes', name: 'Potatoes', factor: 1, unitLabel: 'lb', gramsPerUnit: 453.6, round: 'quarter' } }),
  f({ id: 'green-beans', name: 'Green beans (frozen)', state: 'cooked', category: 'Vegetables', per100g: m(33, 1.8, 7, 0.2),
    units: { cup: 124 },
    grocery: { key: 'green-beans', name: 'Frozen green beans (12 oz bag)', factor: 1, unitLabel: 'bag', gramsPerUnit: 340, round: 'ceil' } }),
  f({ id: 'olive-oil', name: 'Olive oil', state: 'packaged', category: 'Pantry', per100g: m(884, 0, 0, 100),
    units: { tbsp: 13.5, tsp: 4.5 }, estimate: false,
    grocery: { key: 'olive-oil', name: 'Olive oil', factor: 1, unitLabel: 'bottle', gramsPerUnit: 500, round: 'ceil', pantry: true } }),
  f({ id: 'shrimp-cooked', name: 'Shrimp', state: 'cooked', category: 'Protein', per100g: m(99, 24, 0.2, 0.3),
    units: {}, note: 'Weighed cooked, peeled. Raw peeled weighs ~25% more.',
    grocery: { key: 'shrimp', name: 'Shrimp (raw, peeled)', factor: 1.25, unitLabel: 'lb', gramsPerUnit: 453.6, round: 'quarter' } }),
  f({ id: 'penne', name: 'Penne pasta', state: 'dry', category: 'Grains', per100g: m(371, 13, 75, 1.5),
    units: { cup: 90 },
    grocery: { key: 'penne', name: 'Penne (16 oz box)', factor: 1, unitLabel: 'box', gramsPerUnit: 454, round: 'ceil', pantry: true } }),
  f({ id: 'macaroni', name: 'Elbow macaroni', state: 'dry', category: 'Grains', per100g: m(371, 13, 75, 1.5),
    units: { cup: 105 },
    grocery: { key: 'macaroni', name: 'Elbow macaroni (16 oz box)', factor: 1, unitLabel: 'box', gramsPerUnit: 454, round: 'ceil', pantry: true } }),
  f({ id: 'marinara', name: 'Marinara sauce', state: 'packaged', category: 'Sauces', per100g: m(50, 1.5, 8, 1.5),
    units: { cup: 250, tbsp: 16 },
    grocery: { key: 'marinara', name: 'Marinara (24 oz jar)', factor: 1, unitLabel: 'jar', gramsPerUnit: 680, round: 'ceil' } }),
  f({ id: 'beef-93-cooked', name: '93% lean ground beef', state: 'cooked', category: 'Protein', per100g: m(205, 28, 0, 9.5),
    units: {}, note: 'Weighed after browning. Raw weight is ~25% more.',
    grocery: { key: 'beef-raw', name: '93% lean ground beef (raw)', factor: 1.33, unitLabel: 'lb', gramsPerUnit: 453.6, round: 'quarter' } }),
  f({ id: 'mozzarella', name: 'Shredded mozzarella (part-skim)', state: 'packaged', category: 'Dairy', per100g: m(286, 25, 3, 18),
    units: { cup: 112, tbsp: 7 },
    grocery: { key: 'mozzarella', name: 'Shredded mozzarella (8 oz bag)', factor: 1, unitLabel: 'bag', gramsPerUnit: 227, round: 'ceil' } }),
  f({ id: 'protein-yogurt', name: 'High-protein Greek yogurt cup', state: 'packaged', category: 'Dairy', per100g: m(67, 10.7, 6, 0),
    units: { each: 150 }, eachLabel: 'cup', note: 'About 100 cal and 15–17 g protein per cup. Set from your label.',
    grocery: { key: 'protein-yogurt', name: 'High-protein Greek yogurt cups', factor: 1, unitLabel: 'cups', gramsPerUnit: 150, round: 'ceil' } }),
  f({ id: 'dark-chocolate', name: 'Dark chocolate (70–85%)', state: 'packaged', category: 'Desserts', per100g: m(598, 7.8, 46, 43),
    units: { each: 10 }, eachLabel: 'square',
    grocery: { key: 'dark-chocolate', name: 'Dark chocolate bar (3.5 oz)', factor: 1, unitLabel: 'bar', gramsPerUnit: 100, round: 'ceil' } }),
  f({ id: 'cocoa', name: 'Unsweetened cocoa powder', state: 'dry', category: 'Desserts', per100g: m(228, 19.6, 58, 13.7),
    units: { tbsp: 5.4, tsp: 1.8 },
    grocery: { key: 'cocoa', name: 'Unsweetened cocoa powder', factor: 1, unitLabel: 'container', gramsPerUnit: 226, round: 'ceil', pantry: true } }),
  f({ id: 'choc-chips', name: 'Semi-sweet chocolate chips', state: 'packaged', category: 'Desserts', per100g: m(480, 4.2, 64, 30),
    units: { tbsp: 10.5 },
    grocery: { key: 'choc-chips', name: 'Chocolate chips (12 oz bag)', factor: 1, unitLabel: 'bag', gramsPerUnit: 340, round: 'ceil', pantry: true } }),
  f({ id: 'froyo-bar', name: 'Chocolate frozen yogurt bar', state: 'packaged', category: 'Desserts', per100g: m(200, 5.3, 30, 6.7),
    units: { each: 75 }, eachLabel: 'bar', note: 'Set to 150 cal per bar. Update protein from your box.',
    grocery: { key: 'froyo-bar', name: 'Chocolate frozen yogurt bars (box of 6)', factor: 1, unitLabel: 'box', gramsPerUnit: 450, round: 'ceil' } }),
  f({ id: 'cookies', name: 'Chocolate chip cookies (packaged)', state: 'packaged', category: 'Desserts', per100g: m(488, 5, 66, 24),
    units: { each: 10 }, eachLabel: 'small cookie', note: 'About 150 cal per 30 g — varies by brand.',
    grocery: { key: 'cookies', name: 'Chocolate chip cookies', factor: 1, unitLabel: 'package', gramsPerUnit: 368, round: 'ceil' } }),
  f({ id: 'sweetener', name: 'Zero-calorie sweetener', state: 'packaged', category: 'Desserts', per100g: m(0, 0, 0, 0),
    units: { each: 1, tsp: 0.5 }, eachLabel: 'packet', estimate: false,
    grocery: { key: 'sweetener', name: 'Zero-calorie sweetener', factor: 1, unitLabel: 'box', gramsPerUnit: 100, round: 'ceil', pantry: true } })
];

const r = (x: Recipe) => x;
export const SEED_RECIPES: Recipe[] = [
  r({ id: 'b-eggs', name: 'Eggs & Turkey Sausage', slot: 'breakfast', servingLabel: '1 plate', art: 'eggs',
    ingredients: [
      { foodId: 'egg', amount: 2, unit: 'each' },
      { foodId: 'turkey-sausage', amount: 2, unit: 'oz' },
      { foodId: 'ww-bread', amount: 1, unit: 'each' },
      { foodId: 'blueberries', amount: 0.5, unit: 'cup' }
    ],
    instructions: ['Cook the eggs any way you like (a spray of oil is fine).', 'Heat the sausage until hot all the way through.', 'Toast the bread.', 'Serve with blueberries.'] }),
  r({ id: 'b-oats', name: 'Strawberry Overnight Oats', slot: 'breakfast', servingLabel: '1 jar', art: 'oats',
    ingredients: [
      { foodId: 'oats', amount: 0.5, unit: 'cup' },
      { foodId: 'greek-yogurt', amount: 0.75, unit: 'cup' },
      { foodId: 'milk-2', amount: 0.5, unit: 'cup' },
      { foodId: 'strawberries', amount: 0.5, unit: 'cup' }
    ],
    instructions: ['Mix oats, yogurt, and milk in a jar.', 'Refrigerate overnight (keeps 3–4 days).', 'Add strawberries before eating.'] }),
  r({ id: 'l-chicken', name: 'Chicken Avocado Rice Bowl', slot: 'lunch', servingLabel: '1 bowl', art: 'bowl',
    ingredients: [
      { foodId: 'chicken-cooked', amount: 4, unit: 'oz' },
      { foodId: 'rice-cooked', amount: 0.5, unit: 'cup' },
      { foodId: 'avocado', amount: 50, unit: 'g' },
      { foodId: 'corn', amount: 0.25, unit: 'cup' },
      { foodId: 'salsa', amount: 2, unit: 'tbsp' }
    ],
    instructions: ['Season and cook the chicken (bake at 425°F for 18–22 min until it reaches 165°F).', 'Prepare the rice.', 'Portion chicken, rice, and corn into containers.', 'Add avocado and salsa when serving.'] }),
  r({ id: 'l-turkey', name: 'Turkey Taco Bowl', slot: 'lunch', servingLabel: '1 bowl', art: 'taco',
    ingredients: [
      { foodId: 'turkey-93-cooked', amount: 4, unit: 'oz' },
      { foodId: 'rice-cooked', amount: 0.5, unit: 'cup' },
      { foodId: 'black-beans', amount: 0.5, unit: 'cup' },
      { foodId: 'salsa', amount: 2, unit: 'tbsp' },
      { foodId: 'taco-seasoning', amount: 1, unit: 'tsp' }
    ],
    instructions: ['Brown the turkey with taco seasoning until it reaches 165°F.', 'Prepare the rice and warm the beans.', 'Portion into containers.', 'Add salsa when serving.'] }),
  r({ id: 'd-salmon', name: 'Salmon & Potatoes', slot: 'dinner', servingLabel: '1 plate', art: 'salmon',
    ingredients: [
      { foodId: 'salmon-raw', amount: 5, unit: 'oz' },
      { foodId: 'potato-raw', amount: 150, unit: 'g' },
      { foodId: 'green-beans', amount: 1, unit: 'cup' },
      { foodId: 'olive-oil', amount: 1, unit: 'tsp' }
    ],
    note: 'Plus garlic, lemon, and seasoning to taste (negligible calories).',
    instructions: ['Heat oven to 425°F. Cube the potatoes, toss with the olive oil and seasoning, roast 25–30 min.', 'Add the salmon to the pan for the last 12–15 min with garlic and lemon (cook to 145°F).', 'Steam or microwave the green beans.'] }),
  r({ id: 'd-shrimp', name: 'Garlic Shrimp Pasta', slot: 'dinner', servingLabel: '1 bowl', art: 'pasta',
    ingredients: [
      { foodId: 'shrimp-cooked', amount: 5, unit: 'oz' },
      { foodId: 'penne', amount: 2, unit: 'oz' },
      { foodId: 'marinara', amount: 0.5, unit: 'cup' },
      { foodId: 'olive-oil', amount: 1, unit: 'tsp' }
    ],
    note: 'Plus garlic seasoning to taste.',
    instructions: ['Boil the penne according to the package.', 'Sauté shrimp in the olive oil with garlic, 2–3 min per side until pink and opaque.', 'Stir in warm marinara and the drained pasta.'] }),
  r({ id: 'd-beef', name: 'Easy Beef Pasta Skillet', slot: 'dinner', servingLabel: '1 bowl', art: 'skillet',
    ingredients: [
      { foodId: 'beef-93-cooked', amount: 4, unit: 'oz' },
      { foodId: 'macaroni', amount: 2, unit: 'oz' },
      { foodId: 'marinara', amount: 0.5, unit: 'cup' },
      { foodId: 'mozzarella', amount: 2, unit: 'tbsp' }
    ],
    instructions: ['Boil the macaroni according to the package.', 'Brown the beef until no pink remains (160°F).', 'Stir in marinara and macaroni, top with mozzarella, cover 1 min to melt.'] }),
  r({ id: 's-yogurt', name: 'High-Protein Greek Yogurt', slot: 'snack', servingLabel: '1 cup', art: 'yogurt',
    ingredients: [{ foodId: 'protein-yogurt', amount: 1, unit: 'each' }],
    instructions: ['Grab one from the fridge and enjoy.'] }),
  r({ id: 's-eggs', name: 'Two Hard-Boiled Eggs', slot: 'snack', servingLabel: '2 eggs', art: 'eggs',
    ingredients: [{ foodId: 'egg', amount: 2, unit: 'each' }],
    instructions: ['Boil a batch on prep day: 10–12 min, then ice water. Keeps 1 week in the shell.'] }),
  r({ id: 's-berry', name: 'Yogurt & Strawberries', slot: 'snack', servingLabel: '1 cup', art: 'yogurt',
    ingredients: [{ foodId: 'protein-yogurt', amount: 1, unit: 'each' }, { foodId: 'strawberries', amount: 0.5, unit: 'cup' }],
    instructions: ['Top the yogurt with sliced strawberries.'] }),
  r({ id: 'x-strawberries', name: 'Chocolate & Strawberries', slot: 'dessert', servingLabel: '1 plate', art: 'choc-berry',
    ingredients: [{ foodId: 'dark-chocolate', amount: 28, unit: 'g' }, { foodId: 'strawberries', amount: 0.5, unit: 'cup' }],
    instructions: ['Break the chocolate into squares and enjoy slowly with the berries. Melting it for dipping is lovely too.'] }),
  r({ id: 'x-pudding', name: 'Chocolate Greek Yogurt Pudding', slot: 'dessert', servingLabel: '1 bowl', art: 'pudding',
    ingredients: [
      { foodId: 'greek-yogurt', amount: 0.75, unit: 'cup' },
      { foodId: 'cocoa', amount: 1, unit: 'tbsp' },
      { foodId: 'choc-chips', amount: 10, unit: 'g' },
      { foodId: 'sweetener', amount: 1, unit: 'each' }
    ],
    instructions: ['Whisk the yogurt, cocoa, and sweetener until smooth.', 'Top with chocolate chips. Chill 10 min for a mousse-like texture.'] }),
  r({ id: 'x-froyo', name: 'Chocolate Frozen Yogurt Bar', slot: 'dessert', servingLabel: '1 bar', art: 'froyo',
    ingredients: [{ foodId: 'froyo-bar', amount: 1, unit: 'each' }],
    instructions: ['Unwrap and enjoy. Choose a bar labeled about 150 calories.'] }),
  r({ id: 'x-cookies', name: 'Chocolate Chip Cookies', slot: 'dessert', servingLabel: '30 g', art: 'cookies',
    ingredients: [{ foodId: 'cookies', amount: 30, unit: 'g' }],
    instructions: ['Weigh out 30 g (often 2–3 small cookies). Pair with a glass of milk if you like.'] })
];

// Monday = 1 ... Sunday = 0 (JS getDay)
export const SEED_SCHEDULE: Record<number, ScheduleDay> = {
  1: { walk: 'walk', home: 'strength', homeOptional: false },
  2: { walk: 'walk', home: 'bike', homeOptional: false },
  3: { walk: 'walk', home: 'strength', homeOptional: false },
  4: { walk: 'walk', home: 'bike', homeOptional: false },
  5: { walk: 'walk', home: 'strength', homeOptional: false },
  6: { walk: 'optional', home: 'bike-easy', homeOptional: true },
  0: { walk: 'recovery', home: 'rest', homeOptional: true }
};

/** default weekly rotation used to fill new weeks: index by JS weekday */
export const SEED_ROTATION: Record<number, Record<string, string>> = {
  1: { breakfast: 'b-eggs', lunch: 'l-chicken', dinner: 'd-salmon', snack: 's-yogurt', dessert: 'x-strawberries' },
  2: { breakfast: 'b-oats', lunch: 'l-chicken', dinner: 'd-shrimp', snack: 's-yogurt', dessert: 'x-pudding' },
  3: { breakfast: 'b-eggs', lunch: 'l-chicken', dinner: 'd-beef', snack: 's-yogurt', dessert: 'x-froyo' },
  4: { breakfast: 'b-oats', lunch: 'l-turkey', dinner: 'd-salmon', snack: 's-yogurt', dessert: 'x-cookies' },
  5: { breakfast: 'b-eggs', lunch: 'l-turkey', dinner: 'd-shrimp', snack: 's-yogurt', dessert: 'x-strawberries' },
  6: { breakfast: 'b-oats', lunch: 'l-turkey', dinner: 'd-beef', snack: 's-yogurt', dessert: 'x-pudding' },
  0: { breakfast: 'b-eggs', lunch: 'l-turkey', dinner: 'd-salmon', snack: 's-yogurt', dessert: 'x-froyo' }
};

export const SEED_HABITS: Habit[] = [
  { id: 'h-walk', name: '20-minute lunch walk', rule: 'walk-days', optional: false, home: true, auto: 'walk' },
  { id: 'h-workout', name: 'Scheduled home workout', rule: 'workout-days', optional: false, home: true, auto: 'workout' },
  { id: 'h-log', name: 'Log my meals', rule: 'daily', optional: false, home: true },
  { id: 'h-protein', name: 'Meet my protein goal', rule: 'daily', optional: false, home: true, auto: 'protein' },
  { id: 'h-water', name: 'Drink my water', rule: 'daily', optional: false, home: true, auto: 'water' },
  { id: 'h-dessert', name: 'Enjoy my planned dessert, if I want', rule: 'daily', optional: true, home: true, auto: 'dessert' },
  { id: 'h-sleep', name: 'Sleep 7+ hours', rule: 'daily', optional: false, home: false },
  { id: 'h-reflect', name: 'Progress reflection', rule: 'daily', optional: true, home: false }
];

let gi = 0;
const g = (name: string, qty: number | null, unit: string, category: GroceryCategory): GroceryItem =>
  ({ id: `seed-${gi++}`, name, qty, unit, category, checked: false, source: 'custom', price: null });

export const SEED_GROCERIES: GroceryItem[] = [
  g('Large eggs', 12, 'eggs', 'Protein'),
  g('Turkey breakfast sausage', 8, 'oz', 'Protein'),
  g('Chicken breast (raw)', 1.25, 'lb', 'Protein'),
  g('93% lean ground turkey (raw)', 1.25, 'lb', 'Protein'),
  g('93% lean ground beef (raw)', 0.75, 'lb', 'Protein'),
  g('Shrimp (raw)', 0.75, 'lb', 'Protein'),
  g('Salmon', 1.25, 'lb', 'Protein'),
  g('Nonfat Greek yogurt', 32, 'oz', 'Dairy'),
  g('High-protein Greek yogurt cups', 7, 'cups', 'Dairy'),
  g('2% milk', null, '', 'Dairy'),
  g('Shredded mozzarella', null, '', 'Dairy'),
  g('Rolled oats', null, '', 'Grains'),
  g('Whole-wheat bread', 1, 'loaf', 'Grains'),
  g('Rice', null, '', 'Grains'),
  g('Penne', 1, 'box', 'Grains'),
  g('Elbow macaroni', 1, 'box', 'Grains'),
  g('Potatoes', null, '', 'Grains'),
  g('Blueberries', null, '', 'Fruits'),
  g('Strawberries', null, '', 'Fruits'),
  g('Avocados', 2, 'avocados', 'Fruits'),
  g('Frozen corn', 1, 'bag', 'Vegetables'),
  g('Frozen green beans', 1, 'bag', 'Vegetables'),
  g('Black beans', null, 'cans', 'Pantry'),
  g('Olive oil', null, '', 'Pantry'),
  g('Salsa', 1, 'jar', 'Sauces'),
  g('Marinara', 1, 'jar', 'Sauces'),
  g('Dark chocolate', null, '', 'Desserts'),
  g('Unsweetened cocoa powder', null, '', 'Desserts'),
  g('Chocolate chips', null, '', 'Desserts'),
  g('Chocolate frozen yogurt bars', 1, 'box', 'Desserts'),
  g('Chocolate chip cookies', 1, 'package', 'Desserts'),
  g('Zero-calorie sweetener', null, '', 'Desserts')
];

export const PREP_SUNDAY: PrepTask[] = [
  { id: 'su-chicken', title: 'Cook chicken breast', minutes: 30, ingredients: ['~1¼ lb raw chicken breast', 'Seasoning', 'Olive oil spray'],
    instructions: 'Heat oven to 425°F. Season chicken, bake 18–22 min until the thickest part reads 165°F. Rest 5 min, then slice.' },
  { id: 'su-rice', title: 'Prepare rice', minutes: 25, ingredients: ['~1 cup dry rice', 'Water'],
    instructions: 'Cook rice per package (or rice cooker). Spread on a tray to cool quickly before portioning.' },
  { id: 'su-bowls', title: 'Portion chicken bowls', minutes: 10, ingredients: ['Cooked chicken', 'Cooked rice', 'Frozen corn', '3 containers'],
    instructions: 'Into each container: 4 oz cooked chicken, ½ cup rice, ¼ cup corn. Keep avocado and salsa separate — add when serving.' },
  { id: 'su-fruit', title: 'Wash fruit', minutes: 10, ingredients: ['Blueberries', 'Strawberries'],
    instructions: 'Rinse, dry well on a towel, and store in lined containers. Hull strawberries just before eating if possible.' },
  { id: 'su-dessert', title: 'Prepare dessert portions', minutes: 10, ingredients: ['Dark chocolate', 'Cookies', 'Small bags'],
    instructions: 'Portion 28 g chocolate and 30 g cookie servings into little bags so tonight’s treat is ready to grab.' },
  { id: 'su-oats', title: 'Prepare overnight oats as needed', minutes: 5, ingredients: ['Oats', 'Greek yogurt', '2% milk', 'Jars'],
    instructions: 'Make jars for the oats breakfasts this week (up to 3 days ahead). Add strawberries the morning you eat them.' },
  { id: 'su-organize', title: 'Organize containers', minutes: 5, ingredients: ['Labels or tape'],
    instructions: 'Label with the day. Front of the fridge: Mon–Wed lunches. Back: snacks and extras.' }
];

export const PREP_WEDNESDAY: PrepTask[] = [
  { id: 'we-turkey', title: 'Cook ground turkey', minutes: 20, ingredients: ['~1¼ lb raw 93% lean ground turkey', 'Taco seasoning'],
    instructions: 'Brown in a skillet, breaking it up, until it reaches 165°F. Stir in taco seasoning and a splash of water.' },
  { id: 'we-rice', title: 'Prepare rice', minutes: 25, ingredients: ['~1 cup dry rice', 'Water'],
    instructions: 'Cook and cool quickly on a tray before portioning.' },
  { id: 'we-beans', title: 'Prepare black beans', minutes: 5, ingredients: ['1–2 cans black beans'],
    instructions: 'Drain, rinse, and warm briefly. Season with a pinch of the taco seasoning if you like.' },
  { id: 'we-bowls', title: 'Portion turkey bowls', minutes: 10, ingredients: ['Cooked turkey', 'Rice', 'Beans', '4 containers'],
    instructions: 'Into each container: 4 oz turkey, ½ cup rice, ½ cup beans. Salsa goes on at serving time.' },
  { id: 'we-freeze', title: 'Freeze later portions', minutes: 5, ingredients: ['Freezer-safe containers'],
    instructions: 'Freeze the Saturday and Sunday bowls. Move each to the fridge the night before to thaw.' },
  { id: 'we-dessert', title: 'Prepare chocolate desserts', minutes: 10, ingredients: ['Greek yogurt', 'Cocoa', 'Chocolate chips', 'Sweetener'],
    instructions: 'Mix 1–2 pudding jars (keep 3–4 days). Restock chocolate and cookie portions.' },
  { id: 'we-snacks', title: 'Organize snacks', minutes: 5, ingredients: ['Yogurt cups', 'Eggs'],
    instructions: 'Line up the yogurt cups. Boil a few eggs if you want backup snacks for hungry days.' }
];

export const FOOD_SAFETY = [
  'Refrigerate cooked food within 2 hours (1 hour if it’s hot out). Fridge at 40°F or below.',
  'Cooked chicken, turkey, beef, seafood, and rice: eat within 3–4 days from the fridge.',
  'Cool rice fast — spread it on a tray — and don’t leave it at room temperature.',
  'Freeze anything you won’t eat within 3 days. Best quality within 2–3 months.',
  'Thaw in the fridge overnight, never on the counter. Reheat leftovers to 165°F.',
  'Cut avocado browns quickly — add it fresh at serving time.'
];

export const MOTIVATION = [
  'Small steps, every day, add up beautifully.',
  'You don’t have to be perfect to be consistent.',
  'Nourish, move, rest — that’s the whole plan.',
  'Progress isn’t always loud. Keep showing up.',
  'Dessert is part of the plan. Enjoy it.',
  'Your future self is grateful for today.',
  'Gentle and steady wins this one.',
  'Every walk counts. Every meal counts. You count.',
  'Be proud of the choices you make today.',
  'A good day doesn’t have to be a perfect day.'
];

export const defaultSettings = (today: string): Settings => ({
  name: 'beautiful',
  startWeight: 178,
  goalWeight: 150,
  heightIn: 67,
  age: 33,
  calTarget: 1600,
  calMin: 1550,
  calMax: 1700,
  proteinMin: 115,
  proteinMax: 135,
  waterTarget: 8,
  workoutMinutes: 20,
  walkMinutes: 20,
  weightUnit: 'lb',
  lengthUnit: 'in',
  theme: 'light',
  dislikes: [],
  autoFillWeeks: true,
  sound: true,
  vibration: true,
  reminders: [
    { id: 'r-walk', label: 'Lunch walk', time: '12:00', on: false },
    { id: 'r-weigh', label: 'Morning weigh-in', time: '07:30', on: false },
    { id: 'r-workout', label: 'Home workout', time: '18:00', on: false }
  ],
  startDate: today
});
