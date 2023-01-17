import express from 'express';
import dotenv from 'dotenv';
import { ProductoDao } from './dao/ProductoDao.js';
import { CarritoDao } from './dao/CarritoDao.js'
import { ProductoCarritoDao } from './dao/ProductoCarritoDao.js';
import knex from 'knex';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));


const authMiddleware = ((req, res, next) => {
    req.header('authorization') == process.env.TOKEN 
        ? next()
        : res.status(401).json({"error": "unauthorized"})
})

const routerProducts = express.Router();
const routerCart = express.Router();

app.use('/api/productos', routerProducts);
app.use('/api/carrito', routerCart);

const productoDao = new ProductoDao();
const carritoDao = new CarritoDao();
const productoCarritoDao = new ProductoCarritoDao();

/* ------------------------ Product Endpoints ------------------------ */

// GET api/productos
routerProducts.get('/', async (req, res) => {
    const products = await productoDao.getAll();
    res.status(200).json(products);
})

// GET api/productos/:id
routerProducts.get('/:id', async (req, res) => {
    const { id } = req.params;
    const product = await productoDao.getProductById(id);
    
    product
        ? res.status(200).json(product)
        : res.status(400).json({"error": "producto no encontrado"})
})

// POST api/productos
routerProducts.post('/',authMiddleware, async (req,res,next) => {
    const {body} = req;
    
    body.timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const newProductId = await productoDao.save(body);
    
    newProductId
        ? res.status(200).json({"completo" : "producto agregado con el ID: "+newProductId})
        : res.status(400).json({"error": "clave inválida. porfavor verifique el contenido"})
})

// PUT api/productos/:id
routerProducts.put('/:id', authMiddleware,  async (req, res, next) => {
    const {id} = req.params;
    const {body} = req;
    const wasUpdated = await productoDao.updateProductById(body, id);
    
    wasUpdated
        ? res.status(200).json({"completo" : "product updated"})
        : res.status(404).json({"error": "producto no encontrado contenido inválido."})
})

// DELETE /api/productos/:id
routerProducts.delete('/:id', authMiddleware,  async (req, res, next) => {
    const {id} = req.params;
    const wasDeleted = await productoDao.deleteById(id);
    
    wasDeleted 
        ? res.status(200).json({"completo": "producto eliminado exitoxamente"})
        : res.status(404).json({"error": "producto no encontrado"})
})

/* ------------------------ Cart Endpoints ------------------------ */

// POST /api/carrito
routerCart.post('/', async(req, res) => {
    const newCartId = await carritoDao.save();
    
    newCartId
        ? res.status(200).json({"completo" : "carrito agregado con el ID: "+newCartId})
        : res.status(400).json({"error": "no se puede agregar, porfavor intente nuevamente más tarde"});
})

// DELETE /api/carrito/id
routerCart.delete('/:id', async (req, res) => {
    const {id} = req.params;
    const wasDeleted = await carritoDao.deleteById(id);
    
    wasDeleted 
        ? res.status(200).json({"completo": "carrito eliminado exitosamente"})
        : res.status(404).json({"error": "carrito no encontrado"})
})

/* ------------------------- <PRODUCTO> - <CARRITO> ------------------------- */

// POST /api/carrito/:id/productos

routerCart.post('/:id/productos', async(req,res) => {
    
    const {id} = req.params;
    const { body } = req;
    
    if (Object.prototype.hasOwnProperty.call(body, 'productId')) {
        const newProductoCarritoId = await productoCarritoDao.saveProductToCart(id, body.productId);
        
        newProductoCarritoId 
            ? res.status(200).json({"completo": "Producto agregado correctamente al carrito"})
            : res.status(400).json({"error": "Hay un problema. Quizas el id del carrito o el producto son inválidos"})
        
    } else {
        res.status(400).json({"error": "la clave debe ser 'productId', porfavor verifique."})
    }
    
})

// DELETE /api/carrito/:id/productos/:id_prod
routerCart.delete('/:id/productos/:id_prod', async(req, res) => {
    const {id, id_prod } = req.params;
    
    const wasDeleted = productoCarritoDao.deleteProductFromCart(id, id_prod);
    
    wasDeleted 
        ? res.status(200).json({"success": "producto eliminado del carrito"})
        : res.status(400).json({"error": "hay un problema"})
    
})

// GET /api/carrito/:id/productos
routerCart.get('/:id/productos', async(req, res) => {
    const { id } = req.params;
    const cartProducts = await productoCarritoDao.getAllProductsFromCart(id); 
    if (cartProducts.length) {
        res.status(200).json(cartProducts)
    } else {
        res.status(404).json({"error": "carrito no encontrado o producto inexistente."})
    }
})

const PORT = 1234;
const server = app.listen(PORT, () => {
console.log(` >>>>> 🚀 Servidor iniciado en http://localhost:${PORT}`)
})

server.on('error', (err) => console.log(err));