class WikipediaTable extends HTMLElement {
  constructor() {
    super();
    this.query_template = `
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
    
    FILTER (lang(?label) = 'en') .
} ORDER BY ?label
`;

    this._category = null;

    // Create a shadow root
    const shadow = this.attachShadow({mode: 'closed'});

    // Create spans
    const wrapper = document.createElement('span');
    wrapper.setAttribute('class', 'wrapper');

    const container = document.createElement('div');
    // Thanks to https://stackoverflow.com/a/49587260/1245471
    Object.assign(container, {
      id: 'table',
      tabindex: 0
    })

    const stylesheet = document.createElement('link');
    Object.assign(stylesheet, {
      rel: 'stylesheet',
      href: 'https://unpkg.com/tabulator-tables@4.1.4/dist/css/tabulator.min.css'
    })
    
    var self = this;

    const jquery = document.createElement('script');
    Object.assign(jquery, {
      type: 'text/javascript',
      src: 'https://code.jquery.com/jquery-3.3.1.min.js',
      onload: function() {
        self._is_jquery_loaded = true;
        create_table();
      }
    })

    const tabulator = document.createElement('script');
    Object.assign(tabulator, {
      type: 'text/javascript',
      src: 'https://unpkg.com/tabulator-tables@4.1.4/dist/js/tabulator.min.js',
      onload: function() {
        self._is_tabulator_loaded = true;
        create_table();
      }
    })

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
            var query = self.query_template.replace(
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
    // name will always be "category" due to observedAttributes
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


customElements.define("wikipedia-table", WikipediaTable);
