import express from 'express';
import cors from 'cors';
import pkg from 'body-parser';
import { srchProduct, addProduct, updateProduct, delProduct, 
        srchQuantity, updateQuantity, srchProfit, srchInventory, updateInventory
        } from './api.js';

const { json, urlencoded } = pkg;
const port = process.env.port || 9998;
var app = express();

app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors({origin: '*'})); 

app.get('/api/srchProduct/', srchProduct);
app.post('/api/addProduct/', addProduct);
app.put('/api/updateProduct/', updateProduct);
app.delete('/api/delProduct/:id', delProduct);

app.get('/api/srchQuantity/', srchQuantity);
app.put('/api/updateQuantity/', updateQuantity);

app.get('/api/srchProfit/:dt', srchProfit);

app.get('/api/srchInventory/', srchInventory);
app.put('/api/updateInventory/', updateInventory);

app.listen(port, ()=> 
    console.log(`Listening on port ${port}`)
)