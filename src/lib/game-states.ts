/*
 * | X | O |   |
 * |   | O |   |
 * | X |   | X |
 */
export const O_WINNING = {
  turn: 6,
  board: [
    [
      {
        x: {},
      },
      {
        o: {},
      },
      null,
    ],
    [
      null,
      {
        o: {},
      },
      null,
    ],
    [
      {
        x: {},
      },
      null,
      {
        x: {},
      },
    ],
  ],
  state: {
    active: {},
  },
}

export const DRAWING = {
  turn: 8,
  board: [
    [
      {
        x: {},
      },
      {
        o: {},
      },
      {
        x: {},
      },
    ],
    [
      {
        o: {},
      },
      {
        x: {},
      },
      {
        o: {},
      },
    ],
    [
      {
        x: {},
      },
      {
        o: {},
      },
      {
        x: {},
      },
    ],
  ],
  state: {
    active: {},
  },
}
