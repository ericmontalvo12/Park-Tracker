export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  secret?: boolean; // hidden until earned
}

// ─── Milestone ────────────────────────────────────────────────────────────────
const MILESTONE: BadgeDefinition[] = [
  { id: 'first_steps',    emoji: '🥾', name: 'First Steps',      description: 'Visit your first park' },
  { id: 'explorer',       emoji: '🧭', name: 'Explorer',         description: 'Visit 5 parks' },
  { id: 'trailblazer',    emoji: '🌲', name: 'Trailblazer',      description: 'Visit 15 parks' },
  { id: 'adventurer',     emoji: '⛺', name: 'Adventurer',       description: 'Visit 30 parks' },
  { id: 'enthusiast',     emoji: '🎽', name: 'Park Enthusiast',  description: 'Visit 50 parks' },
  { id: 'park_ranger',    emoji: '🎖️', name: 'Park Ranger',      description: 'Visit 63 parks' },
  { id: 'legend',         emoji: '🏆', name: 'Legend',           description: 'Visit 100 parks' },
];

// ─── National Parks ────────────────────────────────────────────────────────────
const NATIONAL: BadgeDefinition[] = [
  { id: 'national_debut', emoji: '🏔️', name: 'National Debut',  description: 'Visit your first national park' },
  {
    id: 'big_five',
    emoji: '⭐',
    name: 'The Big Five',
    description: 'Visit the 5 most-visited national parks (Great Smoky, Grand Canyon, Zion, Rocky Mountain, Acadia)',
  },
  {
    id: 'grand_slam',
    emoji: '💎',
    name: 'Grand Slam',
    description: 'Visit Grand Canyon, Yellowstone, Yosemite & Glacier',
  },
  {
    id: 'desert_quad',
    emoji: '🌵',
    name: 'Desert Quad',
    description: 'Visit Death Valley, Joshua Tree, Saguaro & Petrified Forest',
  },
  {
    id: 'alaska_pack',
    emoji: '🐺',
    name: 'Alaska Pack',
    description: 'Visit Denali, Glacier Bay, Katmai & Wrangell-St. Elias',
  },
  {
    id: 'alaska_wild',
    emoji: '🐻',
    name: 'Alaska Wild',
    description: 'Visit all 8 Alaskan national parks',
  },
  {
    id: 'nps_complete',
    emoji: '🇺🇸',
    name: 'NPS Complete',
    description: 'Visit all 63 national parks',
  },
];

// ─── Geographic ────────────────────────────────────────────────────────────────
const GEOGRAPHIC: BadgeDefinition[] = [
  { id: 'state_hopper',  emoji: '✈️',  name: 'State Hopper',  description: 'Visit parks in 5 different states' },
  { id: 'bicoastal',     emoji: '🌊',  name: 'Bicoastal',     description: 'Visit parks on both the East and West coasts' },
  { id: 'all_regions',   emoji: '🗺️',  name: 'All Regions',   description: 'Visit parks in all 5 US regions' },
  { id: 'fifty_states',  emoji: '🌎',  name: '50 States',     description: 'Visit a park in every US state' },
];

// ─── Designation Collector ─────────────────────────────────────────────────────
const DESIGNATION: BadgeDefinition[] = [
  { id: 'beach_bum',      emoji: '🏖️', name: 'Beach Bum',      description: 'Visit 5 state beaches' },
  { id: 'forest_dweller', emoji: '🌳', name: 'Forest Dweller', description: 'Visit 5 state forests' },
  { id: 'type_collector', emoji: '🎒', name: 'Type Collector', description: 'Visit all 5 park types (National Park, State Park, State Forest, State Beach, State Recreation Area)' },
];

// ─── Engagement ────────────────────────────────────────────────────────────────
const ENGAGEMENT: BadgeDefinition[] = [
  { id: 'critic',       emoji: '⭐', name: 'Critic',       description: 'Rate 10 parks' },
  { id: 'storyteller',  emoji: '📝', name: 'Storyteller',  description: 'Add notes to 10 parks' },
  { id: 'photographer', emoji: '📸', name: 'Photographer', description: 'Add photos to 5 parks' },
];

export const BADGES: BadgeDefinition[] = [
  ...MILESTONE,
  ...NATIONAL,
  ...GEOGRAPHIC,
  ...DESIGNATION,
  ...ENGAGEMENT,
];

export const BADGE_MAP = new Map<string, BadgeDefinition>(BADGES.map(b => [b.id, b]));

// ─── Criteria constants used by the evaluator ─────────────────────────────────

export const BIG_FIVE_IDS   = new Set(['grsm', 'grca', 'zion', 'romo', 'acad']);
export const GRAND_SLAM_IDS = new Set(['grca', 'yell', 'yose', 'glac']);
export const DESERT_QUAD_IDS = new Set(['deva', 'jotr', 'sagu', 'pefo']);
export const ALASKA_PACK_IDS = new Set(['dena', 'glba', 'katm', 'wrst']);
export const ALASKA_WILD_IDS = new Set(['dena', 'gaar', 'glba', 'katm', 'kefj', 'kova', 'lacl', 'wrst']);

export const NPS_PARK_CODES = new Set([
  'acad','npsa','arch','badl','bibe','bisc','blca','brca','cany','care',
  'cave','chis','cong','crla','cuva','deva','dena','drto','ever','gaar',
  'jeff','glac','glba','grca','grte','grba','grsa','grsm','gumo','hale',
  'havo','hosp','indu','isro','jotr','katm','kefj','sequ','kica','kova',
  'lacl','lavo','maca','meve','mora','neri','noca','olym','pefo','pinn',
  'redw','romo','sagu','shen','thro','viis','voya','whsa','wica','wrst',
  'yell','yose','zion',
]);

export const EAST_COAST_STATES = new Set([
  'ME','NH','VT','MA','RI','CT','NY','NJ','DE','MD','VA','NC','SC','GA','FL',
]);
export const WEST_COAST_STATES = new Set(['WA','OR','CA']);

export const US_REGIONS: Record<string, Set<string>> = {
  Northeast: new Set(['ME','NH','VT','MA','RI','CT','NY','NJ','PA']),
  Southeast: new Set(['DE','MD','VA','WV','NC','SC','GA','FL','AL','MS','TN','KY']),
  Midwest:   new Set(['OH','MI','IN','IL','WI','MN','IA','MO','ND','SD','NE','KS']),
  Southwest: new Set(['TX','OK','NM','AZ','CO','UT','NV','AR','LA']),
  West:      new Set(['WA','OR','CA','MT','ID','WY','AK','HI']),
};

export const ALL_50_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]);
