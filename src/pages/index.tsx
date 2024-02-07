import Button from '@/components/button'
import { Inter } from 'next/font/google'
import { Cluster, LuzidSdk } from '@luzid/sdk'
import * as anchor from '@coral-xyz/anchor'
import * as web3 from '@solana/web3.js'
import { useEffect, useState } from 'react'
import BrowserWallet from '@/lib/browser-wallet'
import toast, { toastConfig } from 'react-simple-toasts'
import 'react-simple-toasts/dist/theme/dark.css'
import { TABLE_CELL_CLASS, TIC_TAC_TOE_PROGRAM_ID } from '@/lib/consts'
import { GameState, TicTacToe } from '@/lib/types'
import idl from '../../idl/tictactoe.json'
import { GameWeb3 } from '@/lib/web3-methods'
import { GameLuzid } from '@/lib/luzid-methods'
import { Board } from '@/components/board'
import Link from '@/components/link'
import { O_WINNING } from '@/lib/game-states'

toastConfig({ theme: 'dark' })
const inter = Inter({ subsets: ['latin'] })

// -----------------
// Setup
// -----------------
// Accounts used for this Game (they are refreshed on each page load)
const gameKeypair = web3.Keypair.generate()
const playerOne = web3.Keypair.generate()
const playerTwo = web3.Keypair.generate()

// Connections and Providers
const luzid = new LuzidSdk()
const conn = new web3.Connection(Cluster.Development.apiUrl, 'confirmed')

const wallet = new BrowserWallet(playerOne)
const provider = new anchor.AnchorProvider(conn, wallet, {
  commitment: 'confirmed',
  skipPreflight: true,
})
const program = new anchor.Program(
  idl as TicTacToe,
  TIC_TAC_TOE_PROGRAM_ID,
  provider
)

