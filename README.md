# ironhat_inventory
Iron Hat Inventory project

This application is for performing end-of-year inventory at a retail store which utilizes the Lightspeed Point-of-sale system (S Series).

While Lightspeed does not provide a public API to access your store's inventory data, you are able to export your inventory items as a CSV file from their web-based backend using the bulk manage feature.  Then you can update the data in the CSV file and upload the CSV file back to their backend to apply the changes.

The components in this project were created to aid with this process.  The data from the downloaded CSV file could be imported into a non-Lightspeed database and then a CRUD REST API server could be started up while you are performing the physical inventory.  Web applications can then utilize this API to provide a user interface to aid with the inventory activity, such as on a cellphone that you walk around with.  This includes scanning barcodes on products or searching for items by typing in part of the item's name.  The quantity counted can be incremented for each item.  Multiple users could perform the inventory counting simultaneously using their own devices.  Once completed, a new CSV file could be generated that includes the updated quantities and any new items that were missing and added.

## Components in this project

This project consists of three separate components.

### Import Export Tool

The administrator who downloaded the CSV file from the Lightspeed backend should run this command-line tool to create and populate the database table.  When all inventory activities are complete, this tool should be used again to export the database content back into a CSV.  Existing items (i.e. those with a UUID already) would need to be uploaded separately from any new items (i.e. those without a UUID).

This node.js application utilize the CSV and Sequelize libraries to connect to a PostgreSQL database on the localhost named 'IronHat'.  The db/db.js file can be updated to modify the Sequelize initialization to point to a different server/database.

Use the following to import a CSV file into the database (wipes existing data)
<code>node app.js -i -f [CSV File Name] -u [PostgreSQL User Name]</code>
Use the following to export inventory items from the database into a CSV file.
<code>node app.js -e -f [CSV File Name] -u [PostgreSQL User Name]</code>

Note that any changes made to the inventory items by using the point-of-sale system or the backend web-interface between the time the CSV file is downloaded and until it is uploaded back in will be lost.

### API Server

This is still under development

### Client interface

This is still under development
