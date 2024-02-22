const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

// Dummy data to store products
let merchantProducts = {};

app.use(bodyParser.json());

// Middleware to validate merchant ID
const validateMerchantId = (req, res, next) => {
    const merchantId = req.params.merchantId;
    if (!merchantProducts[merchantId]) {
        return res.status(404).json({ status: 'error', data: null, message: 'Merchant not found' });
    }
    next();
};

// Function to get current date and time
const getCurrentDateTime = () => {
    return new Date().toISOString();
};

// Display all products listed by a merchant
app.get("/products/:merchantId", validateMerchantId, (req, res) => {
    const merchantId = req.params.merchantId;
    res.json({ status: 'success', data: merchantProducts[merchantId], message: 'Products retrieved successfully' });
});

// Create a product for a merchant
app.post("/products/:merchantId", (req, res) => {
    const merchantId = req.params.merchantId;
    const { sku_id, name, description, price } = req.body;

    // Check if the required fields are present in the payload
    if (!sku_id || !name || !description || !price) {
        return res.status(400).json({ status: 'error', data: null, message: 'Required fields are missing' });
    }

    // Check if SKU ID already exists
    const isSkuExist = merchantProducts[merchantId]?.some(product => product.sku_id === sku_id.toString());
    if (isSkuExist) {
        return res.status(400).json({ status: 'error', data: null, message: 'SKU ID already exists' });
    }

	const product = {
		sku_id: sku_id.toString(),
		name,
		description,
		price,
		created_on: getCurrentDateTime()
	};
	if (merchantProducts[merchantId]) {
		merchantProducts[merchantId].push(product);
	} else {
		merchantProducts[merchantId] = [product];
	}

    res.status(201).json({ status: 'success', data: product, message: 'Product created successfully' });
});

// Edit an existing product
app.patch("/products/:merchantId/:sku_id", validateMerchantId, (req, res) => {
    const merchantId = req.params.merchantId;
    const sku_id = req.params.sku_id;
    const { name, description, price } = req.body;

    const productIndex = merchantProducts[merchantId]?.findIndex((prod) => prod.sku_id === sku_id.toString());
    if (productIndex !== -1) {
        const product = merchantProducts[merchantId][productIndex];
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        merchantProducts[merchantId][productIndex] = product;
        res.json({ status: 'success', data: product, message: 'Product updated successfully' });
    } else {
        res.status(404).json({ status: 'error', data: null, message: "Product not found" });
    }
});

// Delete an existing product
app.delete("/products/:merchantId/:sku_id", validateMerchantId, (req, res) => {
    const merchantId = req.params.merchantId;
    const sku_id = req.params.sku_id;

    const productIndex = merchantProducts[merchantId]?.findIndex((prod) => prod.sku_id === sku_id);
    if (productIndex !== -1) {
        merchantProducts[merchantId].splice(productIndex, 1);
        res.json({ status: 'success', message: "Product deleted successfully" });
    } else {
        res.status(404).json({ status: 'error', message: "Product not found" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at port:${port}`);
});
