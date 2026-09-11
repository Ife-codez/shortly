exports.up = (pgm) => {
  pgm.alterColumn('links', 'user_id', { notNull: false });
};

exports.down = (pgm) => {
  pgm.sql(`
    INSERT INTO users (id, email, password_hash)
    VALUES ('00000000-0000-0000-0000-000000000000', 'anonymous@system.local', 'unused')
    ON CONFLICT (id) DO NOTHING;
  `);

  pgm.sql(`
    UPDATE links
    SET user_id = '00000000-0000-0000-0000-000000000000'
    WHERE user_id IS NULL;
  `);

  pgm.alterColumn('links', 'user_id', { notNull: true });
};
