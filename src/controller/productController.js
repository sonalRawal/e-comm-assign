const productModel = require("../model/productModel")
const { isValid, validforEnum, isValidRequestBody, isValidObjectId, validString,validPrice } = require("../validator/validate")

//-----------------------------------------------------------------------------------------------------------------//
const createProduct = async function (req, res) {

    try {
        const requestBody = req.body;
        let { title, description, price, currencyId, currencyFormat, isFreeShipping , style, availableSizes, installments } = requestBody
        
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide product details' })
            return
        }
        if (!isValid(title)) {
            res.status(400).send({ status: false, message: 'title is required' })
            return
        }
        const isTitleAlreadyUsed = await productModel.findOne({ title: title });
        if (isTitleAlreadyUsed) {
            res.status(400).send({ status: false, message: `${title} title is already registered` });
            return;
        }
        if (!isValid(description)) {
            res.status(400).send({ status: false, message: `description is required` })
            return
        }
        if (!price) {
            res.status(400).send({ status: false, message: `price is required` })
            return
        }
        if (!validPrice(price)) {
            return res.status(400).send({ status: false, message: "provide valid price" })
        }
        if (!isValid(currencyId)) {
            res.status(400).send({ status: false, message: 'currencyId is required' })
            return
        }
        if (currencyId !== 'INR') {
            res.status(400).send({ status: false, message: 'provide valid currencyId' })
            return
        }
        if (!isValid(currencyFormat)) {
            res.status(400).send({ status: false, message: 'currencyFormat is required' })
            return
        }
        if (currencyFormat !== '₹') {
            res.status(400).send({ status: false, message: 'provide valid currencyFormat' })
            return
        }
        if(isFreeShipping){
         if(!(isFreeShipping==='true' ||isFreeShipping==='false')){
             res.status(400).send({ status: false, message: 'isFreeShipping type should be boolean' })
             return
         }
        }
        if(style){
            if(!validString(style)){
                res.status(400).send({ status: false, message: 'plz provide valid style' })
                return
            }
        }
        if (isValid(availableSizes)) {
            if (!validforEnum(availableSizes)) {
                res.status(400).send({ status: false, message: 'Please provide valid size exist in enum values' })
                return
            }
            requestBody.availableSizes = availableSizes.split(",")
        }
        requestBody.installments =  installments.trim()      
        if(isValid(installments)){
            if(isNaN(installments)){
                res.status(400).send({ status: false, message: 'plz provide valid installments type number' })
                return  
            }
        }
         
        requestBody.productImage = req.urlimage
        const productData = await productModel.create(requestBody)
        
        res.status(201).send({ status: true, msg: "successfully created", data: productData })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}
//-----------------------------------------------get products------------------------------------------------------------------//

