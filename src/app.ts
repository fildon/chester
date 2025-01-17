import { Chess } from "chess.js";
import { Chessground } from "chessground";

// Stateful chess
const chess = new Chess();

// Chess UI
const board = Chessground(document.getElementById("board")!, {
  movable: {
    events: {
      after: (from, to) => {
        try {
          // An illegal move throws an error
          chess.move({ from, to, promotion: "q" });
        } catch (error) {
          console.error(error);
        } finally {
          // Either chess was legally updated or not,
          // either way this updates the UI accordingly
          board.set({ fen: chess.fen() });
        }
      },
    },
  },
});
