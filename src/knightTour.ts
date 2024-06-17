import { Algorithm, Board, Chessboard, KnightTourConfig, KnightTourOutput, Move, Position, TieBreakMethod } from './types';

/* 
https://blogs.asarkar.com/assets/docs/algorithms-curated/Warnsdorff-Rule%20Algorithm%20-%20Squirrel+Cull.pdf

squirrel+cull order of moves
+---+---+---+---+---+
|   | 8 |   | 1 |   |
+---+---+---+---+---+
| 7 |   |   |   | 2 |
+---+---+---+---+---+
|   |   | X |   |   |
+---+---+---+---+---+
| 6 |   |   |   | 3 |
+---+---+---+---+---+
|   | 5 |   | 4 |   |
+---+---+---+---+---+

move orderings by squirrel+cull
12345678,
21345678,
31245678,
13245678,
23145678,
32145678,
42135678,
24135678,
14235678,
41235678,
21435678, 
12435678, 
13425678, 
31425678,
41325678, 
14325678, 
34125678, 
43125678, 
43215678

additional interesting reads:
http://dagstuhl.sunsite.rwth-aachen.de/volltexte/2020/12765/pdf/LIPIcs-FUN-2021-4.pdf
https://sites.science.oregonstate.edu/math_reu/proceedings/REU_Proceedings/Proceedings2004/2004Ganzfried.pdf
*/

const POSSIBLE_KNIGHT_MOVES: Move[] = [
    { x: 1, y: -2, order: 1 },
    { x: 2, y: -1, order: 2 },
    { x: 2, y: 1, order: 3 },
    { x: 1, y: 2, order: 4 },
    { x: -1, y: -2, order: 5 },
    { x: -2, y: -1, order: 6 },
    { x: -2, y: 1, order: 7 },
    { x: -1, y: 2, order: 8 },
];

export class KnightTour {
    startX: number;
    startY: number;
    chessboard: Chessboard;
    algorithm: Algorithm;
    tieBreakMethod: TieBreakMethod;
    iterationLimit: number;
    attemptLimit: number;
    closedTour: boolean;
    moveOrdering: number[];
    iterationCount: number;
    attemptCount: number;

    constructor(config: KnightTourConfig) {
        this.startX = config.startX;
        this.startY = config.startY;
        this.chessboard = config.chessboard;
        this.iterationLimit = config.iterationLimit;
        this.attemptLimit = config.attemptLimit;
        this.closedTour = config.closedTour;
        this.algorithm = config.algorithm;
        this.tieBreakMethod = config.tieBreakMethod;
        this.moveOrdering = config.moveOrdering.toString().split('').map(Number);
        this.iterationCount = 0;
        this.attemptCount = 0;
    }

    async solveKnightTour(): Promise<KnightTourOutput> {
        // const knightTour = new KnightTour(config);

        // const board: Board = [...Array(config.chessboard.width)].map(() => Array(config.chessboard.height).fill(null));
        // const path: Position[] = [];

        // // add initial position to path
        // path.push({ x: config.startX, y: config.startY });
        // board[config.startX][config.startY] = 0; // index of the first move

        // let solution: { board: Board; path: Position[] } | null = null;
        // for (let attempt = 0; attempt < knightTour.attemptLimit; attempt++) {
        //     knightTour.iterationCount = 0;
        //     solution = await knightTour.calculateNextMove(board, path);
        //     if (solution) {
        //         break;
        //     }
        //     knightTour.attemptCount++;
        //     console.log('Attempt:', knightTour.attemptCount);
        // }

        // if (!solution) {
        //     console.log('No solution found');
        // }
        // return solution;
        return { chessboard: null, path: null, message: 'nothin!' };
    }
}

