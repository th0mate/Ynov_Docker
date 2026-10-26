import { HttpError } from './errors.js';

export const TITLE_MAX_LENGTH = 200;

export function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Identifiant invalide');
  }
  return id;
}

function parseTitle(value) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Le titre doit être une chaîne de caractères');
  }
  const title = value.trim();
  if (title.length === 0) {
    throw new HttpError(400, 'Le titre ne peut pas être vide');
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw new HttpError(400, `Le titre ne doit pas dépasser ${TITLE_MAX_LENGTH} caractères`);
  }
  return title;
}

export function validateCreate(body) {
  return { title: parseTitle(body?.title) };
}

export function validateUpdate(body) {
  const changes = {};

  if (body?.title !== undefined) {
    changes.title = parseTitle(body.title);
  }
  if (body?.completed !== undefined) {
    if (typeof body.completed !== 'boolean') {
      throw new HttpError(400, 'Le champ « completed » doit être un booléen');
    }
    changes.completed = body.completed;
  }

  if (Object.keys(changes).length === 0) {
    throw new HttpError(400, 'Aucune modification fournie (title ou completed attendu)');
  }
  return changes;
}
