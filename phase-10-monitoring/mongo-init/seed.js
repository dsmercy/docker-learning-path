db = db.getSiblingDB('products');
db.products.insertMany([
  { name: 'Wireless Headphones', price: 79.99, category: 'Electronics', createdAt: new Date(), updatedAt: new Date() },
  { name: 'Running Shoes',       price: 54.99, category: 'Footwear',    createdAt: new Date(), updatedAt: new Date() },
  { name: 'Coffee Maker',        price: 39.99, category: 'Kitchen',     createdAt: new Date(), updatedAt: new Date() },
]);
print('Seeded ' + db.products.countDocuments() + ' products.');
