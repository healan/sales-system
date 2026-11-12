import * as fs from 'fs';
import 'date-utils';
const data = fs.readFileSync('./db.json');
const conf = JSON.parse(data);
import { createConnection } from 'mysql';

const connection = createConnection({
    host: conf.host,
    user: conf.user,
    password: conf.password,
    port: conf.port,
    database:conf.database,
    multipleStatements: true,
});

connection.connect();
connection.query(`CREATE TABLE IF NOT EXISTS sales_history (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    prod_cd VARCHAR(191) NOT NULL,
    sale_date DATE NOT NULL,
    sale_cnt INT NOT NULL,
    pur_price DECIMAL(15, 2) NOT NULL,
    sale_price DECIMAL(15, 2) NOT NULL,
    INDEX idx_sales_history_date (sale_date),
    INDEX idx_sales_history_product_date (prod_cd, sale_date)
)`, (err) => {
    if(err) console.error('Could not initialize sales_history table:', err.message);
});
connection.on('error', function(err) {
    if(err){
        console.log(err.code);
        connection.connect();
    }
});

export function srchProduct(req, res){
    let sql = 'select row_number() over() as rowno, prod_cd, pur_price, sale_price from product order by rowno, prod_cd;';
    connection.query(sql,
        (err, rows) => {
            if(err)
                res.send(err);
            else
                res.send({
                    rows
                });
        });
};

export function addProduct(req, res){
    const prod_cd = String(req.body.code || '').trim();
    const pur_price = Number(req.body.purprice);
    const sale_price = Number(req.body.saleprice);
    if(!prod_cd || !Number.isInteger(pur_price) || pur_price < 0 || !Number.isInteger(sale_price) || sale_price < 0){
        return res.status(400).send({ error: 'Invalid product code or price.' });
    }
    connection.beginTransaction((transactionError) => {
        if(transactionError) return res.status(500).send(transactionError);
        connection.query('insert into product (prod_cd, pur_price, sale_price) values (?, ?, ?);', [prod_cd, pur_price, sale_price], (productError) => {
            if(productError){
                return connection.rollback(() => res.status(productError.code === 'ER_DUP_ENTRY' ? 409 : 500).send(productError));
            }
            connection.query('insert into quantity (prod_cd) values (?);', [prod_cd], (quantityError) => {
                if(quantityError) return connection.rollback(() => res.status(500).send(quantityError));
                connection.query('insert into inventory (prod_cd) values (?);', [prod_cd], (inventoryError) => {
                    if(inventoryError) return connection.rollback(() => res.status(500).send(inventoryError));
                    connection.commit((commitError) => {
                        if(commitError) return connection.rollback(() => res.status(500).send(commitError));
                        res.sendStatus(200);
                    });
                });
            });
        });
    });
};


export function updateProduct(req, res){
    const id = String(req.body.id || '').trim();
    const field = ['pur_price', 'sale_price'].includes(req.body.field) ? req.body.field : null;
    const value = Number(req.body.value);
    if(!id || !field || !Number.isInteger(value) || value < 0){
        return res.status(400).send({ error: 'Invalid product price update.' });
    }
    const sql = 'update product set '+ field +' = ? where prod_cd = ?;';
    const params = [value, id];
    connection.query(sql, params,
        (err) => {
            if(err) res.status(500).send(err);
            else res.sendStatus(200);
        });
};

export function delProduct(req, res){
    const prodCd = req.params.id;
    connection.beginTransaction((transactionError) => {
        if(transactionError) return res.status(500).send(transactionError);
        connection.query('delete from quantity where prod_cd = ?;', [prodCd], (quantityError) => {
            if(quantityError) return connection.rollback(() => res.status(500).send(quantityError));
            connection.query('delete from inventory where prod_cd = ?;', [prodCd], (inventoryError) => {
                if(inventoryError) return connection.rollback(() => res.status(500).send(inventoryError));
                connection.query('delete from product where prod_cd = ?;', [prodCd], (productError, result) => {
                    if(productError) return connection.rollback(() => res.status(500).send(productError));
                    if(!result.affectedRows) return connection.rollback(() => res.status(404).send({ error: 'Product not found.' }));
                    connection.commit((commitError) => {
                        if(commitError) return connection.rollback(() => res.status(500).send(commitError));
                        res.sendStatus(200);
                    });
                });
            });
        });
    });
};

