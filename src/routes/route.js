const express = require("express");
const router = express.Router();
const userController= require('../controller/userController')
const productController= require('../controller/productController')
const cartController= require('../controller/cartController')
const orderController = require('../controller/orderController')
const usermid = require('../middleware/userMiddleware')


//user api 
 router.post("/register",usermid.urlOfProfileImage, userController.createUser)
 router.post('/login' ,  userController.loginUser);
 router.get('/user/:userId/profile' ,usermid.authToken, userController.getUserProfileById);
router.put('/user/:userId/profile',usermid.authToken, usermid.urlOfProfileImageForUpdate, userController.updateUser);

//product api
router.post("/products", usermid.urlOfProfileImage, productController.createProduct)
router.put('/products/:productId' , usermid.urlOfProfileImageForUpdate, productController.updateProduct);
router.get('/products', productController.getProduct)
router.get('/products/:productId', productController.getProductById)
router.delete('/products/:productId', productController.deleteProduct)

//cart api
router.post("/users/:userId/cart", usermid.authToken,cartController.createCart)
router.get('/users/:userId/cart', usermid.authToken , cartController.getCart)
router.put('/users/:userId/cart',usermid.authToken,cartController.updateCart)
router.delete('/users/:userId/cart',usermid.authToken,cartController.deleteCart)

//order api
router.post('/users/:userId/orders',usermid.authToken, orderController.createOrder);
router.put('/users/:userId/orders',usermid.authToken, orderController.updateOrder);

module.exports = router;