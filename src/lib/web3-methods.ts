import type EventEmitter from 'eventemitter3'
import * as anchor from '@coral-xyz/anchor'
import * as web3 from '@solana/web3.js'
import { GameState, TicTacToe } from './types'

export class GameWeb3 {
  constructor(
    readonly program: anchor.Program<TicTacToe>,
    readonly conn: web3.Connection,
    readonly gameKeypair: web3.Keypair,
    readonly playerOne: web3.Keypair,
    readonly playerTwo: web3.Keypair
  ) {}

  async fundAccount(pubkey: web3.PublicKey) {
    const signature = await this.conn.requestAirdrop(
      pubkey,
      web3.LAMPORTS_PER_SOL
    )
    await this.conn.confirmTransaction({
      signature,
      ...(await this.conn.getLatestBlockhash()),
    })
    return signature
  }

  async fetchGameState(): Promise<GameState> {
    return this.program.account.game.fetch(
      this.gameKeypair.publicKey
    ) as Promise<GameState>
  }

  gameStateSubscription(): EventEmitter {
    return this.program.account.game.subscribe(this.gameKeypair.publicKey)
  }

  async setupGame() {
    const signature = await this.program.methods
      .setupGame(this.playerTwo.publicKey)
      .accounts({
        game: this.gameKeypair.publicKey,
        playerOne: this.playerOne.publicKey,
      })
      .signers([this.gameKeypair])
      .rpc()

    const gameStateSubscription = this.gameStateSubscription()
    return { signature, gameStateSubscription }
  }

  async play(
    player: web3.Keypair,
    row: number,
    col: number
  ): Promise<{ signature: string }> {
    const signature = await this.program.methods
      .play({ row, column: col })
      .accounts({
        game: this.gameKeypair.publicKey,
        player: player.publicKey,
      })
      .signers([player])
      .rpc()

    return { signature }
  }

  async getAccountFunds(pubkey: web3.PublicKey) {
    const account = await this.conn.getAccountInfo(pubkey)
    return account?.lamports ?? 0
  }
}
