const productModel = require("../model/productModel")
const userModel = require("../model/userModel")
const cartModel = require("../model/cartModel")
const { isValid, isValidRequestBody, isValidObjectId, validString } = require("../validator/validate")
const createCart = async function (req, res) {
    try {
        const tokenUserId = req.userId
        const userId = req.params.userId
        let { items, cartId } = req.body
        let increaseQuantity, index
        if (!isValidRequestBody(req.body)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide cart details' })
            return
        }
        if(items.length<1){
            res.status(400).send({ status: false, message:"items can't be empty"})
        }
        if(!(items[0].productId && items[0].quantity)){
            return res.status(404).send({ status: false, message: " items inValid" })
        }
        if(!(isValidObjectId(items[0].productId) && items[0].quantity >= 1)){
            return res.status(404).send({ status: false, message: "plz provide valid details" })
        }

        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        };

        const user = await userModel.findOne({ _id: userId })  //check for user existance
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        };
        if (!(userId.toString() == tokenUserId.toString())) {  //authorisation
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        };

        let isCartAlreadyCreated = await cartModel.findOne({ userId: userId });
        const productPrice = await productModel.findOne({ _id: items[0].productId })
        let price = productPrice.price * items[0].quantity

        //1 cond=> if already created but want to added more quantity of existing one
        if (isCartAlreadyCreated) {
            if (cartId) {              
            if(cartId != isCartAlreadyCreated._id){
               return res.status(400).send({status:false ,msg:"cart does not belong to this user"})
            }
        }
            for (let i = 0; i < isCartAlreadyCreated.items.length; i++) {
                if (items[0].productId == isCartAlreadyCreated.items[i].productId) {
                    increaseQuantity = isCartAlreadyCreated.items[i].quantity
                    index = i
                }
            }
        }
        if (increaseQuantity) {
            increaseQuantity = increaseQuantity + items[0].quantity
            let increasePrice = price + isCartAlreadyCreated.totalPrice

            isCartAlreadyCreated.items[index].quantity = increaseQuantity
            const detail = await cartModel.findOneAndUpdate({ userId: isCartAlreadyCreated.userId }, { items: isCartAlreadyCreated.items, totalPrice: increasePrice }, { new: true })
            return res.status(200).send({ status: true, msg: "successfully updated", data: detail })
        }

        //2 cond=> if already created and new product to be added
        if (isCartAlreadyCreated) {
            let newTotalPrice = isCartAlreadyCreated.totalPrice + price
            let newTotalItems = isCartAlreadyCreated.totalItems + 1
            const alreadyCreatedCart = await cartModel.findOneAndUpdate({ userId: isCartAlreadyCreated.userId }, { $addToSet: { items: { $each: items } }, totalPrice: newTotalPrice, totalItems: newTotalItems }, { new: true })
            return res.status(200).send({ status: true, msg: "successfully updated", data: alreadyCreatedCart })
        } else { //=3 cond=> newly created cart
            const cart = await cartModel.create({ userId: userId, items: items, totalPrice: price, totalItems: 1 })
           return res.status(201).send({ status: true, msg: "successfully created cart", data: cart })
        }

       
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}
const getCart = async function (req, res) {

    try {
        const userId = req.params.userId

        const tokenUserId = req.userId

        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        };

        const user = await userModel.findOne({ _id: userId })  //check for user existance

        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        };

        if (!(userId.toString() == tokenUserId.toString())) {  //authorisation
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        };

        const cartDetails = await cartModel.findOne({ userId: userId }); // check for cart existance

        if (cartDetails.totalPrice === 0 && cartDetails.totalItems === 0) {
            return res.status(200).send({ status: false, message: 'cart not exist' })
        };

        //for product details 
        const productList = cartDetails.items;

        const idsOfProduct = productList.map(product => product.productId)  // extracting productId

        if (idsOfProduct.length === 0) {
            res.status(404).send({ status: false, message: 'No Product found' })
            return
        };

        const productDetails = await productModel.find({ _id: { $in: idsOfProduct }, isDeleted: false }) //finding product details from product model
         responseData = cartDetails.toObject()
         
         responseData['productDetails'] = productDetails;  //making one more field for product details

        res.status(200).send({ status: true, message: 'Cart summary', data: responseData})//, productDetails}});


    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

};

