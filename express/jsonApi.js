import fs from 'node:fs/promises';
import path from 'node:path';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dataDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
let mutationQueue = Promise.resolve();

async function readTable(table) {
  const contents = await fs.readFile(path.join(dataDirectory, `${table}.json`), 'utf8');
  const rows = JSON.parse(contents);
  if (!Array.isArray(rows)) throw new Error(`Invalid JSON table: ${table}`);
  return rows;
}

async function writeTable(table, rows) {
  const filePath = path.join(dataDirectory, `${table}.json`);
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, filePath);
}

function mutate(action) {
  const result = mutationQueue.then(action);
  mutationQueue = result.catch(() => {});
  return result;
}

function sendError(res, error, fallbackMessage) {
  const status = error.status || 500;
  res.status(status).send({ error: status === 500 ? fallbackMessage : error.message });
}

function validWholeNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function localDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function login(req, res) {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) return res.status(400).send({ error: 'Enter your username and password.' });

    const users = await readTable('users');
    const user = users.find((row) => row.username === username);
    if (!user) return res.status(401).send({ error: 'Invalid username or password.' });

    const suppliedHash = scryptSync(password, user.salt, 64);
    const storedHash = Buffer.from(user.password_hash, 'hex');
    if (storedHash.length !== suppliedHash.length || !timingSafeEqual(suppliedHash, storedHash)) {
      return res.status(401).send({ error: 'Invalid username or password.' });
    }
    res.send({ authenticated: true, username: user.username });
  } catch (error) {
    sendError(res, error, 'Could not verify login credentials.');
  }
}

export async function srchProduct(req, res) {
  try {
    const products = await readTable('product');
    res.send({ rows: products.map((row, index) => ({ rowno: index + 1, ...row })) });
  } catch (error) {
    sendError(res, error, 'Could not read product data.');
  }
}

export async function addProduct(req, res) {
  try {
    await mutate(async () => {
      const code = String(req.body.code || '').trim();
      const purchasePrice = validWholeNumber(req.body.purprice);
      const salePrice = validWholeNumber(req.body.saleprice);
      if (!code || purchasePrice === null || salePrice === null) throw fail(400, 'Enter a product code and valid whole-number prices.');

      const [products, quantities, inventory] = await Promise.all([
        readTable('product'), readTable('quantity'), readTable('inventory'),
      ]);
      if (products.some((row) => String(row.prod_cd).toLowerCase() === code.toLowerCase())) throw fail(409, 'Product code already exists.');

      products.push({ prod_cd: code, pur_price: purchasePrice, sale_price: salePrice });
      quantities.push({ prod_cd: code, sale_cnt: 0, sale_date: null });
      inventory.push({ prod_cd: code, invt_cnt: 0 });
      await writeTable('product', products);
      await writeTable('quantity', quantities);
      await writeTable('inventory', inventory);
    });
    res.sendStatus(200);
  } catch (error) {
    sendError(res, error, 'Could not add product data.');
  }
}

export async function updateProduct(req, res) {
  try {
    await mutate(async () => {
      const code = String(req.body.id || '').trim();
      const field = ['pur_price', 'sale_price'].includes(req.body.field) ? req.body.field : null;
      const value = validWholeNumber(req.body.value);
      if (!code || !field || value === null) throw fail(400, 'Enter a valid product code and price.');

      const products = await readTable('product');
      const product = products.find((row) => row.prod_cd === code);
      if (!product) throw fail(404, 'Product not found.');
      product[field] = value;
      await writeTable('product', products);
    });
    res.sendStatus(200);
  } catch (error) {
    sendError(res, error, 'Could not update product data.');
  }
}

export async function delProduct(req, res) {
  try {
    await mutate(async () => {
      const code = req.params.id;
      const [products, quantities, inventory] = await Promise.all([
        readTable('product'), readTable('quantity'), readTable('inventory'),
      ]);
      if (!products.some((row) => row.prod_cd === code)) throw fail(404, 'Product not found.');
      await writeTable('product', products.filter((row) => row.prod_cd !== code));
      await writeTable('quantity', quantities.filter((row) => row.prod_cd !== code));
      await writeTable('inventory', inventory.filter((row) => row.prod_cd !== code));
      // Keep sales_history so reports retain sales for deleted products.
    });
    res.sendStatus(200);
  } catch (error) {
    sendError(res, error, 'Could not delete product data.');
  }
}

export async function srchQuantity(req, res) {
  try {
    const [products, quantities] = await Promise.all([readTable('product'), readTable('quantity')]);
    const quantityByCode = new Map(quantities.map((row) => [row.prod_cd, row]));
    const rows = products.map((product, index) => {
      const quantity = quantityByCode.get(product.prod_cd) || {};
      return {
        rowno: index + 1,
        prod_cd: product.prod_cd,
        pur_price: product.pur_price,
        sale_price: product.sale_price,
        sale_cnt: quantity.sale_cnt || 0,
        sale_date: quantity.sale_date || null,
      };
    });
    res.send({ rows });
  } catch (error) {
    sendError(res, error, 'Could not read sales quantity data.');
  }
}

