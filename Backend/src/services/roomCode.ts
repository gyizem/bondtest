import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamodb';

const ROOMS_TABLE = process.env.DYNAMODB_ROOMS_TABLE || 'rooms';

const generateCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createRoomCode = async (): Promise<string> => {
  let code: string;
  let exists = true;

  while (exists) {
    code = generateCode();
    const result = await docClient.send(new GetCommand({
      TableName: ROOMS_TABLE,
      Key: { roomCode: code },
    }));
    exists = !!result.Item;
  }

  return code!;
};
