const User = require('../models/User');

const PLAYER_POPULATE = [
  { path: 'equippedWeapon' },
  { path: 'equippedRelic' },
  { path: 'inventory' },
];

const getPlayer = async () => {
  let user = await User.findOne().populate(PLAYER_POPULATE);
  if (!user) {
    user = await User.create({});
    user = await User.findById(user._id).populate(PLAYER_POPULATE);
  }
  return user;
};

module.exports = { getPlayer, PLAYER_POPULATE };