export function srchQuantity(req, res){
    let sql = 'select row_number() over() as rowno, p.prod_cd, p.pur_price, p.sale_price , q.sale_cnt'
            + ' from product p left join quantity q on p.prod_cd = q.prod_cd order by rowno, p.prod_cd;';
    connection.query(sql,
        (err, rows) => {
            if(err)
                res.send(err);
            else
                res.send({
                    rows
                });
        });
};

export function updateQuantity(req, res){
    let id = req.body.id;
    let field = req.body.field === 'cur_sale_cnt' ? 'sale_cnt' : null;
    let value = Number(req.body.value);
    if(!id || !field || !Number.isInteger(value) || value < 0){
        return res.status(400).send({ error: 'Invalid product or sales quantity.' });
    }
    connection.beginTransaction((transactionError) => {
        if(transactionError) return res.status(500).send(transactionError);
        connection.query('select pur_price, sale_price from product where prod_cd = ?;', [id], (productError, productRows) => {
            if(productError || !productRows.length){
                return connection.rollback(() => res.status(productError ? 500 : 404).send(productError || { error: 'Product not found.' }));
            }
            const product = productRows[0];
            const updateSql = 'update quantity set '+ field +' = COALESCE('+ field +', 0) + ?, sale_date = CURDATE() where prod_cd = ?;';
            connection.query(updateSql, [value, id], (updateError, updateResult) => {
                if(updateError || !updateResult.affectedRows){
                    return connection.rollback(() => res.status(updateError ? 500 : 404).send(updateError || { error: 'Quantity record not found.' }));
                }
                const historySql = 'insert into sales_history (prod_cd, sale_date, sale_cnt, pur_price, sale_price) values (?, CURDATE(), ?, ?, ?);';
                connection.query(historySql, [id, value, product.pur_price, product.sale_price], (historyError) => {
                    if(historyError) return connection.rollback(() => res.status(500).send(historyError));
                    connection.commit((commitError) => {
                        if(commitError) return connection.rollback(() => res.status(500).send(commitError));
                        res.sendStatus(200);
                    });
                });
            });
        });
    });
};

export function srchProfit(req, res){
    let srch_dt = req.params.dt;
    let sql = 'select row_number() over(order by h.prod_cd) as rowno, h.prod_cd, sum(h.sale_price * h.sale_cnt) as sales_amt, sum((h.sale_price - h.pur_price) * h.sale_cnt) as margin_amt'
            + ' from sales_history h where DATE_FORMAT(h.sale_date, "%Y-%m") = ?'
            + ' group by h.prod_cd order by h.prod_cd;';
    connection.query(sql, [srch_dt],
        (err, rows) => {
            if(err)
                res.status(500).send(err);
            else
                res.send({
                    rows
                });
        });
};

export function srchProfitDaily(req, res){
    const selectedMonth = req.params.dt;
    const sql = 'select DATE_FORMAT(h.sale_date, "%Y-%m-%d") as sale_date, sum(h.sale_price * h.sale_cnt) as sales_amt, sum((h.sale_price - h.pur_price) * h.sale_cnt) as margin_amt'
        + ' from sales_history h where DATE_FORMAT(h.sale_date, "%Y-%m") = ?'
        + ' group by h.sale_date order by h.sale_date;';
    connection.query(sql, [selectedMonth], (err, rows) => {
        if(err) res.status(500).send(err);
        else res.send({ rows });
    });
};

export function srchInventory(req, res){
    let sql = 'select row_number() over() as rowno, p.prod_cd, p.pur_price, p.sale_price , i.invt_cnt'
            + ' from product p left join inventory i on p.prod_cd = i.prod_cd order by rowno, p.prod_cd;';
    connection.query(sql,
        (err, rows) => {
            if(err)
                res.send(err);
            else
                res.send({
                    rows
                });
        });
};

export function updateInventory(req, res){
    const id = String(req.body.id || '').trim();
    const field = req.body.field === 'cur_invt_cnt' ? 'invt_cnt' : null;
    const value = Number(req.body.value);
    if(!id || !field || !Number.isInteger(value) || value < 0){
        return res.status(400).send({ error: 'Invalid product or inventory quantity.' });
    }
    const sql = 'update inventory set '+ field +' = COALESCE('+ field +', 0) + ? where prod_cd = ?;';
    connection.query(sql, [value, id],
        (err, result) => {
            if(err) res.status(500).send(err);
            else if(!result.affectedRows) res.status(404).send({ error: 'Inventory record not found.' });
            else res.sendStatus(200);
        });
};

