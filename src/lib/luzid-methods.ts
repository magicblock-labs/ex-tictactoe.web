import * as anchor from '@coral-xyz/anchor'
import * as web3 from '@solana/web3.js'
import { AccountModification, Cluster, LuzidSdk } from '@luzid/sdk'
import { SNAPSHOT_GROUP, TIC_TAC_TOE_PROGRAM_ID } from './consts'
import { GameState, TicTacToe } from './types'
export class GameLuzid {
  snapshotCount = 0

  constructor(
    readonly luzid: LuzidSdk,
    readonly conn: web3.Connection,
    readonly gameKeypair: web3.Keypair,
    readonly playerOne: web3.Keypair,
    readonly playerTwo: web3.Keypair
  ) {}

  async cloneTictactoeProgram() {
    await this.luzid.mutator.cloneAccount(
      Cluster.Devnet,
      TIC_TAC_TOE_PROGRAM_ID
    )
    return this.conn.getAccountInfo(new web3.PublicKey(TIC_TAC_TOE_PROGRAM_ID))
  }

  async restartValidator() {
    await this.luzid.validator.restart()
    return this.conn.getVersion()
  }

  takeSnapshot() {
    return this.luzid.snapshot.createSnapshot(
      `Snapshot ${this.snapshotCount++}`,
      [
        this.playerOne.publicKey.toBase58(),
        this.playerTwo.publicKey.toBase58(),
        this.gameKeypair.publicKey.toBase58(),
      ],
      {
        description: `Game: TicTacToe (${this.gameKeypair.publicKey.toBase58()})`,
        group: SNAPSHOT_GROUP,
      }
    )
  }

  restoreLastUpdatedSnapshot() {
    return this.luzid.snapshot.restoreAccountsFromLastUpdatedSnapshot({
      deleteSnapshotAfterRestore: true,
      filter: { group: SNAPSHOT_GROUP },
    })
  }

  async modifyGameState(
    program: anchor.Program<TicTacToe>,
    gameState: GameState
  ) {
    const data = await program.coder.accounts.encode('Game', gameState)
    const gameAccountDef = program.idl.accounts[0]
    const size = program.coder.accounts.size(gameAccountDef)
    return this.luzid.mutator.modifyAccount(
      AccountModification.forAddr(
        this.gameKeypair.publicKey.toBase58()
      ).setData(data, { size })
    )
  }

  async deleteAppSnapshots() {
    return this.luzid.snapshot.deleteSnapshotsMatching({
      group: SNAPSHOT_GROUP,
    })
  }

  labelTransaction(signature: string, label: string) {
    return this.luzid.transaction.labelTransaction(signature, label)
  }
}
