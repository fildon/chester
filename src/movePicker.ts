import { Chess, fen, type Move } from "chessops";

type EvaluatedState = {
  value: number;
  certain: boolean;
};

const heuristicEvaluation = (chess: Chess): EvaluatedState => {
  return {
    value:
      [...chess.board["white"]].flatMap((from) =>
        [...chess.dests(from, chess.ctx())].map((to) => ({ from, to }))
      ).length -
      [...chess.board["black"]].flatMap((from) =>
        [...chess.dests(from, chess.ctx())].map((to) => ({ from, to }))
      ).length,
    certain: false,
  };
};

// Maximises result on our turn, but minimises it on opponent's turn
const minMaxValueComparator = (
  a: EvaluatedState,
  b: EvaluatedState,
  shouldMaximise = true // should this sorter try to maximise or minimise the result
) => {
  // Invert result if we want the minimizer
  return (b.value - a.value) * (shouldMaximise ? 1 : -1);
};

const evaluateState = (
  chess: Chess,
  recursiveLimit: number
): EvaluatedState => {
  if (chess.isStalemate())
    // A tie is worth nothing!
    return { value: 0, certain: true };

  if (chess.isCheckmate())
    // TODO not clear if this condition is the right way around
    return { value: chess.turn === "white" ? -1 : 1, certain: true };

  if (recursiveLimit === 0) {
    return heuristicEvaluation(chess);
  }

  const allMoves = [...chess.board[chess.turn]].flatMap((from) =>
    [...chess.dests(from, chess.ctx())].map((to) => ({ from, to }))
  );

  const rankedFutureStates = allMoves
    .map((move) => {
      const clone = chess.clone();
      clone.play(move);
      return memoEvaluateStateForPlayer(clone, recursiveLimit - 1);
    })
    .sort((a, b) => minMaxValueComparator(a, b, chess.turn === "white"));

  const bestFutureState = rankedFutureStates[0];

  return {
    value: bestFutureState.value,
    certain: bestFutureState.certain,
  };
};

const memoedEvaluations: Record<string, EvaluatedState> = {};

const memoEvaluateStateForPlayer = (state: Chess, recursiveLimit = 2) => {
  const memoKey = fen.makeBoardFen(state.board);
  if (memoedEvaluations[memoKey]) {
    return memoedEvaluations[memoKey];
  }

  const realEvaluation = evaluateState(state, recursiveLimit);

  if (realEvaluation.certain) {
    memoedEvaluations[memoKey] = realEvaluation;
  }

  return realEvaluation;
};

export const pickBestMove = (chess: Chess): Move => {
  // Get the set of all legal moves
  const allMoves = [...chess.board[chess.turn]].flatMap((from) =>
    [...chess.dests(from, chess.ctx())].map((to) => ({ from, to }))
  );
  // Evaluate the state each move would yield
  const rankedMoves = allMoves
    .map((move) => {
      const clone = chess.clone();
      clone.play(move);
      return {
        move,
        evaluation: memoEvaluateStateForPlayer(clone),
      };
    })
    .sort((a, b) =>
      minMaxValueComparator(a.evaluation, b.evaluation, chess.turn === "white")
    );

  // pick randomly from equal best
  const bestMove = rankedMoves[0];
  const equalBestMoves = rankedMoves
    .filter(({ evaluation }) => evaluation.value === bestMove.evaluation.value)
    .map(({ move }) => move);

  const randomBestMove =
    equalBestMoves[Math.floor(Math.random() * equalBestMoves.length)];

  return randomBestMove;
};
