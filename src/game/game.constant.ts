export const enum EVENT {
  CREATE_GAME = 'createGame',
  START_GAME = 'startGame',
  JOIN_GAME = 'joinGame',
  LEAVE_GAME = 'leaveGame',
  DESTROY_GAME = 'destroyGame',
  UPDATE_PLAYERLIST = 'updatePlayerList',
  UPDATE_GAME_PROGRESS = 'updateGameProgress',
  BUTTON_DOWN = 'buttonDown',
  BUTTON_UP = 'buttonUp',
  GAMEOVER = 'gameOver',
  MESSAGE = 'message',
}

export const enum MESSAGE {
  NOT_EXIST = 'Game does not exist',
  FULL = 'Game is full',
  DESTROYED = 'Game is destroyed',
}
