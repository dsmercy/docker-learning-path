// This script runs automatically when the MongoDB container starts for the first time.
// MongoDB executes all *.js files in /docker-entrypoint-initdb.d/ on init.
// It will NOT re-run on subsequent starts — data is persisted in the named volume.

db = db.getSiblingDB('products');

db.products.insertMany([
  { name: 'Wireless Headphones', price: 79.99, category: 'Electronics', createdAt: new Date(), updatedAt: new Date() },
  { name: 'Running Shoes',       price: 54.99, category: 'Footwear',    createdAt: new Date(), updatedAt: new Date() },
  { name: 'Coffee Maker',        price: 39.99, category: 'Kitchen',     createdAt: new Date(), updatedAt: new Date() },
  { name: 'Yoga Mat',            price: 24.99, category: 'Sports',      createdAt: new Date(), updatedAt: new Date() },
  { name: 'Desk Lamp',           price: 29.99, category: 'Home Office', createdAt: new Date(), updatedAt: new Date() },
]);

print('Seed complete — ' + db.products.countDocuments() + ' products inserted.');
