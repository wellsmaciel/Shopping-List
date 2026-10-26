/**
 * Replaces the old shopping_list table with the items table.
 * Existing data is discarded (approved by the owner).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('shopping_list');
  await knex.schema.createTable('items', function (table) {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('unit').notNullable();
    table.integer('quantity').notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('items');
  await knex.schema.createTable('shopping_list', function (table) {
    table.increments('id').primary();
    table.string('item_name', 100).notNullable();
    table.string('unit_type').notNullable();
    table.integer('quantity').notNullable();
  });
};
