'no strict';
require('dotenv').config();

const path = require('path');
const { connectDatabaseMongo } = require(path.resolve(process.cwd(), 'server', 'dbtype'));

async function run() {
    await connectDatabaseMongo();
    require(path.resolve(process.cwd(), 'server'));
}

run();