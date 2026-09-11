exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('links', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    slug: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    original_url: {
      type: 'text',
      notNull: true,
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
    },
    custom: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('links');
};