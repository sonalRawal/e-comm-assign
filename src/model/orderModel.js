const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId
const orderSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: 'userp5', require: true, unique: true },
    items: [{
        _id: false,
        productId: { type: ObjectId, ref: 'productP5', require: true },
        quantity: { type: Number, require: true }
    }],
    totalPrice: { type: Number, require: true }, // comment: "Holds total price of all the items in the cart",
    totalItems: { type: Number, require: true }, //comment: "Holds total number of items in the cart"},
    totalQuantity: { type: Number, require: true },
    cancellable: { type: Boolean, default: true },
    status: { type: String, default: 'pending', enum:["pending", "completed", "cancled"] },
    deletedAt: { type: Date },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('order', orderSchema)