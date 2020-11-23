import create from 'zustand/vanilla';

export type State = {
  offsetX: number;
  offsetY: number;
  scrollPos: number;
  selection: number[];
};

export type Reducers = {};

export type Store = State & Reducers;

export const store = create<Store>((set, get) => ({
  offsetX: 0,
  offsetY: 0,
  scrollPos: 0,
  selection: [],
}));
