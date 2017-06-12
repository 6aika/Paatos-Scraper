[![Coverage Status](https://coveralls.io/repos/github/6aika/Paatos-Scraper/badge.svg?branch=master)](https://coveralls.io/github/6aika/Paatos-Scraper?branch=master)
[![Build Status](https://travis-ci.org/6aika/Paatos-Scraper.svg?branch=master)](https://travis-ci.org/6aika/Paatos-Scraper)
# Paatos-Scraper
Scraper to scrape decision data from web pages and PDF documents in Finland. 

Project contains two applications: The main application (app.js) which can be used to extract decision data into importable format from various sources and the PDF-extracting utility which can be used to scrape decision data from a PDF-file.

## Usage (app.js)

### Options

    Paatos-Scraper

      Scraper to scrape decision data from web pages and PDF documents in Finland. 

    Options

      --source source                The source where to retrieve the date. Supported sources are: oulu,   
                                     vantaa, espoo                                                         
      --print-organizations          Print organizations and exit without extracting data                  
      --output-zip output zip file   The target zip-file where retrieved data will be stored               
      --organization-id              Organization id in source system format                               
      --max-events                   Limit number of events                                                
      --pdf-download-interval        Interval between downloading PDF-files in milliseconds. Defaults to   
                                     100ms                                                                 
      --html-download-interval       Interval between downloading HTML-pages in milliseconds. Defaults to  
                                     10ms                                                                  
      --events-after                 Extract only events after specified date. Date should be formatted in 
                                     following format: YYYY-MM-DD                                          
      --error-log                    Path to error log file. By default errors are written into console.   
      --help                         Print this usage guide. 
      
### Example
Please note that Node version should be at least 6. See [installation instructions](https://nodejs.org/en/download/package-manager/) for details.

Extracts latest event from Oulu's Kaupunginhallitus decision data

- `node app.js --source oulu --organization-id 690 --max-events=1 --output-zip=/tmp/output.zip`
      
## Usage (pdf.js)

### Options
      
    PDF Paatos-Scraper
    
      Utility to scrape decision data from PDF-files. 
    
    Options
    
      --source source     The source where to retrieve the date. Supported sources are: oulu, vantaa    
      --pdf-url pdf-url   The URL address of PDF file to be scraped. You can also use file:// -protocol 
                          to scrape local files (e.g. file:///some/file.pdf).                           
      --error-log         Path to error log file. By default errors are written into console.           
      --help              Print this usage guide.
      
### Example
Please note that Node version should be at least 6. See [installation instructions](https://nodejs.org/en/download/package-manager/) for details.

Extract decision data from a single PDF file from Vantaa    

- `node pdf --source vantaa --pdf-url file://test/data/vantaa/510975521.pdf --output-file /tmp/out.json`

### Installing dependencies

Before running the application you must install dependecies.

- `npm install`

## Running tests

Before running tests make sure that you have installed dependencies by running following command:

- `npm install`

Please note that you need to run this command after each time you pull new code

After that you can run tests by running:

- `npm test`
