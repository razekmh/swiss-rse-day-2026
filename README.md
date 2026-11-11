# Swiss RSE Day 2026

Slides from my talk about the first [Swiss RSE Day](https://rse.swiss/swiss_rse_day/) at ETH Zurich.
Built with [Quarto](https://quarto.org/) and reveal.js.

Shared mainly for the two small add-ons that drive the deck, in case they are useful to others:

- **A train timeline** across the bottom of every slide. `timeline.html` builds a rail with one stop per slide and
  moves an SBB-style train along it as you navigate. Level-one headings get a named stop; everything else is an
  unnamed stop with a floating label. Styles are in `timeline.css`.
- **A life map** on the `whoami` slides. `life-map.js` reads `data-city`, `data-lon`, `data-lat` and `data-zoom`
  from each slide heading and pans a [Leaflet](https://leafletjs.com/) map to that place as you move through the
  slides, while the slide image floats in a photo panel.

Both are wired in through the YAML header of `index.qmd` (`css`, `include-in-header`, `include-after-body`
and `resources`), so they can be dropped into any Quarto reveal.js deck.

## Adding a map stop

Put the place on the slide heading:

```markdown
## Heading {data-city="Zurich" data-lon="8.54" data-lat="47.38" data-zoom="10"}
```

`data-zoom` is optional and defaults to 6. West longitudes and south latitudes are negative.

## Build

```sh
quarto preview   # live reload
quarto render    # writes _site/index.html
```

Requires Quarto 1.4 or later. Leaflet is loaded from a CDN, so previewing needs a network connection.

## Licence

The code (CSS, HTML, JS, Quarto config) is MIT. The slide text and photos are not; see [LICENSE](LICENSE).
