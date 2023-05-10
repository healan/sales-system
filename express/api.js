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
    database:conf.database
});

connection.connect();
connection.on('error', function(err) {
    if(err){
        console.log(err.code);
        connection.connect();
    }
});

export function srchProduct(req, res){
    let sql = 'select row_number() over() as rowno, prod_cd, pur_price, sale_price from product;';
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
    let sql = 'insert into product (prod_cd, pur_price, sale_price ) values (?,?,?);';
    let prod_cd = req.body.code;
    let pur_price = req.body.purprice;
    let sale_price = req.body.saleprice;
    let params = [prod_cd, pur_price, sale_price];
    connection.query(sql, params,
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
    let sql = 'update product set '+ field +' = ? where prod_cd =?';
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
    let sql = 'delete from product where prod_cd=?';
    let projId = req.params.id;
    let params = [projId];
    connection.query(sql, params,
        (err) => {
            if(err)
                res.send(err);
            else
                res.send(200);
        });
};
