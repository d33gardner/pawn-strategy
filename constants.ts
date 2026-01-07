import { Player } from './types';

export const BOARD_SIZE = 8;
export const MOVES_PER_TURN = 4;

export const PLAYER_CONFIG = {
  [Player.WHITE]: {
    name: 'White',
    color: 'bg-white',
    textColor: 'text-slate-900',
    borderColor: 'border-slate-300',
    baseRow: 0,
    targetRow: 7,
    direction: 1, // Moves +y
  },
  [Player.BLACK]: {
    name: 'Black',
    color: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-700',
    baseRow: 7,
    targetRow: 0,
    direction: -1, // Moves -y
  },
};
