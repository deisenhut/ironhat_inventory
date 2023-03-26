// This file to contain all the Sequalize DB stuff
const { Sequelize, DataTypes } = require('sequelize');

let sequelize;
let inventory;

const initializeSequelize = (username, password) => {
    sequelize = new Sequelize('IronHat', username, password, {
        host: 'localhost',
        dialect: 'postgres',
        logging: false
    });

    // Keeping most items as Strings as that is how they are stored in the CVS file, avoiding conversions.
    // Existing items will have an item UUID and SKU.  New Items should be null due to unique contraint.
    // Lightspeed will assign a UUID and SKU to new items when the data is uploaded back to the server.
    // Item Names can be duplicated as they are then differentiated by optionName and optionValue.
    inventory = sequelize.define('Inventory', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        itemUUID: { // To only be set by Lightspeed, new items leave as null
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            defaultValue: null
        },
        itemName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        sku: { // To only be set by Lightspeed, new items leave as null
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            defaultValue: null
        },
        optionName: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        optionValue: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        discountable: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "true"
        },
        upc: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        taxable: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "true"
        },
        department: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "general"
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultVAlue: "general"
        },
        supplier: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        supplierCode: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        priceType: { // either 'open' or 'system'
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'system'
        },
        trackInventory: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'true'
        },
        registerStatus: { // either 'active' or 'inactive'
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'active'
        },
        price: { // While this is a currency value, we are not doing any computations with it.
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "0"
        },
        originalQty: { // generally an INTEGER, but may be "".  Will not change, so leave as STRING
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        updatedQty: { // This is the value we will be modifying, will start at zero
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        cost: { // While this is a number, we are not doing any computations with it and it may be "".
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        }
    }, {
        timestamps: false,
        freezeTableName: true, // Don't change it to Inventories
    });

    return sequelize.authenticate();
}

const closeSequelize = () => { return sequelize.close() };

// Creates table, blowing away any previous table.
const createTable = () => { return inventory.sync({ force: true })};

// Adds a row to the table
const addToTable = (
    itemUUID, itemName, sku, optionName, optionValue, discountable, upc, taxable, department,
    category, supplier, supplierCode, priceType, trackInventory, registerStatus, price,
    qty, cost
) => {
    values = {
        itemUUID, itemName, sku, optionName, optionValue, discountable, upc, taxable, department,
        category, supplier, supplierCode,  priceType, trackInventory, registerStatus, price,
        originalQty: qty, cost
    };

    return inventory.create(values);
};

// Returns List of Maps
const readTable = async () => {
    const items = await inventory.findAll({
        attributes: { exclude: ['id', 'originalQty'] }
    });
    return items.map((item) => {
        return item.dataValues;
    });
};

exports.initializeSequelize = initializeSequelize;
exports.closeSequelize = closeSequelize;
exports.createTable = createTable;
exports.addToTable = addToTable;
exports.readTable = readTable;