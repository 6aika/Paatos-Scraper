# Paatos-Scraper
Scraper to scrape decision data from web pages and PDF documents in Finland

## Usage

### Options

    Paatos-Scraper

      Scraper to scrape decision data from web pages and PDF documents in Finland. 

    Options

      --source source                The source where to retrieve the date. Supported sources are: oulu 
      --output-zip output zip file   The target zip-file where retrieved data will be stored            
      --organization-id              Organization id in source system format                            
      --max-events                   Limit number of events                                             
      --help                         Print this usage guide. 

### Installing dependencies

Before running the application you must install dependecies.

- `npm install`

### Example

Extracts latest event from Oulu's Kaupunginhallitus decision data

- `node app.js --source oulu --organization-id 690 --max-events=1 --output-zip=/tmp/output.zip`

## Running tests

Before running tests make sure that you have installed dependencies by running following command:

- `npm install`

Please note that you need to run this command after each time you pull new code

After that you can run tests by running:

- `npm test`