const updateCart = async function (req, res) {
    try {
        const userId = req.params.userId
        const cartId = req.body.cartId
        const productId = req.body.productId
        const removeProduct = req.body.removeProduct
        const userIdFromToken = req.userId
        let cart = await cartModel.findById({ _id: cartId })
        if (!cart) {
            return res.status(400).send({ status: false, msg: "Cart not found" })
        }
        if (cart.totalPrice == 0 && cart.totalItems == 0) {
            return res.status(400).send({ status: false, msg: "Cart has been already deleted" })
        }
        let user = await userModel.findOne({ _id: userId, isDeleted: false })
        if (!user) {
            return res.status(400).send({ status: false, msg: "Invalid User" })
        }
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(400).send({ status: false, msg: "Product not found" })
        }
        if ((userId.toString() !== userIdFromToken.toString()) && (cart.userId.toString() !== userId.toString())) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }
        if (removeProduct === 0) {
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == productId) {
                    const productPrice = product.price * cart.items[i].quantity
                    const updatePrice = cart.totalPrice - productPrice
                     //cart.items = cart.items.splice(i, 1)
                     cart.items.splice(i, 1)
                     console.log("line 131",cart.items)
                    const updateItems = cart.totalItems - 1
                    const updateItemsAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice: updatePrice, totalItems: updateItems },{new:true})
                    return res.status(200).send({ status: true, msg: "Succesfully Updated in the cart", data: updateItemsAndPrice })
                }

            }
        } else {
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == productId) {
                    const updateQuantity = cart.items[i].quantity - removeProduct
                    if (updateQuantity < 1) {
                        const updateItems = cart.totalItems - 1
                        const productPrice = product.price * cart.items[i].quantity
                        const updatePrice = cart.totalPrice - productPrice
                         cart.items.splice(i, 1)
                        console.log("line 146",cart.items)
                        const updateItemsAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice: updatePrice, totalItems: updateItems },{new:true})
                        return res.status(200).send({ status: true, msg: "Product has been removed successfully from the cart", data: updateItemsAndPrice })
                    } else {
                        cart.items[i].quantity = updateQuantity
                        const updatedPrice = cart.totalPrice - (product.price * removeProduct)
                        const updatedQuantityAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items:cart.items,totalPrice: updatedPrice },{new:true})
                        return res.status(200).send({ status: true, msg: "Quantity has been updated successfully in the cart", data: updatedQuantityAndPrice })
                    }
                }
            }
        }

    } catch(error) {
        res.status(500).send({ status: false, msg: error.msg })
    }
}

// delete api 
const deleteCart = async function(req,res){
    try{
        const userId = req.params.userId
        const tokenUserId = req.userId
        if (!(isValid(userId) && isValidObjectId(userId))) {
            return res.status(404).send({ status: false, message: "userId is not valid" })
        }
        const userData = await userModel.findById({_id:userId})
        if(!userData){
            return res.status(404).send({ status: false, message: "user doesn't exist" })
        }
        if (!(userId.toString() == tokenUserId.toString())) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }
        const cartData = await cartModel.findOne({userId:userId})
        if(cartData.items.length===0){
            return res.status(404).send({ status: false, message: "cart for these user doesn't exist" })
        }

        const deletedCart = await cartModel.findOneAndUpdate({userId:userId},{items:[],totalPrice:0,totalItems:0},{new:true})
        if(deletedCart){
        res.status(200).send({status:true,msg:"This cart has been succesfully deleted",data:deletedCart})
        return
    }
        res.status(404).send({ status: false, message: `cart alredy deleted not found`})
    }catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = {createCart,deleteCart,updateCart,getCart}
