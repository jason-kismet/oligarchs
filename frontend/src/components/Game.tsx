import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';

interface GameProps {
  clientId: string;
}

const Game: React.FC<GameProps> = ({ clientId }) => {
  const ws = useRef<WebSocket | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8000/ws/${clientId}`);

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'game_created':
          setGameId(message.game_id);
          break;
        case 'game_started':
          setGameState('playing');
          break;
        // Handle other message types
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [clientId]);

  const createGame = () => {
    const newGameId = Math.random().toString(36).substring(7);
    ws.current?.send(JSON.stringify({
      type: 'create_game',
      game_id: newGameId
    }));
  };

  const joinGame = (gameIdToJoin: string) => {
    ws.current?.send(JSON.stringify({
      type: 'join_game',
      game_id: gameIdToJoin
    }));
  };

  return (
    <VStack spacing={4} p={4}>
      <Text>Client ID: {clientId}</Text>
      {!gameId ? (
        <Button onClick={createGame}>Create New Game</Button>
      ) : (
        <Text>Game ID: {gameId}</Text>
      )}
      {gameState === 'playing' && (
        <Box>
          <Text>Game is in progress!</Text>
          {/* Add game board and controls here */}
        </Box>
      )}
    </VStack>
  );
};

export default Game; 