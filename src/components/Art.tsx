// Quiet line icons instead of illustrations — they read as refined at any size and suit every color theme.
import {
  Apple, Bike, CakeSlice, Cherry, Cookie, CookingPot, Dumbbell, Egg, Fish, Footprints, IceCreamBowl, Milk,
  PersonStanding, Popsicle, Salad, Sandwich, Soup, StretchHorizontal, UtensilsCrossed, Wheat, Wind, Activity, MoveVertical
} from 'lucide-react';

const FOOD: Record<string, typeof Egg> = {
  eggs: Egg, oats: Wheat, bowl: Salad, taco: Sandwich, salmon: Fish, pasta: Soup, skillet: CookingPot,
  yogurt: Milk, 'choc-berry': Cherry, pudding: IceCreamBowl, froyo: Popsicle, cookies: Cookie, custom: UtensilsCrossed,
  snack: Apple, dessert: CakeSlice
};

export function FoodArt({ art, size = 56 }: { art: string; size?: number }) {
  const Icon = FOOD[art] ?? UtensilsCrossed;
  return (
    <div className="shrink-0 rounded-[12px] bg-petal text-ink grid place-items-center" style={{ width: size, height: size }} aria-hidden>
      <Icon size={Math.round(size * 0.42)} strokeWidth={1.4} />
    </div>
  );
}

const MOVE: Record<string, typeof Egg> = {
  squat: MoveVertical, pushup: Dumbbell, hinge: StretchHorizontal, knee: Activity, march: Footprints,
  warmup: PersonStanding, cooldown: StretchHorizontal, rest: Wind, bike: Bike, walk: Footprints
};

export function ExerciseArt({ id, size = 120 }: { id?: string; size?: number }) {
  const Icon = MOVE[id ?? 'walk'] ?? Activity;
  return <Icon size={Math.round(size * 0.5)} strokeWidth={1.2} className="text-muted" aria-hidden />;
}

/** The Glow-Up mark, drawn in the current color theme. */
export function Logo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <radialGradient id="logoBg" cx="35%" cy="30%" r="80%"><stop offset="0%" style={{ stopColor: 'var(--band-1)' }} /><stop offset="100%" style={{ stopColor: 'var(--band-2)' }} /></radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="url(#logoBg)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
      <path d="M37.5 15.9 A17 17 0 1 1 26.5 15.9" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="15" r="2.4" style={{ fill: 'var(--accent)' }} />
    </svg>
  );
}
