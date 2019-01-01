class WikipediaTimeline extends HTMLElement {
    constructor() {
        super();
        this._category = this.getAttribute('category');

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
          href: 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.css'
        })

        var self = this;

        const jquery = document.createElement('script');
        Object.assign(jquery, {
          type: 'text/javascript',
          src: 'https://code.jquery.com/jquery-3.3.1.min.js',
          onload: function() {
            self._is_jquery_loaded = true;
            self.update();
          }
        })

        const tabulator = document.createElement('script');
        Object.assign(tabulator, {
          type: 'text/javascript',
          src: 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js',
          onload: function() {
            self._is_tabulator_loaded = true;
            self.update();
          }
        })


        // Take attribute content and put it inside the info span
        const category = this.getAttribute('category');

        shadow.appendChild(stylesheet);
        shadow.appendChild(jquery);
        shadow.appendChild(tabulator);

        shadow.appendChild(wrapper);
        wrapper.appendChild(container);

        this.container = container;

        this.update();

        function create_table() {
          

          return;

          var $container = $(shadow).find('#table')[0];
          
          self.tabulator = new Tabulator($container, {
            rowClick: function(e, row) {
                window.open(row._row.data.href)
            }
          });
        }
    }

    query() {
        // Generate SPARQL query text.
        var category = this.category.replace(/ /g, '_'),
            query = `
                PREFIX : <http://iolanta.tech/>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX dbo: <http://dbpedia.org/ontology/>
                PREFIX dbp: <http://dbpedia.org/property/>
                PREFIX dbc: <http://dbpedia.org/resource/Category:>
                PREFIX dct: <http://purl.org/dc/terms/>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX prov: <http://www.w3.org/ns/prov#>

                select ?resource ?label ?link ?date where {
                    ?resource dct:subject dbc:${category} .
                    ?resource rdfs:label ?label .
                    ?resource foaf:isPrimaryTopicOf ?link .

                    # FIXME: THIS IS A VERY UGLY AD HOC HACK
                    ?resource dbp:date|dbo:date|dbp:pubDate ?date .
                    
                    FILTER (lang(?label) = 'en') .
                } ORDER BY ?label
            `;

        return query.replace(/    /g, '')
    }

    url() {
        // Generate the URL to SPARQL endpoint.
        var category = this.category,
            url = new URL('https://dbpedia.org/sparql'),
            params = {
                'default-graph-uri': 'http://dbpedia.org',
                'format': 'application/sparql-results+json',
                'query': this.query(),
            };

        Object.keys(params).forEach(
            key => url.searchParams.append(key, params[key])
        )

        return url
    }

    process_response(data) {
        // Transform the raw SPARQL JSON response to usable format

        return new vis.DataSet(data.results.bindings.map(function(item) {
            return {
                href: item.link.value,
                content: item.label.value,
                start: item.date.value
            }
        }));
    }

    update() {
        if (!(this._is_jquery_loaded && this._is_tabulator_loaded)) {
            return;
        }

        var url = this.url(),
            // query = this.query(),
            config = {
                credentials: 'omit',
                method: 'post',
                headers: {
                    'Accept': 'application/sparql-results+json'
                }
            };

        var self = this;
        fetch(url, config).then(function(response) {
            response.json().then(function(data) {
                var items = self.process_response(data);

                self.timeline_dataset = items;

                if (self.timeline) {
                    self.timeline.setItems(items);
                    self.timeline.fit();
                } else {
                    self.create_timeline(items);
                }
            })
        })
    }

    create_timeline(data) {
        this.timeline = new vis.Timeline(
            this.container,
            data, {}
        );

        var self = this;
        this.timeline.on('click', function(event) {
            if (!(event.item)) {
                return;
            }

            var element = self.timeline_dataset.get(event.item);

            window.open(element.href);
        });
    }

  static get observedAttributes() { return ["category"]; }

  attributeChangedCallback(name, oldValue, newValue) {
    // name will always be "category" due to observedAttributes
    this._category = newValue;
    this.update();
  }
  connectedCallback() {
    this.update();
  }

  get category() {
    return this._category;
  }
  set category(v) {
    this.setAttribute("category", v);
  }
}


customElements.define("wikipedia-timeline", WikipediaTimeline);
