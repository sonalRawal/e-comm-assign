const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")
const orderModel = require("../model/orderModel")
const userModel = require("../model/userModel")

const { isValid, validforEnum, isValidRequestBody, isValidObjectId, validString, validforStatus } = require('../Validator/validate')

const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const tokenUserId = req.userId

        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        }
        const user = await userModel.findOne({ _id: userId })
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        }
        if (!(userId.toString() == tokenUserId.toString())) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }

        if(!isValidRequestBody(req.body)){
            res.status(400).send({ status: false, message: `Request body should not be empty` })
            return
        }
        let { items,totalItems,totalPrice, cancellable, status } = req.body
        let quantityCollection = [];
        if(status){
        if(!validforStatus(status)){
            return res.status(400).send({ status: false, msg:"please provide correct status" })
        }
    }
    if (cancellable == false && status == "cancled") {
        return res.status(400).send({ status: false, msg: "You can not cancle Non-cancellable order" })
    }
        for (let product of items) {
            quantityCollection.push(product.quantity)
        }
        let totalQuantity = quantityCollection.reduce(function (a, b) {
            return a + b;
        }, 0)

        const orderDetails = {
            userId: userId,
            items: items,
            totalPrice: totalPrice,
            totalItems: totalItems,
            totalQuantity: totalQuantity,
            cancellable: cancellable,
            status: status
        }

        const order = await orderModel.create(orderDetails)
        return res.status(201).send({ status: true, msg: "successfully created order", data: order })

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const tokenUserId = req.userId

        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        }
        const user = await userModel.findOne({ _id: userId })
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        }
        if (!(userId.toString() == tokenUserId.toString())) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }

        const { status, orderId } = req.body
        if(!isValidRequestBody(req.body)){
            res.status(400).send({ status: false, message: `Request body should not be empty` })
            return
        }
        const order = await orderModel.findOne({ _id: orderId })
        if(!order){
            res.status(404).send({ status: false, message: `order not found` })
            return
        }
        // status key can not be changed after cancled or completed
        if(!(order.status =="pending")){
            res.status(404).send({ status: false, message: "can't change status of alredy completed or cancled order" })
            return
        } 
        if(!validforStatus(status)){
            return  res.status(400).send({ status: false, msg:"please provide correct status" })
        }
        if (order.cancellable == false && status == "cancled") {
            return res.status(400).send({ status: false, msg: "You can not cancle Non-cancellable order" })
        }

        const updatedoRder = await orderModel.findOneAndUpdate({ _id: orderId }, { status }, { new: true, runValidators:true }) //use to validate enum if you do not use validations
        return res.status(200).send({ status: true, msg:"Order sucessfuly updated", data: updatedoRder })
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports.createOrder = createOrder
module.exports.updateOrder = updateOrder
