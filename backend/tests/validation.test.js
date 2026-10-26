import { describe, expect, it } from 'vitest';
import { HttpError } from '../src/errors.js';
import { parseId, TITLE_MAX_LENGTH, validateCreate, validateUpdate } from '../src/validation.js';

describe('parseId', () => {
  it('accepte un entier positif', () => {
    expect(parseId('42')).toBe(42);
  });

  it.each(['0', '-3', '1.5', 'abc', ''])('rejette « %s »', (raw) => {
    expect(() => parseId(raw)).toThrow(HttpError);
  });
});

describe('validateCreate', () => {
  it('nettoie les espaces autour du titre', () => {
    expect(validateCreate({ title: '  Réviser Docker  ' })).toEqual({ title: 'Réviser Docker' });
  });

  it('rejette un titre vide ou composé d’espaces', () => {
    expect(() => validateCreate({ title: '   ' })).toThrow('vide');
  });

  it('rejette un titre absent ou qui n’est pas une chaîne', () => {
    expect(() => validateCreate({})).toThrow('chaîne');
    expect(() => validateCreate(undefined)).toThrow('chaîne');
    expect(() => validateCreate({ title: 12 })).toThrow('chaîne');
  });

  it('rejette un titre trop long', () => {
    expect(() => validateCreate({ title: 'a'.repeat(TITLE_MAX_LENGTH + 1) })).toThrow('dépasser');
  });

  it('accepte un titre de longueur maximale', () => {
    const title = 'a'.repeat(TITLE_MAX_LENGTH);
    expect(validateCreate({ title })).toEqual({ title });
  });
});

describe('validateUpdate', () => {
  it('accepte une modification partielle', () => {
    expect(validateUpdate({ completed: true })).toEqual({ completed: true });
    expect(validateUpdate({ title: ' Nouveau ' })).toEqual({ title: 'Nouveau' });
  });

  it('ignore les champs inconnus', () => {
    expect(validateUpdate({ completed: false, id: 99 })).toEqual({ completed: false });
  });

  it('rejette un « completed » non booléen', () => {
    expect(() => validateUpdate({ completed: 'true' })).toThrow('booléen');
  });

  it('rejette une requête sans modification avec un statut 400', () => {
    expect(() => validateUpdate({})).toThrow(expect.objectContaining({ status: 400 }));
    expect(() => validateUpdate(null)).toThrow('Aucune modification');
  });
});