const getProduct = async function (req, res) {
    try {
        const queryParams = req.query
        if (!isValidRequestBody(queryParams)) {
            return res.status(400).send({ status: false, message: 'Please provide products valid query details' })
        }
        let { size, name, price, priceSort } = req.query
        let query = { isDeleted: false };
        if (isValid(size)) {
            if (!validforEnum(size)) {
                return res.status(400).send({ status: false, message: ' Please provide valid size exist in enum values' })
            } else {
                query['availableSizes'] = size
            }
        }
        if (isValid(name)) {
            query['title'] = { $regex: name.trim() }
        }
        if (price) {
            price = JSON.parse(price)                                 //parse price bcoz postman query params gives as object inside string
            if (Object.keys(price).length == 1) {
                if (price.priceGreaterThan) {
                    if (typeof price.priceGreaterThan !== 'number') {
                        return res.status(400).send({ status: false, message: ' priceGreaterThan should be number' })
                    }
                    query['price'] = {'$gt':price.priceGreaterThan}
                }
                if (price.priceLessThan) {
                    if (typeof price.priceLessThan !== 'number') {
                        return res.status(400).send({ status: false, message: ' pricelessThan should be number' })
                    }
                    query['price'] = {'$lt':price.priceLessThan}
                }
            }
            if (Object.keys(price).length == 2) {
                if (price.priceGreaterThan && price.priceLessThan) {
                    if (typeof price.priceGreaterThan !== 'number') {
                        return res.status(400).send({ status: false, message: ' priceGreaterThan should be number' })
                    }
                    if (typeof price.priceLessThan !== 'number') {
                        return res.status(400).send({ status: false, message: ' pricelessThan should be number' })
                    }
                    query['price'] = { '$gt': price.priceGreaterThan, '$lt': price.priceLessThan }
                }
            }
        }
        if (priceSort) {
            if (!(priceSort == -1 || priceSort == 1)) {
                return res.status(400).send({ status: false, message: ' Please provide priceSort value 1 ||-1' })
            }
        }
        console.log(query)
        let productsOfQuery = await productModel.find(query).sort({ price: priceSort })
        if (Array.isArray(productsOfQuery) && productsOfQuery.length === 0) {
            return res.status(404).send({ status: false, message: 'No products found' })
        }
        return res.status(200).send({ status: true, message: 'product list', data: productsOfQuery })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
//-----------------------------------------------------------------------------------------------------------------------//

const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId
       
        if (!(isValid(productId) && isValidObjectId(productId))) {
            return res.status(400).send({ status: false, message: "productId is not valid" })
        }
        const product = await productModel.findOne({ _id: productId, isDeleted:false })
        if (!product) {
            res.status(404).send({ status: false, message: `product not found` })
            return
        }
          res.status(200).send({ status: true, message: "Product Details", data: product })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
//---------------------------------------------------------------------------------------------------------------------//
const updateProduct = async function (req, res) {
    try {
        let requestBody = req.body
        const productId = req.params.productId
        //atleast one value for update
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide  details to update' })
            return
        }
        if (!isValidObjectId(productId)) {
            return res.status(404).send({ status: false, message: "productId is not valid" })
        }
        //finding product exist or not
        const product = await productModel.findOne({ _id: productId, isDeleted: false, })
        if (!product) {
            res.status(404).send({ status: false, message: `product not found` })
            return
        }
        //filter
        let { title, description, price, currencyId, currencyFormat, style, availableSizes, installments } = requestBody
        const productImage = req.urlimage
        const filterQuery = {};
        if (isValid(title)) {
            const isTitleAlreadyUsed = await productModel.findOne({ title: title });
            if (isTitleAlreadyUsed) {
                res.status(400).send({ status: false, message: `${title} title is already registered`, });
                return;
            }
            filterQuery['title'] = title
        }
        if (isValid(description)) {
            filterQuery['description'] = description
        }
        if (price) {
            
            if (validPrice(price)) {
                filterQuery['price'] = price
            } else {
                return res.status(400).send({ status: false, message: "provide valid price type number" })
            }
        }
        if (isValid(currencyId)) {
            if (currencyId !== 'INR') {
                res.status(400).send({ status: false, message: 'provide valid currencyId' })
                return
            } filterQuery['currencyId'] = currencyId
        }
        if (isValid(currencyFormat)) {
            if (currencyFormat !== '₹') {
                res.status(400).send({ status: false, message: 'provide valid currencyFormat' })
                return
            } filterQuery['currencyFormat'] = currencyFormat
        }
        if (isValid(style)) {
            filterQuery['style'] = style
        }
        if (availableSizes) {
            if (!validforEnum(availableSizes)) {
                return res.status(400).send({ status: false, message: 'plz provide only valid availableSize atlist one' })
            }
            filterQuery['availableSizes'] = availableSizes
        }
        if (installments){
            if(isValid(installments)){
                if(isNaN(installments)){
                    res.status(400).send({ status: false, message: 'plz provide valid installments type number' })
                    return  
                }
                filterQuery['installments'] = installments
            }
        }
        if(isFreeShipping){
            if(!(isFreeShipping==='true' ||isFreeShipping==='false')){
                res.status(400).send({ status: false, message: 'isFreeShipping type should be boolean' })
                return
            }
            filterQuery['isFreeShipping'] = isFreeShipping
        }
        filterQuery.productImage = productImage;
        //updating details
        const updatedProductDetails = await productModel.findOneAndUpdate({ productId }, filterQuery, { new: true })
        return res.status(200).send({ status: true, message: "successfully updated product Details", data: updatedProductDetails })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
//----------------------------------------------------------------------------------------------------------------------//
const deleteProduct = async function(req,res){
    try{
        const productId = req.params.productId
        if (!(isValid(productId) && isValidObjectId(productId))) {
            return res.status(404).send({ status: false, message: "productId is not valid" })
        }
        const deletedProduct = await productModel.findOneAndUpdate({_id:productId,isDeleted:false},{isDeleted:true,deletedAt:new Date()},{new:true})
        if(deletedProduct){
        res.status(200).send({status:true,msg:"This book has been succesfully deleted"})
        return
    }
        res.status(404).send({ status: false, message: `product alredy deleted not found` })
    }catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createProduct, updateProduct, getProduct,getProductById,deleteProduct }