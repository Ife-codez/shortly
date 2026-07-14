exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('click_events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    link_id: {
      type: 'uuid',
      notNull: true,
      references: 'links(id)',
      onDelete: 'CASCADE',
    },
    clicked_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    referrer: {
      type: 'text',
    },
    user_agent: {
      type: 'text',
    },
    ip_address: {
      type: 'inet',
    },
  });

  pgm.createIndex('click_events', 'link_id');
};

exports.down = (pgm) => {
  pgm.dropTable('click_events');
};