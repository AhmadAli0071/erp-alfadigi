import { Response } from 'express';
import { Notification } from '../models/Notification.js';

interface SSEClient {
  email: string;
  res: Response;
}

const clients = new Map<string, Set<SSEClient>>();
let clientSeq = 0;

export const addClient = (email: string, res: Response): (() => void) => {
  const id = `c_${++clientSeq}`;
  const client: SSEClient = { email, res };

  if (!clients.has(email)) clients.set(email, new Set());
  clients.get(email)!.add(client);

  // heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(':hb\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  return () => {
    clearInterval(heartbeat);
    clients.get(email)?.delete(client);
    if (clients.get(email)?.size === 0) clients.delete(email);
    void id;
  };
};

const pushToEmail = (email: string, event: string, payload: unknown): void => {
  const set = clients.get(email);
  if (!set) return;
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of set) {
    try {
      client.res.write(data);
    } catch {
      set.delete(client);
    }
  }
};

export interface CreateNotificationInput {
  userEmail: string;
  title: string;
  message?: string;
  type?: 'leave' | 'ticket' | 'attendance' | 'general';
  relatedId?: string;
}

export const createNotification = async (input: CreateNotificationInput): Promise<void> => {
  try {
    if (!input.userEmail) return;
    const notification = await Notification.create({
      userEmail: input.userEmail.toLowerCase(),
      title: input.title,
      message: input.message || '',
      type: input.type || 'general',
      relatedId: input.relatedId,
    });

    pushToEmail(input.userEmail.toLowerCase(), 'notification', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedId: notification.relatedId,
      isRead: false,
      createdAt: notification.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Create notification error:', err);
  }
};

export const notifyEmails = async (emails: (string | undefined | null)[], input: Omit<CreateNotificationInput, 'userEmail'>): Promise<void> => {
  const unique = Array.from(new Set(emails.filter((e): e is string => !!e).map((e) => e.toLowerCase())));
  await Promise.all(unique.map((email) => createNotification({ ...input, userEmail: email })));
};
