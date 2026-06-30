const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Weapon', 'Relic', 'Armor'],
      required: true,
    },
    rarity: {
      type: String,
      enum: ['R', 'SR', 'SSR'],
      required: true,
    },
    statMultiplier: {
      strength: { type: Number, default: 1.0 },
      intelligence: { type: Number, default: 1.0 },
      perception: { type: Number, default: 1.0 },
      vitality: { type: Number, default: 1.0 },
      agility: { type: Number, default: 1.0 },
    },
    unlockCondition: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