export async function updateQuantity(req, res) {
  try {
    await mutate(async () => {
      const code = String(req.body.id || '').trim();
      const value = req.body.field === 'cur_sale_cnt' ? validWholeNumber(req.body.value) : null;
      if (!code || value === null) throw fail(400, 'Enter a valid product and sales quantity.');

      const [products, quantities, history] = await Promise.all([
        readTable('product'), readTable('quantity'), readTable('sales_history'),
      ]);
      const product = products.find((row) => row.prod_cd === code);
      const quantity = quantities.find((row) => row.prod_cd === code);
      if (!product || !quantity) throw fail(404, 'Product or quantity record not found.');

      const date = localDate();
      quantity.sale_cnt = (Number(quantity.sale_cnt) || 0) + value;
      quantity.sale_date = date;
      if (value > 0) {
        const nextId = history.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
        history.push({
          id: nextId,
          prod_cd: code,
          sale_date: date,
          sale_cnt: value,
          pur_price: Number(product.pur_price) || 0,
          sale_price: Number(product.sale_price) || 0,
        });
      }
      await writeTable('quantity', quantities);
      if (value > 0) await writeTable('sales_history', history);
    });
    res.sendStatus(200);
  } catch (error) {
    sendError(res, error, 'Could not update sales quantity.');
  }
}

export async function srchProfit(req, res) {
  try {
    const month = req.params.dt;
    if (!/^\d{4}-\d{2}$/.test(month)) throw fail(400, 'Month must use YYYY-MM format.');
    const history = await readTable('sales_history');
    const totals = new Map();
    history.filter((row) => String(row.sale_date).startsWith(month)).forEach((row) => {
      const total = totals.get(row.prod_cd) || { prod_cd: row.prod_cd, sales_amt: 0, margin_amt: 0 };
      const count = Number(row.sale_cnt) || 0;
      const purchasePrice = Number(row.pur_price) || 0;
      const salePrice = Number(row.sale_price) || 0;
      total.sales_amt += salePrice * count;
      total.margin_amt += (salePrice - purchasePrice) * count;
      totals.set(row.prod_cd, total);
    });
    const rows = [...totals.values()].sort((a, b) => a.prod_cd.localeCompare(b.prod_cd)).map((row, index) => ({ rowno: index + 1, ...row }));
    res.send({ rows });
  } catch (error) {
    sendError(res, error, 'Could not read profit data.');
  }
}

export async function srchProfitDaily(req, res) {
  try {
    const month = req.params.dt;
    if (!/^\d{4}-\d{2}$/.test(month)) throw fail(400, 'Month must use YYYY-MM format.');
    const history = await readTable('sales_history');
    const totals = new Map();
    history.filter((row) => String(row.sale_date).startsWith(month)).forEach((row) => {
      const date = String(row.sale_date).slice(0, 10);
      const total = totals.get(date) || { sale_date: date, sales_amt: 0, margin_amt: 0 };
      const count = Number(row.sale_cnt) || 0;
      const purchasePrice = Number(row.pur_price) || 0;
      const salePrice = Number(row.sale_price) || 0;
      total.sales_amt += salePrice * count;
      total.margin_amt += (salePrice - purchasePrice) * count;
      totals.set(date, total);
    });
    res.send({ rows: [...totals.values()].sort((a, b) => a.sale_date.localeCompare(b.sale_date)) });
  } catch (error) {
    sendError(res, error, 'Could not read daily profit data.');
  }
}

export async function srchInventory(req, res) {
  try {
    const [products, inventory] = await Promise.all([readTable('product'), readTable('inventory')]);
    const inventoryByCode = new Map(inventory.map((row) => [row.prod_cd, row]));
    const rows = products.map((product, index) => ({
      rowno: index + 1,
      prod_cd: product.prod_cd,
      pur_price: product.pur_price,
      sale_price: product.sale_price,
      invt_cnt: inventoryByCode.get(product.prod_cd)?.invt_cnt || 0,
    }));
    res.send({ rows });
  } catch (error) {
    sendError(res, error, 'Could not read inventory data.');
  }
}

export async function updateInventory(req, res) {
  try {
    await mutate(async () => {
      const code = String(req.body.id || '').trim();
      const value = req.body.field === 'cur_invt_cnt' ? validWholeNumber(req.body.value) : null;
      if (!code || value === null) throw fail(400, 'Enter a valid product and incoming quantity.');
      const inventory = await readTable('inventory');
      const item = inventory.find((row) => row.prod_cd === code);
      if (!item) throw fail(404, 'Inventory record not found.');
      item.invt_cnt = (Number(item.invt_cnt) || 0) + value;
      await writeTable('inventory', inventory);
    });
    res.sendStatus(200);
  } catch (error) {
    sendError(res, error, 'Could not update inventory data.');
  }
}
