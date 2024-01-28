import * as anchor from '@coral-xyz/anchor'

import idl from '../../idl/tictactoe.json'
export type TicTacToe = typeof idl & anchor.Idl

export type Won = { won: { winner: string } }
export type Tie = { tie: {} }
export type Active = { active: {} }
export type GameState = {
  board: string[][]
  turn: number
  state: Won | Tie | Active
}
