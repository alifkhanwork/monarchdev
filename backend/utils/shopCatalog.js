/** Lightweight EXP Reward Shop catalog. */

const SHOP_ITEMS = [
  {
    id: 'title_shadow_initiate',
    name: 'Title: Shadow Initiate',
    description: 'Cosmetic hunter title for your profile.',
    cost: 200,
    type: 'title',
    payload: 'Shadow Initiate',
  },
  {
    id: 'title_iron_will',
    name: 'Title: Iron Will',
    description: 'Earned grit — display on your hunter card.',
    cost: 400,
    type: 'title',
    payload: 'Iron Will',
  },
  {
    id: 'title_system_breaker',
    name: 'Title: System Breaker',
    description: 'Rare cosmetic title with neon flair.',
    cost: 800,
    type: 'title',
    payload: 'System Breaker',
  },
  {
    id: 'accent_crimson',
    name: 'Accent: Crimson Edge',
    description: 'Subtle crimson theme accent for panels.',
    cost: 350,
    type: 'theme',
    payload: 'crimson',
  },
  {
    id: 'accent_violet',
    name: 'Accent: Violet Core',
    description: 'Violet accent wash for the System UI.',
    cost: 350,
    type: 'theme',
    payload: 'violet',
  },
  {
    id: 'token_cheat_day',
    name: 'Cheat Day Token',
    description: 'One-use token — stockpile for a future rest privilege.',
    cost: 500,
    type: 'token',
    payload: 'cheat_day',
    stackable: true,
  },
];

module.exports = { SHOP_ITEMS };
