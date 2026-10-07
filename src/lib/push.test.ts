import { describe, expect, it } from 'vitest';
import { chatIdFromNotificationData } from './push';

describe('chatIdFromNotificationData', () => {
  it('lê o chatId do payload do push', () => {
    expect(chatIdFromNotificationData({ chatId: 'abc' })).toBe('abc');
  });

  it('devolve null para payload ausente, sem chatId ou com tipo errado', () => {
    expect(chatIdFromNotificationData(undefined)).toBeNull();
    expect(chatIdFromNotificationData(null)).toBeNull();
    expect(chatIdFromNotificationData({})).toBeNull();
    expect(chatIdFromNotificationData({ chatId: 42 })).toBeNull();
    expect(chatIdFromNotificationData({ chatId: '' })).toBeNull();
  });
});
