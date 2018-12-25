var query = `
PREFIX : <http://iolanta.tech/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbc: <http://dbpedia.org/resource/Category:>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>


select ?resource ?label ?link ?thumbnail where {
    ?resource dct:subject dbc:Battles_of_World_War_I_involving_Germany .
    ?resource rdfs:label ?label .
    ?resource foaf:isPrimaryTopicOf ?link .
    ?resource dbo:thumbnail ?thumbnail .
    
    FILTER (lang(?label) = 'en') .
} ORDER BY ?label limit 5
`

$(function() {
    var table = new Tabulator("#table", {
            height: 300,
            layout: "fitColumns",
            columns: [
                {title: "Page", field: "label"},
            ],

            // paginationSize: 20,
            // ajaxProgressiveLoad: "scroll",

            ajaxURL: 'https://dbpedia.org/sparql',
            ajaxConfig: {
                credentials: 'omit',
                method: 'get'
            },

            ajaxURLGenerator: function(url, config, params) {
                var url = new URL(url),
                    params = {
                        'query': query,
                        'default-graph-uri': 'http://dbpedia.org',
                        'format': 'application/sparql-results+json'
                    };

                Object.keys(params).forEach(
                    key => url.searchParams.append(key, params[key])
                )

                return url
            },

            ajaxResponse: function(url, params, response) {
                return response.results.bindings.map(function(item) {
                    return {
                        href: item.link.value,
                        label: item.label.value
                    }
                })
            },

            rowClick: function(e, row) {
                window.open(row._row.data.href)
            }
        });
});