const gameWeb3 = new GameWeb3(program, conn, gameKeypair, playerOne, playerTwo)
const gameLuzid = new GameLuzid(luzid, conn, gameKeypair, playerOne, playerTwo)

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [gameFunds, setGameFunds] = useState(0)
  const [playerOneFunds, setPlayerOneFunds] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState(playerOne)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    const nextPlayer = (gameState?.turn ?? 0) % 2 === 0 ? playerTwo : playerOne
    setCurrentPlayer(nextPlayer)
  }, [gameState])

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  async function updateFunds() {
    const gameFunds = await gameWeb3.getAccountFunds(gameKeypair.publicKey)
    setGameFunds(gameFunds)
    const playerOneFunds = await gameWeb3.getAccountFunds(playerOne.publicKey)
    setPlayerOneFunds(playerOneFunds)
  }

  async function handlePlay(row: number, col: number) {
    await gameLuzid.takeSnapshot()

    const { signature, gameState } = await gameWeb3.play(
      currentPlayer,
      row,
      col
    )
    const piece = currentPlayer === playerOne ? 'X' : 'O'
    gameLuzid.labelTransaction(signature, `Place ${piece} at (${row}, ${col})`)

    console.log(JSON.stringify(gameState, null, 2))
    setGameState(gameState)

    const nextPlayer = currentPlayer === playerOne ? playerTwo : playerOne
    setCurrentPlayer(nextPlayer)

    await updateFunds()
  }
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-4 ${inter.className}`}
    >
      {/*-- Game */}
      <div className="flex">
        {/*
            Game: Luzid Actions
        */}

        <div className="flex-auto dark:text-white max-w-sm p-6 border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
          <h3>Luzid Actions</h3>

          <Button
            onClick={async () => {
              await gameLuzid.cloneTictactoeProgram()
              toast('TicTacToe Program Cloned')
            }}
          >
            1. Clone Program
          </Button>
          <Button
            onClick={async () => {
              const snapshotId = await gameLuzid.restoreLastUpdatedSnapshot()
              console.log('Restored Snapshot:', snapshotId)

              const gameState = await gameWeb3.fetchGameState()
              setGameState(gameState)
              await updateFunds()

              toast('Snapshot Restored')
            }}
          >
            Undo Last Action
          </Button>
          <Button
            onClick={async () => {
              // 1. Modify
              {
                const gameState = await gameWeb3.fetchGameState()
                await gameLuzid.modifyGameState(program, {
                  ...gameState,
                  ...O_WINNING,
                } as unknown as GameState)
              }
              // 2. Fetch modified game
              {
                const gameState = await gameWeb3.fetchGameState()
                setGameState(gameState)

                await updateFunds()
              }

              toast('Game State Updated')
            }}
          >
            Set Winning State
          </Button>
          <Button
            onClick={async () => {
              const snapshotIds = await gameLuzid.deleteAppSnapshots()
              toast(`${snapshotIds.length} App Snapshots Removed`)
            }}
          >
            Remove App Snapshots
          </Button>
          <Button
            onClick={async () => {
              const version = await gameLuzid.restartValidator()
              toast(`Validator Restarted: ${version['solana-core']}`)
            }}
          >
            Restart Validator
          </Button>
        </div>
        {/*
            Game: Game State and TicTacToe Board
        */}
        <div className="flex-initial w-44 dark:text-white max-w-sm p-6 border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
          <h3>Game State</h3>

          <Board
            board={gameState?.board ?? [[], [], []]}
            onPlay={handlePlay}
            state={gameState?.state}
            nextPlayer={currentPlayer === playerOne ? 'X' : 'O'}
          />
        </div>

        {/*
            Game: Web3 Actions
        */}

        <div className="flex-auto dark:text-white max-w-sm p-6 border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
          <h3>Web3 Actions</h3>
          <Button
            onClick={async () => {
              const signature = await gameWeb3.fundAccount(playerOne.publicKey)
              gameLuzid.labelTransaction(signature, 'Fund Player One')

              await updateFunds()
              toast('Player Funded')
            }}
          >
            2. Fund Main Player
          </Button>
          <Button
            onClick={async () => {
              const { signature, gameState } = await gameWeb3.setupGame()
              gameLuzid.labelTransaction(
                signature,
                `Create Game: ${gameKeypair.publicKey.toString()}`
              )
              setGameState(gameState)
              await updateFunds()

              toast('Game Created')
            }}
          >
            3. Create Game
          </Button>
        </div>
      </div>

      {/*
          Table with Game Info
      */}
      <table className="border border-slate-400 border-separate border-spacing-2.52 mt-4">
        <tbody>
          <tr>
            <td className={TABLE_CELL_CLASS}>Game</td>
            <td className={TABLE_CELL_CLASS}>
              ◎{(gameFunds / web3.LAMPORTS_PER_SOL).toFixed(6)} SOL
            </td>
            <td className={TABLE_CELL_CLASS}>
              <Link
                href={`https://explorer.solana.com/address/${gameKeypair.publicKey.toString()}/anchor-account?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`}
              >
                {gameKeypair.publicKey.toString()}
              </Link>
            </td>
          </tr>
          <tr>
            <td className={TABLE_CELL_CLASS}>Player One</td>
            <td className={TABLE_CELL_CLASS}>
              ◎{(playerOneFunds / web3.LAMPORTS_PER_SOL).toFixed(6)} SOL
            </td>
            <td className={TABLE_CELL_CLASS}>
              <Link
                href={`https://explorer.solana.com/address/${playerOne.publicKey.toString()}/anchor-account?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`}
              >
                {playerOne.publicKey.toString()}
              </Link>
            </td>
          </tr>
          <tr>
            <td className={TABLE_CELL_CLASS}>Player Two</td>
            <td className={TABLE_CELL_CLASS}>◎0 SOL</td>
            <td className={TABLE_CELL_CLASS}>
              <Link
                href={`https://explorer.solana.com/address/${playerTwo.publicKey.toString()}/anchor-account?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`}
              >
                {playerTwo.publicKey.toString()}
              </Link>
            </td>
          </tr>
        </tbody>
      </table>

      {/*
          Bottom section (not important)
      */}
      <div className="">
        <iframe
          className="video"
          src="https://www.youtube.com/embed/M09YWUicVF0?si=qKie6uvErBkTF6RW"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left">
        <a
          href="https://luzid.app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            luzid.app{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Start building on Solana at Light Speed.
          </p>
        </a>

        <a
          href="https://github.com/luzid-app/ex-tictactoe.web"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Game Source{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50 text-balance`}>
            Read through the source code of this game.
          </p>
        </a>
        <a
          href="https://luzid.app/docs/ts"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            SDK Docs{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50 text-balance`}>
            Become proficient at interacting with Luzid via its SDK.
          </p>
        </a>
      </div>
    </main>
  )
}
