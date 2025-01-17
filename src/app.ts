import { Chess, parseSquare, type Move, fen } from "chessops";
import { Chessground } from "chessground";

const toPlayDisplay = document.querySelector<HTMLSpanElement>("#to-play")!;

const fenForm = document.querySelector<HTMLFormElement>("#fen-form")!;
const fenInput = document.querySelector<HTMLInputElement>("#fen")!;

// Stateful chess
let chess = Chess.default();

// Chess UI
const board = Chessground(document.querySelector<HTMLDivElement>("#board")!, {
  highlight: {
    lastMove: false,
  },
  movable: {
    events: {
      after: (from, to) => {
        const move: Move = {
          from: parseSquare(from)!,
          to: parseSquare(to)!,
        };

        if (chess.isLegal(move)) chess.play(move);
        // This is a hack to force queen promotion
        // We can't add it in the previous 'if', because then it would be treated as an illegal move
        else if (chess.isLegal({ ...move, promotion: "queen" }))
          chess.play({ ...move, promotion: "queen" });
        board.set({ fen: fen.makeBoardFen(chess.board) });
        toPlayDisplay.textContent = `${chess.turn} to play`;
      },
    },
  },
});

fenForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const pgnInputValue = fenInput.value;
  if (!pgnInputValue) return;

  try {
    const setup = fen.parseFen(fenInput.value).unwrap();
    const pos = Chess.fromSetup(setup).unwrap();
    chess = pos;

    board.set({ fen: fen.makeBoardFen(chess.board) });
    toPlayDisplay.textContent = `${chess.turn} to play`;
  } catch (error) {
    console.error(error);
  }

  // Clear the input after submission
  fenInput.value = "";
});
