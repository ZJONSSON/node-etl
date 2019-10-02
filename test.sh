npm install
wait-for-it elasticsearch:9200
wait-for-it mongodb:27017
wait-for-it mysql:3306
wait-for-it postgres:5432
node node_modules/tap/bin/run.js test --jobs=5 -Rspec --coverage-report=html --no-browser