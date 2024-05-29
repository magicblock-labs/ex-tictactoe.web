import { Active, Tie, Won } from '@/lib/types'

export function Board({
  board,
  onPlay,
  state,
  nextPlayer,
}: {
  board: Record<'x' | 'o', {}>[][] | any[][]
  state?: Won | Tie | Active
  onPlay: (row: number, col: number) => void
  nextPlayer: string
}) {
  function handleClick(row: number, col: number) {
    onPlay(row, col)
  }
  function renderTile(row: number, col: number) {
    const tile = board[row][col]
    if (tile == null) return ''
    return tile.x != null ? 'X' : 'O'
  }

  function Status() {
    if (state == null) return <p>{`Next player: ${nextPlayer}`}</p>
    if ('won' in state)
      return (
        <p>
          Winner:{' '}
          <p className="text-xs">
            {state.won.winner.toString().slice(0, 16)}...
          </p>
        </p>
      )
    if ('tie' in state) return <p>Tie!</p>
    return <p>{`Next player: ${nextPlayer}`}</p>
  }

  return (
    <>
      <div className="status">
        <Status />
      </div>
      <div className="mt-4 ml-3">
        <div className="board-row">
          <Square
            value={renderTile(0, 0)}
            onSquareClick={() => handleClick(0, 0)}
          />
          <Square
            value={renderTile(0, 1)}
            onSquareClick={() => handleClick(0, 1)}
          />
          <Square
            value={renderTile(0, 2)}
            onSquareClick={() => handleClick(0, 2)}
          />
        </div>
        <div className="board-row">
          <Square
            value={renderTile(1, 0)}
            onSquareClick={() => handleClick(1, 0)}
          />
          <Square
            value={renderTile(1, 1)}
            onSquareClick={() => handleClick(1, 1)}
          />
          <Square
            value={renderTile(1, 2)}
            onSquareClick={() => handleClick(1, 2)}
          />
        </div>
        <div className="board-row">
          <Square
            value={renderTile(2, 0)}
            onSquareClick={() => handleClick(2, 0)}
          />
          <Square
            value={renderTile(2, 1)}
            onSquareClick={() => handleClick(2, 1)}
          />
          <Square
            value={renderTile(2, 2)}
            onSquareClick={() => handleClick(2, 2)}
          />
        </div>
      </div>
    </>
  )
}

function Square({
  value,
  onSquareClick,
}: {
  value: string
  onSquareClick: () => void
}) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  )
}