export const calculateKnightPath = async (
    startX = 0,
    startY = 0,
    width: number,
    height: number,
    iterationLimit: number,
    attemptLimit: number,
    closedTour: boolean,
    algorithm: Algorithm,
    tieBreakMethod: TieBreakMethod,
    moveOrdering: number
) => {
    console.log(
        `Calculating ${closedTour ? 'closed' : 'open'} knight tour from:`,
        startX,
        startY,
        'on board:',
        width,
        height,
        'with algorithm:',
        algorithm,
        `${algorithm === Algorithm.WARNSDORF ? `and tie break method: ${tieBreakMethod}` : ''}`
    );

    // If the number of squares on the board configuration is odd and the square clicked was black square, there are no solutions.
    if ((width * height) % 2 !== 0 && (startX + startY) % 2 !== 0) {
        return null;
    }

    const center = { x: width / 2, y: height / 2 };
    const board: Board = [...Array(width)].map(() => Array(height).fill(null));
    const path: Position[] = [];

    let moveOrderArray = moveOrdering ? moveOrdering.toString().split('').map(Number) : [1, 2, 3, 4, 5, 6, 7, 8];

    // add initial position to path
    path.push({ x: startX, y: startY });
    board[startX][startY] = 0; // index of the first move

    let iterationCount = 0;
    let attemptCount = 0;

    const isValidMove = (position: Position, board: Board) => {
        // check if the move is out of boundries of the board
        if (position.x < 0 || position.x > board.length || position.y < 0 || position.y > board[0].length) {
            return false;
            // check if this square was already visited
        } else if (board[position.x]?.[position.y] !== null) {
            return false;
        } else {
            return true;
        }
    };

    const calculateNumberOfValidMoves = (position: Position, board: Board) => {
        let count = 0;
        for (let i = 0; i < POSSIBLE_KNIGHT_MOVES.length; i++) {
            const possibleMove = POSSIBLE_KNIGHT_MOVES[i];
            const newX = position.x + possibleMove.x;
            const newY = position.y + possibleMove.y;

            const newPosition = { x: newX, y: newY };

            if (isValidMove(newPosition, board)) {
                count++;
            }
        }
        return count;
    };

    const calculateNextMove = async (board: Board, path: Position[]): Promise<{ board: Board; path: Position[] } | null> => {
        iterationCount++;

        if (iterationCount % (iterationLimit / 100) === 0) {
            console.log('iteration:', iterationCount);
        }
        if (iterationCount > iterationLimit) {
            return null;
        }
        // if the path array length === number of squares on the board
        if (path.length === board.length * board[0].length) {
            if (closedTour) {
                // check if the last move can move to the initial position
                const lastPosition = path[path.length - 1];
                const firstPosition = path[0];
                for (let i = 0; i < POSSIBLE_KNIGHT_MOVES.length; i++) {
                    const possibleMove = POSSIBLE_KNIGHT_MOVES[i];
                    const newX = lastPosition.x + possibleMove.x;
                    const newY = lastPosition.y + possibleMove.y;

                    const newPosition = { x: newX, y: newY };

                    if (newPosition.x === firstPosition.x && newPosition.y === firstPosition.y) {
                        path.push(newPosition);
                        return { board, path };
                    }
                }
                return null;
            } else {
                return { board, path };
            }
        }
        const currentPosition = path[path.length - 1];

        if (algorithm === Algorithm.BRUTEFORCE) {
            for (let i = 0; i < POSSIBLE_KNIGHT_MOVES.length; i++) {
                const possibleMove = POSSIBLE_KNIGHT_MOVES[i];
                const newX = currentPosition.x + possibleMove.x;
                const newY = currentPosition.y + possibleMove.y;

                const newPosition = { x: newX, y: newY };

                if (isValidMove(newPosition, board)) {
                    board[newPosition.x][newPosition.y] = path.length;
                    const result = await calculateNextMove(board, [...path, newPosition]);

                    if (result) {
                        return result;
                    } else {
                        board[newPosition.x][newPosition.y] = null;
                    }
                }
            }

            return null;
        } else if (algorithm === Algorithm.MOVE_ORDERING) {
            for (let i = 0; i < moveOrderArray.length; i++) {
                const currentMoveOrder = moveOrderArray[i];
                const possibleMove = POSSIBLE_KNIGHT_MOVES.find((move) => move.order === currentMoveOrder);
                if (!possibleMove) {
                    continue;
                }
                const newX = currentPosition.x + possibleMove.x;
                const newY = currentPosition.y + possibleMove.y;

                const newPosition = { x: newX, y: newY };

                if (isValidMove(newPosition, board)) {
                    board[newPosition.x][newPosition.y] = path.length;
                    const result = await calculateNextMove(board, [...path, newPosition]);

                    if (result) {
                        return result;
                    } else {
                        board[newPosition.x][newPosition.y] = null;
                    }
                }
            }
        } else if (algorithm === Algorithm.WARNSDORF) {
            // identify candidate moves
            let candidateMoves = [];

            for (let i = 0; i < POSSIBLE_KNIGHT_MOVES.length; i++) {
                const possibleMove = POSSIBLE_KNIGHT_MOVES[i];
                const newX = currentPosition.x + possibleMove.x;
                const newY = currentPosition.y + possibleMove.y;

                const newPosition = { x: newX, y: newY, move: possibleMove };

                if (isValidMove(newPosition, board)) {
                    const countOfValidMovesFromNewPosition = calculateNumberOfValidMoves(newPosition, board);
                    candidateMoves.push({ move: newPosition, count: countOfValidMovesFromNewPosition });
                }
            }

            if (candidateMoves.length !== 0) {
                // sort the moves by the number of valid moves
                candidateMoves.sort((a, b) => a.count - b.count);
                // tie breaking methods
                if (tieBreakMethod === TieBreakMethod.FIRST) {
                    // do nothing
                } else if (tieBreakMethod === TieBreakMethod.RANDOM) {
                    // identify the candidates with the same smallest number of valid moves
                    // and shuffle them randomly at the beginning of the array for lulz
                    const smallestCount = candidateMoves[0].count;
                    let movesWithSmallestCount = candidateMoves.filter((move) => move.count === smallestCount);
                    if (movesWithSmallestCount.length > 1) {
                        movesWithSmallestCount = movesWithSmallestCount.sort(() => Math.random() - 0.5);
                        candidateMoves = movesWithSmallestCount.concat(candidateMoves.filter((move) => move.count !== smallestCount));
                    }
                } else if (tieBreakMethod === TieBreakMethod.POHL) {
                    // Pohl's Tie-Breaking Rule - https://dl.acm.org/doi/pdf/10.1145/363427.363463
                    // we dive one level deeper and calculate the number of valid moves from the next move
                    // for each candidate move with the smallest number of valid moves
                    const smallestCount = candidateMoves[0].count;
                    let movesWithSmallestCount = candidateMoves.filter((move) => move.count === smallestCount);
                    if (movesWithSmallestCount.length > 1) {
                        for (let i = 0; i < movesWithSmallestCount.length; i++) {
                            const move = movesWithSmallestCount[i].move;
                            const countOfValidMovesFromNewPosition = calculateNumberOfValidMoves(move, board);
                            movesWithSmallestCount[i].count = countOfValidMovesFromNewPosition;
                        }
                        movesWithSmallestCount.sort((a, b) => {
                            let result = a.count - b.count;
                            // if the number of valid moves is equal, we randomize
                            if (result === 0) {
                                return Math.random() - 0.5;
                            } else {
                                return result;
                            }
                        });
                        candidateMoves = movesWithSmallestCount.concat(candidateMoves.filter((move) => move.count !== smallestCount));
                    }
                } else if (tieBreakMethod === TieBreakMethod.FURTHEST_FROM_CENTER || tieBreakMethod === TieBreakMethod.CLOSEST_TO_CENTER) {
                    // furthest - Roth rule - https://www.wolframcloud.com/objects/nbarch/2018/10/2018-10-10r6l3m/Knight.nb
                    // furthest or closest from the center
                    const smallestCount = candidateMoves[0].count;
                    let movesWithSmallestCount = candidateMoves.filter((move) => move.count === smallestCount);
                    if (movesWithSmallestCount.length > 1) {
                        movesWithSmallestCount = movesWithSmallestCount.sort((a, b) => {
                            // no need to square root for comparison
                            let distanceA = (a.move.x - center.x) ** 2 + (a.move.y - center.y) ** 2;
                            let distanceB = (b.move.x - center.x) ** 2 + (b.move.y - center.y) ** 2;

                            let result =
                                tieBreakMethod === TieBreakMethod.FURTHEST_FROM_CENTER
                                    ? distanceB - distanceA // For furthest from center, sort descending
                                    : distanceA - distanceB; // For closest to center, sort ascending

                            // if distance is equal, we randomize
                            if (result === 0) {
                                return Math.random() - 0.5;
                            } else {
                                return result;
                            }
                        });
                        candidateMoves = movesWithSmallestCount.concat(candidateMoves.filter((move) => move.count !== smallestCount));
                    }
                } else if (tieBreakMethod === TieBreakMethod.MOVE_ORDERING) {
                    // move ordering tie break
                    const smallestCount = candidateMoves[0].count;
                    let movesWithSmallestCount = candidateMoves.filter((move) => move.count === smallestCount);

                    if (movesWithSmallestCount.length > 1) {
                        movesWithSmallestCount = movesWithSmallestCount.sort((a, b) => {
                            let orderA = moveOrderArray.indexOf(a.move.move.order);
                            let orderB = moveOrderArray.indexOf(b.move.move.order);
                            return orderA - orderB;
                        });
                        candidateMoves = movesWithSmallestCount.concat(candidateMoves.filter((move) => move.count !== smallestCount));
                    }
                }
            }

            for (let i = 0; i < candidateMoves.length; i++) {
                const move = candidateMoves[i].move;

                board[move.x][move.y] = path.length;
                const result = await calculateNextMove(board, [...path, move]);

                if (result) {
                    return result;
                } else {
                    board[move.x][move.y] = null;
                }
            }

            return null;
        }

        return null;
    };

    let solution: { board: Board; path: Position[] } | null = null;
    for (let attempt = 0; attempt < attemptLimit; attempt++) {
        iterationCount = 0;
        solution = await calculateNextMove(board, path);
        if (solution) {
            break;
        }
        attemptCount++;
        console.log('Attempt:', attemptCount);
    }

    if (!solution) {
        console.log('No solution found');
    }
    return solution;
};
