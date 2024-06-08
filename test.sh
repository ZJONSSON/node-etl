npm install
wait-for-it elasticsearch:9200
wait-for-it mongodb:27017
wait-for-it mysql:3306
wait-for-it postgres:5432
# cluster test needs to be run from master thread
node test/cluster-test.js | tap test --exclude=*cluster* jobs=5  --coverage-report=lcov --allow-incomplete-coverage