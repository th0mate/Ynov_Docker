// Alias en camelCase pour exposer directement les lignes à l'API
const COLUMNS = 'id, title, completed, created_at AS "createdAt", updated_at AS "updatedAt"';

export function createTodoRepository(pool) {
  return {
    async findAll() {
      const { rows } = await pool.query(
        `SELECT ${COLUMNS} FROM todos ORDER BY created_at DESC, id DESC`,
      );
      return rows;
    },

    async create({ title }) {
      const { rows } = await pool.query(
        `INSERT INTO todos (title) VALUES ($1) RETURNING ${COLUMNS}`,
        [title],
      );
      return rows[0];
    },

    // Les champs absents (null) conservent leur valeur actuelle grâce à COALESCE
    async update(id, { title, completed }) {
      const { rows } = await pool.query(
        `UPDATE todos
            SET title = COALESCE($2, title),
                completed = COALESCE($3, completed),
                updated_at = now()
          WHERE id = $1
      RETURNING ${COLUMNS}`,
        [id, title ?? null, completed ?? null],
      );
      return rows[0] ?? null;
    },

    async remove(id) {
      const { rowCount } = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
      return rowCount > 0;
    },

    async removeCompleted() {
      const { rowCount } = await pool.query('DELETE FROM todos WHERE completed = TRUE');
      return rowCount;
    },
  };
}
