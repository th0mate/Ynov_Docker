export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: `Route introuvable : ${req.method} ${req.originalUrl}` });
}

// Express reconnaît un gestionnaire d'erreurs à ses 4 paramètres : `next` doit rester présent
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Le corps de la requête n’est pas un JSON valide' });
  }

  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
}
