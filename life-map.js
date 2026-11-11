(function () {
  var panel;
  var canvas;
  var nameEl;
  var map;
  var marker;
  var icon;
  var token = 0;
  var photoPanel;
  var photoA;
  var photoB;
  var photoCredit;
  var photoSlide;

  function stations() {
    var head = document.querySelector("#whoami, .whoami");
    if (!head || !head.parentElement) return [];
    var parent = head.parentElement;
    if (parent.classList.contains("slides")) return [head];
    var siblings = Array.prototype.filter.call(parent.children, function (el) {
      return el.tagName === "SECTION";
    });
    return siblings.indexOf(head) === -1 ? [head] : siblings;
  }

  function inWhoami(slide) {
    if (!slide) return false;
    var group = stations();
    return group.indexOf(slide) !== -1;
  }

  function point(slide) {
    if (!slide) return null;
    var lon = parseFloat(slide.getAttribute("data-lon"));
    var lat = parseFloat(slide.getAttribute("data-lat"));
    if (!isFinite(lon) || !isFinite(lat)) return null;
    var zoom = parseFloat(slide.getAttribute("data-zoom"));
    return {
      lon: lon,
      lat: lat,
      city: slide.getAttribute("data-city") || "",
      zoom: isFinite(zoom) ? zoom : 6,
    };
  }

  function boot() {
    if (map || !window.L || !canvas) return;
    map = L.map(canvas, {
      zoomControl: false,
      attributionControl: true,
      keyboard: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    map.setView([20, 10], 2);
    icon = L.divIcon({
      className: "life-map-pin",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    marker = L.marker([47.37, 8.54], { icon: icon, interactive: false });
  }

  function showHint(text) {
    if (nameEl) nameEl.textContent = text;
    if (marker) marker.remove();
  }

  function moveTo(current) {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    marker.setLatLng([current.lat, current.lon]).addTo(map);
    nameEl.textContent = current.city;
    var view = [current.lat, current.lon];
    if (reduce || !map._loaded) map.setView(view, current.zoom);
    else map.flyTo(view, current.zoom, { duration: 1.1 });
  }

  function apply(slide) {
    if (!map) return;
    var size = map.getSize();
    if (!size || size.x < 20 || size.y < 20) return false;
    var group = stations();
    var current = point(slide);

    if (!current) {
      var any = group.map(point).filter(Boolean);
      if (!any.length) {
        showHint("Add a city on the next slide");
        map.setView([20, 10], 2);
        return true;
      }
      nameEl.textContent = "";
      if (marker) marker.remove();
      map.fitBounds(
        L.latLngBounds(
          any.map(function (place) {
            return [place.lat, place.lon];
          }),
        ).pad(0.6),
        { animate: false },
      );
      return true;
    }

    moveTo(current);
    return true;
  }

  function imgSrc(img) {
    return img.getAttribute("src") || img.getAttribute("data-src") || "";
  }

  function slideFigures(slide) {
    if (!slide) return [];
    var nodes;
    if (slide.querySelector(":scope > .pair")) {
      nodes = slide.querySelectorAll(":scope > .pair img");
    } else {
      nodes = [];
      var children = slide.children;
      for (var i = 0; i < children.length; i++) {
        var el = children[i];
        if (el.tagName === "IMG") nodes.push(el);
        else if (el.tagName === "P" && el.querySelector("img"))
          nodes.push(el.querySelector("img"));
      }
    }
    var srcs = [];
    for (var j = 0; j < nodes.length; j++) {
      var src = imgSrc(nodes[j]);
      if (src) srcs.push(src);
    }
    return srcs;
  }

  function setPhoto(img, src) {
    if (!img) return;
    if (!src) {
      img.hidden = true;
      img.removeAttribute("src");
      return;
    }
    if (img.getAttribute("src") !== src) img.src = src;
    img.hidden = false;
  }

  function hidePhoto() {
    photoSlide = null;
    document.body.classList.remove("has-life-photo");
    if (!photoPanel) return;
    photoPanel.classList.remove("is-on", "is-pair", "is-rock");
    setPhoto(photoB, "");
  }

  function placePhoto() {
    if (!photoPanel || !photoSlide || !panel) return;
    var heading = photoSlide.querySelector("h2");
    var top = 96;
    if (heading) {
      var rect = heading.getBoundingClientRect();
      if (rect.bottom > 0 && rect.bottom < window.innerHeight * 0.6) {
        top = rect.bottom + 18;
      }
    }
    var mapRect = panel.getBoundingClientRect();
    var width = window.innerWidth - 22;
    if (mapRect.width > 40) width = mapRect.left - 22;
    photoPanel.style.top = top + "px";
    photoPanel.style.left = "0px";
    photoPanel.style.width = Math.max(160, width) + "px";
    photoPanel.style.bottom = "124px";
  }

  function showPhoto(slide) {
    var figs = slideFigures(slide);
    if (!figs.length || !photoPanel || !photoA) {
      hidePhoto();
      return;
    }
    photoSlide = slide;
    setPhoto(photoA, figs[0]);
    setPhoto(photoB, figs[1] || "");
    photoPanel.classList.toggle("is-pair", figs.length > 1);
    photoPanel.classList.toggle("is-rock", !!slide.querySelector("img.rock"));
    var link = slide.querySelector("a.img-source");
    if (photoCredit) {
      if (link) {
        photoCredit.href = link.getAttribute("href") || "";
        photoCredit.textContent = link.textContent;
        photoCredit.hidden = false;
      } else {
        photoCredit.hidden = true;
        photoCredit.removeAttribute("href");
        photoCredit.textContent = "";
      }
    }
    document.body.classList.add("has-life-photo");
    photoPanel.classList.add("is-on");
    placePhoto();
  }

  function sync() {
    if (!panel || !window.Reveal) return;
    var slide = Reveal.getCurrentSlide();
    var active = inWhoami(slide);
    document.body.classList.toggle("is-whoami", active);
    if (!active) {
      hidePhoto();
      return;
    }
    showPhoto(slide);

    if (!window.L) {
      showHint("Map needs a network connection");
      return;
    }
    boot();
    var generation = ++token;
    function attempt(tries) {
      if (generation !== token || !map) return;
      map.invalidateSize();
      if (apply(slide) || tries > 12) return;
      requestAnimationFrame(function () {
        attempt(tries + 1);
      });
    }
    requestAnimationFrame(function () {
      attempt(0);
    });
  }

  function start() {
    panel = document.querySelector(".life-map");
    photoPanel = document.querySelector(".life-photo");
    if (photoPanel) {
      photoA = photoPanel.querySelector(".life-photo-a");
      photoB = photoPanel.querySelector(".life-photo-b");
      photoCredit = photoPanel.querySelector(".life-photo-credit");
    }
    if (!panel || !window.Reveal) return;
    canvas = panel.querySelector(".life-map-canvas");
    nameEl = panel.querySelector(".life-map-name");
    Reveal.on("ready", sync);
    Reveal.on("slidechanged", sync);
    Reveal.on("resize", function () {
      if (photoSlide) placePhoto();
    });
    if (Reveal.isReady && Reveal.isReady()) sync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
