const HtmlWebpackPlugin = require("html-webpack-plugin")
const { stripIndent } = require('common-tags')

class GoogleTagManagerPlugin {

  #defaultOptions = {
    id: '',
    events: '',
    dataLayer: '',
    dataLayerName: '',
    auth: '',
    preview: ''
  };

  #headRegExp = /(<\/head>)/i
  #bodyRegExp = /(<body\s*>)/i

  constructor(options = {}) {
    const defaultOptions = {
      id: '',
      events: '',
      dataLayer: '',
      dataLayerName: '',
      auth: '',
      preview: ''
    }

    this.options = {...defaultOptions, ...userOptions};

    if (!userOptions.id) {
      console.error(`The plugin option "id" has not been set.`)
    }
  }

  createOptions = ({auth, preview})=>{
    let opts = (auth) ? `&gtm_auth=${auth}` : '';
    return (preview) ? `${auth}&gtm_preview=${preview}` : opts
  }

  writeDataLayer = () => {
    let result = `window.${this.options.dataLayerName}=window.${this.options.dataLayerName}||[];`
    if (this.options.dataLayer) {
      if (typeof this.options.dataLayer === `object` || this.options.dataLayer instanceof Object) {
        result += `window.${this.options.dataLayerName}.push(${JSON.stringify(
          this.options.dataLayer
        )});`
      } else {
        console.error(
          `The plugin option "dataLayer" should be a plain object. "${this.options.dataLayer}" is not valid.`
        )
      }
    }
    return stripIndent`${result}`
  }

  writeScriptTag = ()=>stripIndent`<!-- Google Tag Manager -->
      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js',${JSON.stringify(this.options.events).slice(1, -1)}});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl+ '${createOptions(this.options)}&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);
      })(window,document,'script','${this.options.dataLayerName}','${this.options.id}');</script>
      <!-- End Google Tag Manager -->`

  writeNoScript = ()=>stripIndent`
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${this.options.id}&${createOptions(this.options)}&gtm_cookies_win=x"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->
      `

  injectHtml = (html) => {
    if (this.options.dataLayer)
      html = html.replace(this.#headRegExp, match => this.writeDataLayer() + match)
    html = html.replace(this.#headRegExp, match => this.writeScriptTag() + match)
    html = html.replace(this.#bodyRegExp, match => match + this.snippets.writeNoScript())
    return html
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('GoogleTagManagerPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        'GoogleTagManagerPlugin', (htmlPlugin, callback) => {
          htmlPlugin.html = this.injectHtml(htmlPlugin.html)
          callback(null, htmlPlugin)
        }
      )
    })
  }

}

module.exports = GoogleTagManagerPlugin
