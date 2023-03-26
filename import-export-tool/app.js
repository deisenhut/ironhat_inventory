// Import and Export inventory CSV file from LightSpeed (S-Series) into a database table

// Use the following to import a CSV file into the database (wipes existing data)
//   node app.js -i -f <CSV File Name> -u <PostgreSQL User Name> 
// Use the following to export inventory items from the database into a CSV file.
//   node app.js -e -f <CSV File Name> -u <PostgreSQL User Name>

const fs = require('fs');
const readline = require('readline');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);

const db = require('./db');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');

// Get the command line arguments
const args = process.argv.slice(2);

// Parse the command line arguments
let importFlag = false;
let exportFlag = false;
let csvFileName = '';
let userName = '';
let userPassword = '';
for (let i = 0; i < args.length; i++) {
    if (args[i] === '-i') {
        importFlag = true;
    } else if (args[i] === '-e') {
        exportFlag = true;
    } else if (args[i] === '-f') {
        csvFileName = args[i + 1];
    } else if (args[i] === '-u') {
        userName = args[i + 1];
    }
}
if (importFlag && exportFlag) {
    console.log('Error: Cannot import and export at the same time');
    process.exit(1);
}
if (!importFlag && !exportFlag) {
    console.log('Error: Must specify either import or export');
    process.exit(1);
}
if (csvFileName === '') {
    console.log('Error: Must specify a CSV file name');
    process.exit(1);
}
if (userName === '') {
    console.log('Error: Must specify a PostgreSQL user name');
    process.exit(1);
}

// Prompt user for their postgres password
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.stdoutMuted = true;
rl.question('Enter PostgreSQL password for user ' + userName + ': ', (answer) => {
    userPassword = answer;
    rl.close();
    console.log(""); // add blank line

    if (userPassword === '') {
        console.log('Error: Must specify a PostgreSQL password');
        process.exit(1);
    };

    // sequelize.authenticate().then(() => {
    db.initializeSequelize(userName, userPassword).then(async () => {
        console.log('Connection has been established successfully.');
        if (importFlag) {
            // Import the CSV file into the PostgreSQL database
            await importCsvFile(csvFileName);
            console.log("Import complete");
        } else {
            // Export the PostgreSQL database table into a CSV file
            await exportCsvFile(csvFileName);
            console.log("Export complete");
        };
        await db.closeSequelize();
    }).catch((error) => {
        console.error('Unable to connect to the database: ', error);
        process.exit(1);
    });
});

rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted)
        rl.output.write("*");
    else
        rl.output.write(stringToWrite);
};

// Define the CSV Header labels
const header = {
    itemUUID:      "Item UUID",
    itemName:      "Name",
    sku:           "SKU (Do Not Edit)",
    optionName:    "Option1 Name (Do Not Edit)",
    optionValue:   "Option1 Value (Do Not Edit)",
    discountable:  "Discountable",
    upc:           "UPC",
    taxable:       "Taxable",
    department:    "Department",
    category:      "Category",
    supplier:      "Supplier",
    supplierCode:  "Supplier Code",
    priceType:      "Price Type",
    trackInventory: "Track Inventory",
    registerStatus: "Register Status",
    price:          "Price",
    qty:            "Quantity",
    cost:           "Cost"
};

// Import the CSV file into the database
async function importCsvFile(csvFileName) {    
    console.log("Importing CSV file " + csvFileName + " into database");

    const records = [];
    const parser = parse({delimiter: ',', columns: true});

    parser.on('readable', () => {
        let record;
        while ((record = parser.read()) != null) {
            records.push(record);
        }
    });

    parser.on('error', err => {
        console.error(err.message);
    });

    parser.on('end', () => {
        console.log("Parsing complete, Number of records: " + records.length);
    });

    await pipelineAsync(
        fs.createReadStream(csvFileName),
        parser
    );

    // Write records to database
    await db.createTable();
    let promises = [];
    records.forEach(record => {
        promises.push(db.addToTable(
            itemUUID       = record[header.itemUUID],
            itemName       = record[header.itemName],
            sku            = record[header.sku],
            optionName     = record[header.optionName],
            optionValue    = record[header.optionValue],
            discountable   = record[header.discountable],
            upc            = record[header.upc],
            taxable        = record[header.taxable],
            department     = record[header.department],
            category       = record[header.category],
            supplier       = record[header.supplier],
            supplierCode   = record[header.supplierCode],
            priceType      = record[header.priceType],
            trackInventory = record[header.trackInventory],
            registerStatus = record[header.registerStatus],
            price          = record[header.price],
            qty            = record[header.qty],
            cost           = record[header.cost]
        ));
    });
    await Promise.all(promises);
};

// Export the PostgreSQL database table into a CSV file
async function exportCsvFile(csvFileName) {
    console.log("Exporting database table into CSV file " + csvFileName);

    // Read all contents from DB
    const data = await db.readTable();

    // Add the header row information
    data.unshift({
        itemUUID:       header.itemUUID,
        itemName:       header.itemName,
        sku:            header.sku,
        optionName:     header.optionName,
        optionValue:    header.optionValue,
        discountable:   header.discountable,
        upc:            header.upc,
        taxable:        header.taxable,
        department:     header.department,
        category:       header.category,
        supplier:       header.supplier,
        supplierCode:   header.supplierCode,
        priceType:      header.priceType,
        trackInventory: header.trackInventory,
        registerStatus: header.registerStatus,
        price:          header.price,
        updatedQty:     header.qty,
        cost:           header.cost
    });

    // Write data to CSV file
    const outputStream = fs.createWriteStream(csvFileName);

    stringify(data, (error, output) => {
        if (error) {
            console.error(`Error writing CSV output: ${error}`);
        } else {
            outputStream.write(output);
            outputStream.end();
        }
    });
};