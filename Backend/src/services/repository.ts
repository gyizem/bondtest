import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamodb';

const ROOMS_TABLE = process.env.DYNAMODB_ROOMS_TABLE || 'rooms';
const ANSWERS_TABLE = process.env.DYNAMODB_ANSWERS_TABLE || 'answers';

export const getRoom = async (roomCode: string) => {
  const result = await docClient.send(new GetCommand({
    TableName: ROOMS_TABLE,
    Key: { roomCode },
  }));
  return result.Item;
};

export const createRoom = async (item: Record<string, unknown>) => {
  await docClient.send(new PutCommand({
    TableName: ROOMS_TABLE,
    Item: item,
  }));
};

export const saveAnswers = async (item: Record<string, unknown>) => {
  await docClient.send(new PutCommand({
    TableName: ANSWERS_TABLE,
    Item: item,
  }));
};

export const getAnswers = async (roomCode: string) => {
  const result = await docClient.send(new QueryCommand({
    TableName: ANSWERS_TABLE,
    KeyConditionExpression: 'roomCode = :roomCode',
    ExpressionAttributeValues: { ':roomCode': roomCode },
  }));
  return result.Items || [];
};
