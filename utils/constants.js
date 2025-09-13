// utils/constants.js - App constants
export const WORKOUT_TYPES = {
  BASKETBALL: 'Basketball',
  RUNNING: 'Running',
  CYCLING: 'Cycling',
  SWIMMING: 'Swimming',
  GYM: 'Gym Workout',
  YOGA: 'Yoga',
  TENNIS: 'Tennis',
  SOCCER: 'Soccer',
  FOOTBALL: 'Football',
  GENERAL: 'General Fitness',
};

export const CALORIE_ESTIMATES = {
  [WORKOUT_TYPES.BASKETBALL]: 8, // calories per minute
  [WORKOUT_TYPES.RUNNING]: 11,
  [WORKOUT_TYPES.CYCLING]: 7,
  [WORKOUT_TYPES.SWIMMING]: 12,
  [WORKOUT_TYPES.GYM]: 6,
  [WORKOUT_TYPES.YOGA]: 3,
  [WORKOUT_TYPES.TENNIS]: 8,
  [WORKOUT_TYPES.SOCCER]: 9,
  [WORKOUT_TYPES.FOOTBALL]: 8,
  [WORKOUT_TYPES.GENERAL]: 5,
};