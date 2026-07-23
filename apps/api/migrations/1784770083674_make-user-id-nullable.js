exports.up = (pgm) => {
  pgm.alterColumn('links', 'user_id', { notNull: false });
};

exports.down = (pgm) => {
  pgm.alterColumn('links', 'user_id', { notNull: true });
};