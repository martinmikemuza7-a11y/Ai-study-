/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "2a18d48c3d10ab00b85f4e5395d434f0"
  }, {
    "url": "pwa-512x512.png",
    "revision": "2437be7cc7377b56f403ac5fd6e5ba4c"
  }, {
    "url": "pwa-192x192.png",
    "revision": "22d6c8204c7935b0cdd194202d2796ee"
  }, {
    "url": "index.html",
    "revision": "618910c450ae96cbbc7858b7892b4e41"
  }, {
    "url": "icon.svg",
    "revision": "3b42c746251c62874a400fade6671f96"
  }, {
    "url": "favicon.ico",
    "revision": "a38b22d0e67664ba4392ecf396bc2814"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "dd599f53fcff3e8338fa7b926291b9d1"
  }, {
    "url": "assets/index-DsWN-OFW.css",
    "revision": null
  }, {
    "url": "assets/index-CALPHNNz.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "dd599f53fcff3e8338fa7b926291b9d1"
  }, {
    "url": "icon.svg",
    "revision": "3b42c746251c62874a400fade6671f96"
  }, {
    "url": "pwa-192x192.png",
    "revision": "22d6c8204c7935b0cdd194202d2796ee"
  }, {
    "url": "pwa-512x512.png",
    "revision": "2437be7cc7377b56f403ac5fd6e5ba4c"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "2a18d48c3d10ab00b85f4e5395d434f0"
  }, {
    "url": "manifest.webmanifest",
    "revision": "3c6223733dbc6d0c560e6871ca9747fb"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
