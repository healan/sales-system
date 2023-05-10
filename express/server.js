import express from 'express';
import cors from 'cors';
import pkg from 'body-parser';
import { srchProduct, addProduct, updateProduct, delProduct} from './api.js';

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

app.listen(port, ()=> 
    console.log(`Listening on port ${port}`)
)