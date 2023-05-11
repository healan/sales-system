import * as fs from 'fs';
import 'date-utils';
const data = fs.readFileSync('./db.json');
const conf = JSON.parse(data);
import { createConnection } from 'mysql';
import mysql from 'mysql';

const connection = createConnection({
    host: conf.host,
    user: conf.user,
    password: conf.password,
    port: conf.port,
    database:conf.database,
    multipleStatements: true,
});

connection.connect();
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
    let prod_cd = req.body.code;
    let pur_price = req.body.purprice;
    let sale_price = req.body.saleprice;

    let params1 = [prod_cd, pur_price, sale_price];
    let sql1 = 'insert into product (prod_cd, pur_price, sale_price ) values (?,?,?);';

    let params2 = [prod_cd];
    let sql2 = 'insert into quantity (prod_cd) values (?);';

    let sql = mysql.format(sql1, params1) + mysql.format(sql2, params2);

    connection.query(sql,
        (err) => {
            if(err)
                res.send(err);
            else    
                res.send(200);
        });
};


export function updateProduct(req, res){
    let id = req.body.id;
    let field = req.body.field;
    let value = req.body.value;
    let sql = 'update product set '+ field +' = ? where prod_cd =?;';
    let params = [value, id];
    connection.query(sql, params,
        (err) => {
            if(err)
                res.send(err);
            else    
                res.send(200);
        });
};

export function delProduct(req, res){
    let projId = req.params.id;
    let params = [projId];
    let sql1 = 'delete from quantity where prod_cd=?;';
    let sql2 = 'delete from product where prod_cd=?;';
    let sql = mysql.format(sql1, params) + mysql.format(sql2, params);

    connection.query(sql,
        (err) => {
            if(err)
                res.send(err);
            else
                res.send(200);
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
    let i_field = req.body.field;
    let field = i_field.substr(4)
    let value = req.body.value;
    let sql = 'update quantity set '+ field +' = (select '+ field +' from quantity where prod_cd = ?) + ?, sale_date = CURDATE() where prod_cd = ?;';
    let params = [id, value, id];
    connection.query(sql, params,
        (err) => {
            if(err)
                res.send(err);
            else    
                res.send(200);
        });
};

export function srchProfit(req, res){
    let srch_dt = req.params.dt;
    let sql = 'select row_number() over() as rowno,p.prod_cd , sum(p.sale_price * q.sale_cnt) as sales_amt, sum((p.sale_price - p.pur_price)*q.sale_cnt) as margin_amt, DATE_FORMAT(q.sale_date, "%Y-%m") as dt'
            + ' from product p left join quantity q on p.prod_cd = q.prod_cd'
            + ' group by p.prod_cd , DATE_FORMAT(q.sale_date, "%Y-%m")'
            + ' having dt = ?'
            + ' order by rowno, p.prod_cd;';
            let params = [srch_dt];
    connection.query(sql, params,
        (err, rows) => {
            if(err)
                res.send(err);
            else
                res.send({
                    rows
                });
        });
};

