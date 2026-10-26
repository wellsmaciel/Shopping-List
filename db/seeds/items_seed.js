/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('items').del();
  await knex('items').insert([
    { name: 'Milk', unit: 'liters', quantity: 2 },
    { name: 'Bread', unit: 'pack', quantity: 1 },
    { name: 'Eggs', unit: 'box', quantity: 1 },
    { name: 'Rice', unit: 'kg', quantity: 2 },
    { name: 'Bananas', unit: 'units', quantity: 6 },
  ]);
};
