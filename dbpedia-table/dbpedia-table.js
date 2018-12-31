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

    // Take attribute content and put it inside the info span
    const text = this.getAttribute('data-text');
    

    // Create some CSS to apply to the shadow dom
    const style = document.createElement('style');
    console.log(style.isConnected);

    // Attach the created elements to the shadow dom
    shadow.appendChild(style);
    shadow.appendChild(stylesheet);
    console.log(style.isConnected);
    shadow.appendChild(wrapper);
    wrapper.appendChild(container);
    

    var $container = $(shadow).find('#table')[0];
    
    var table = new Tabulator($container, {
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
  }

  static get observedAttributes() { return ["country"]; }

  attributeChangedCallback(name, oldValue, newValue) {
    // name will always be "country" due to observedAttributes
    this._countryCode = newValue;
    this._updateRendering();
  }
  connectedCallback() {
    this._updateRendering();
  }

  get country() {
    return this._countryCode;
  }
  set country(v) {
    this.setAttribute("country", v);
  }

  _updateRendering() {
    // Left as an exercise for the reader. But, you'll probably want to
    // check this.ownerDocument.defaultView to see if we've been
    // inserted into a document with a browsing context, and avoid
    // doing any work if not.
  }
}


customElements.define("wikipedia-table", WikipediaTable);
