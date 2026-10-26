# Todo list : Vue, Express, PostgreSQL et Docker

Une liste de tâches en trois services Docker indépendants, chacun avec son propre Dockerfile.

```
navigateur ──► frontend (Nginx :80) ──/api──► backend (Express :3000) ──► db (PostgreSQL :5432)
```

| Service    | Technologie                    | Dockerfile               |
| ---------- | ------------------------------ | ------------------------ |
| `frontend` | Vue 3, TypeScript, Vite, Nginx | `frontend/Dockerfile`    |
| `backend`  | Node 22, Express 5, `pg`       | `backend/Dockerfile`     |
| `db`       | PostgreSQL 17                  | `database/Dockerfile`    |

Nginx sert l'application et relaie `/api` vers le backend. Le navigateur ne parle donc qu'à une seule origine, sans configuration CORS.

## Lancer le projet

```bash
cp .env.example .env        # facultatif : identifiants et port
docker compose up -d --build
```

L'application est disponible sur <http://localhost:8080>.

Les services démarrent dans l'ordre grâce aux healthchecks : le backend attend que PostgreSQL soit prêt, puis le frontend attend que l'API réponde.

```bash
docker compose ps              # état et santé des conteneurs
docker compose logs -f backend # logs d'un service
docker compose down            # arrêt (les données sont conservées)
docker compose down -v         # arrêt et suppression du volume de la base
```

Le script `database/init.sql` n'est exécuté qu'à la création du volume. Après une modification du schéma, lancez `docker compose down -v`.

## API

| Méthode  | Route                  | Description                           |
| -------- | ---------------------- | ------------------------------------- |
| `GET`    | `/api/health`          | État de l'API et de la base           |
| `GET`    | `/api/todos`           | Liste des tâches, les récentes d'abord |
| `POST`   | `/api/todos`           | Crée une tâche : `{ "title": "…" }`   |
| `PATCH`  | `/api/todos/:id`       | Modifie `title` et/ou `completed`     |
| `DELETE` | `/api/todos/:id`       | Supprime une tâche                    |
| `DELETE` | `/api/todos/completed` | Supprime toutes les tâches terminées  |

Les erreurs sont renvoyées au format `{ "error": "message" }` avec le code HTTP adapté (400, 404, 500).

## Tests et couverture

Les deux projets utilisent [Vitest](https://vitest.dev). La couverture est mesurée avec V8, et un seuil minimal fait échouer la commande s'il n'est pas atteint.

```bash
cd backend && npm install && npm run coverage
cd frontend && npm install && npm run coverage
```

Le rapport HTML est généré dans `coverage/index.html`.

- **Backend** : validation des entrées, repository (avec un pool PostgreSQL simulé) et routes HTTP via Supertest. L'application reçoit ses dépendances (`createApp({ todoRepository, checkDatabase })`), ce qui permet de la tester avec un repository en mémoire, sans base de données.
- **Frontend** : client HTTP (avec `fetch` simulé), composable `useTodos` (dont les retours arrière après une erreur de l'API) et composants avec Vue Test Utils.

Les tests peuvent aussi tourner dans Docker, grâce à l'étape `test` des Dockerfiles :

```bash
docker build --target test ./backend
docker build --target test ./frontend
```

## Déploiement gratuit sur Render

Le fichier `render.yaml` décrit l'API et le frontend, construits depuis leurs Dockerfiles, ainsi que la base PostgreSQL gérée par Render.

1. Sur [render.com](https://render.com), choisir **New → Blueprint** puis sélectionner ce dépôt.
2. Render demande une valeur pour `BACKEND_URL`. L'adresse de l'API n'existe pas encore : saisir `https://todo-api.onrender.com` provisoirement.
3. Une fois `todo-api` déployée, copier son URL réelle (en haut de sa page) dans **todo-front → Environment → `BACKEND_URL`**. Le frontend redémarre tout seul.

Adaptations faites pour l'hébergement :

- Le backend accepte une `DATABASE_URL` et crée la table au démarrage, car une base hébergée n'exécute pas `init.sql`.
- Nginx lit son port (`PORT`) et l'adresse de l'API (`BACKEND_URL`) dans l'environnement. Les valeurs par défaut conviennent à `docker compose`.

Limites de l'offre gratuite :

- Un service se met en veille après 15 min sans visite, et le premier chargement suivant prend environ une minute.
- La base gratuite expire après 30 jours. Pour un hébergement durable, créer une base gratuite sur [Neon](https://neon.tech) et mettre son URL dans la variable `DATABASE_URL` de `todo-api`.

## Développement sans Docker

```bash
docker compose up -d db                         # seulement la base
cd backend && npm run dev                       # API sur :3000
cd frontend && npm run dev                      # Vite sur :5173, relaie /api vers :3000
```

En local, le backend lit `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` et `DB_NAME` (par défaut `localhost:5432`, `todo`/`todo`). Pour qu'il atteigne la base, exposez le port 5432 en ajoutant `ports: ["5432:5432"]` au service `db`.

## Structure

```
backend/
  src/
    app.js                         application Express (dépendances injectées)
    server.js                      point d'entrée, arrêt propre sur SIGTERM
    validation.js, errors.js
    routes/todos.js
    repositories/todoRepository.js requêtes SQL paramétrées
  tests/
frontend/
  src/
    api/todos.ts                   client HTTP typé
    composables/useTodos.ts        état et mises à jour optimistes
    components/                    TodoComposer, TodoItem, TodoFilters
    App.vue, style.css
  tests/
  nginx.conf.template            config Nginx (port et URL de l'API injectés au démarrage)
database/
  init.sql
docker-compose.yml
render.yaml                      déploiement Render (Blueprint)
.github/workflows/ci.yml         tests et build Docker à chaque push
```

## Utilisation

- Entrée ajoute une tâche.
- Un double-clic sur une tâche (ou l'icône crayon) permet de la renommer : Entrée valide, Échap annule.
- Le titre de la page indique combien de tâches il reste.
