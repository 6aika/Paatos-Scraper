# Shell script to scrape all decision data from given source, e.g.
# ./scrape-all.sh oulu /site/paatos-oulu.6aika.fi/www/static/exports/

#SOURCE_CITY="oulu"
#OUTPUT_DIRECTORY="/site/paatos-oulu.6aika.fi/www/static/exports/"
#MAX_EVENTS="--max-events=1"

usage() {
    echo "Usage: $0 (oulu|vantaa|tampere|espoo) directoryname [max events]"
    exit 1
}

SOURCE_CITY="$1"
OUTPUT_DIRECTORY="$2"

shopt -s extglob
if [[ "${SOURCE_CITY}" == @(oulu|vantaa|tampere|espoo) ]]; then
    echo Source is valid, scraping ${SOURCE_CITY}
else
    echo ERROR: Source \"${SOURCE_CITY}\" is not valid.
    usage
fi

if [ ! -d "${OUTPUT_DIRECTORY}" ] && [ ! -x "${OUTPUT_DIRECTORY}" ]; then
    echo ERROR: Non existing or non writable output directory
    usage
else
    echo Output directory will be ${OUTPUT_DIRECTORY}
fi;


if [ -z "$3" ];
then
    MAX_EVENTS="--max-events=$3"
fi;

re='^[0-9\.]+$'

node app.js --source ${SOURCE_CITY} --print-organizations | while read -r org;
do 
    # Split line by ' - ' and read parts to variables
    IFS=' - ' read orgid name <<< "$org"
    # Replace annoying characters in filenames
    name=${name// /_}  # inline shell string replacement
    name=${name//[åä]/a}
    name=${name//ö/o}
    name=${name//[!0-9a-zA-Z]/-}
    echo "var1=$orgid, var2=$name"
    if [[ $orgid =~ $re ]] ; then
        node app.js --source ${SOURCE_CITY} --organization-id $orgid ${MAX_EVENTS} --output-zip=${OUTPUT_DIRECTORY}${name}-$(date -I).zip
    else
        echo "Error: orgid=$orgid is not a number"
    fi
done

