class WikipediaTable extends HTMLElement {
  constructor() {
    super();
    this._countryCode = null;

    // Create a shadow root
    const shadow = this.attachShadow({mode: 'open'});

    // Create spans
    const wrapper = document.createElement('span');
    wrapper.setAttribute('class', 'wrapper');

    const container = document.createElement('div');
    container.setAttribute('id', 'table');
    container.setAttribute('tabindex', 0);

    const stylesheet = document.createElement('link');
    stylesheet.setAttribute('rel', 'stylesheet');
    stylesheet.setAttribute('href', 'https://unpkg.com/tabulator-tables@4.1.4/dist/css/tabulator.min.css');

    const jquery = document.createElement('script');
    
    var self = this;
    jquery.onload = function() {
      self._is_jquery_loaded = true;

      create_table();
    }

    jquery.setAttribute('type', 'text/javascript');
    jquery.setAttribute('src', 'https://code.jquery.com/jquery-3.3.1.min.js');

    const tabulator = document.createElement('script');
    tabulator.onload = function() {
      self._is_tabulator_loaded = true;

      create_table();
    }

    tabulator.setAttribute('type', 'text/javascript');
    tabulator.setAttribute('src', 'https://unpkg.com/tabulator-tables@4.1.4/dist/js/tabulator.min.js');

    // Take attribute content and put it inside the info span
    const category = this.getAttribute('category');
    
    shadow.appendChild(stylesheet);
    shadow.appendChild(jquery);
    shadow.appendChild(tabulator);
    
    shadow.appendChild(wrapper);
    wrapper.appendChild(container);

    function create_table() {
      if (!(self._is_jquery_loaded && self._is_tabulator_loaded)) {
        return;
      }

      var query_template = `
PREFIX : <http://iolanta.tech/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbc: <http://dbpedia.org/resource/Category:>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>

select ?resource ?label ?link where {
    ?resource dct:subject dbc:{category} .
    ?resource rdfs:label ?label .
    ?resource foaf:isPrimaryTopicOf ?link .
    # ?resource dbo:thumbnail ?thumbnail .
    
    FILTER (lang(?label) = 'en') .
} ORDER BY ?label
`

      var $container = $(shadow).find('#table')[0];
      
      self.tabulator = new Tabulator($container, {
        height: 300,
        layout: "fitColumns",
        columns: [
            {title: "Page", field: "label"},
        ],

        ajaxURL: 'https://dbpedia.org/sparql',
        ajaxConfig: {
            credentials: 'omit',
            method: 'get',
            headers: {
                'Accept': 'application/sparql-results+json'
            }
        },

        ajaxURLGenerator: function(url, config, params) {
            var query = query_template.replace(
                  '{category}',
                  self.category.replace(/ /g, '_')
                ),
                url = new URL(url),
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
    }
    
  }

  static get observedAttributes() { return ["category"]; }

  attributeChangedCallback(name, oldValue, newValue) {
    // name will always be "country" due to observedAttributes
    this._category = newValue;
    this._updateRendering();
  }
  connectedCallback() {
    this._updateRendering();
  }

  get category() {
    return this._category;
  }
  set category(v) {
    this.setAttribute("category", v);
  }

  _updateRendering() {
    if (this.tabulator) {
      this.tabulator.setData();
    }
  }
}


window.onload = function() {
  document.getElementsByTagName('select')[0].onchange = function() {
    document.getElementsByTagName('wikipedia-table')[0].category = this.value;
  }
}


customElements.define("wikipedia-table", WikipediaTable);
