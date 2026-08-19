import { createContext, useContext, useReducer, useCallback } from 'react';
import { GAME_PHASE } from '../utils/constants.js';

const GameContext = createContext(null);

const initialState = {
  phase:           GAME_PHASE.WAITING,
  room:            null,       // { id, code, shareUrl, topics, players, ... }
  currentQuestion: null,       // { index, total, question, options, topic, difficulty, timeLimitMs }
  myAnswer:        null,       // { selectedOption, isCorrect, points }
  reveal:          null,       // { correct, explanation, leaderboard }
  leaderboard:     [],
  totalQuestions:  0,
  questionTime:    30,
  chat:            [],
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, room: action.payload };
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'PLAYER_JOINED':
      return { ...state, room: { ...state.room, players: action.payload.players } };
    case 'PLAYER_LEFT':
      return { ...state, room: { ...state.room, players: action.payload.players } };
    case 'GAME_STARTING':
      return {
        ...state,
        phase:          GAME_PHASE.STARTING,
        totalQuestions: action.payload.totalQuestions,
        questionTime:   action.payload.questionTime,
        myAnswer:       null,
        reveal:         null,
        leaderboard:    [],
      };
    case 'NEW_QUESTION':
      return {
        ...state,
        phase:           GAME_PHASE.QUESTION,
        currentQuestion: action.payload,
        myAnswer:        null,
        reveal:          null,
      };
    case 'MY_ANSWER':
      return { ...state, myAnswer: action.payload };
    case 'REVEAL':
      return { ...state, phase: GAME_PHASE.REVEAL, reveal: action.payload };
    case 'SCORE_UPDATE':
      return { ...state, leaderboard: action.payload.leaderboard };
    case 'GAME_FINISHED':
      return { ...state, phase: GAME_PHASE.FINISHED, leaderboard: action.payload.leaderboard };
    case 'CHAT_MESSAGE':
      return { ...state, chat: [...state.chat.slice(-99), action.payload] }; // keep last 100
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <GameContext.Provider value={{ ...state, dispatch, reset }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
