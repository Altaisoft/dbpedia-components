var query = `
PREFIX : <http://www.ontotext.com/plugins/geosparql#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dbr: <http://dbpedia.org/resource/>
PREFIX schema: <http://schema.org/>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbc: <http://dbpedia.org/resource/Category:>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>

select ?resource ?label ?date ?link where {
    ?resource dct:subject dbc:Battles_of_World_War_I_involving_Belgium .
    ?resource rdfs:label ?label .
    ?resource dbo:date ?date .
    ?resource prov:wasDerivedFrom ?link .
    
    FILTER (lang(?label) = 'en') .
} ORDER BY ?date limit 50
`

var url = new URL('https://dbpedia.org/sparql'),
    params = {
        'query': query,
        'default-graph-uri': 'http://dbpedia.org',
        'format': 'application/sparql-results+json'
    };

Object.keys(params).forEach(
    key => url.searchParams.append(key, params[key])
)

fetch(url).then(function(response) {
    response.json().then(function(data) {
        var items = data.results.bindings.map(function(item) { return {
            date: item.date.value,
            label: item.label.value,
            href: item.link.value,
        }});
        console.log(items);

        var table = new Tabulator("#table", {
            height: 300,
            data: items, //assign data to table
            layout: "fitColumns", //fit columns to width of table (optional)
            columns: [ //Define Table Columns
                {title: "Date", field:"date", align:"left", width: 150},
                {title: "Event", field: "label"},
            ],
            rowClick: function(e, row) {
                window.open(row._row.data.href)
            }
        });
    })
});
