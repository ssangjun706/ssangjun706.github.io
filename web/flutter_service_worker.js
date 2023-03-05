'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"assets/AssetManifest.bin": "99dd84a0589aab8287b90766a341fe86",
"assets/AssetManifest.json": "4fbac509f961655bd81fbee8a65cefd3",
"assets/font/custom_font_normal.ttf": "12bd3606ebae38deac6acbad730e4291",
"assets/FontManifest.json": "2155dda6e0f576dc194bfa4aa4f1f4de",
"assets/fonts/MaterialIcons-Regular.otf": "8ff9d559f398533f22cc0aad774050b5",
"assets/image/account_balance.png": "ce8da815585ca4d946b982df9eabf3f0",
"assets/image/brand_icon.png": "9ff3744f4f60fc7734f985f60290b989",
"assets/image/daily_expenditure.png": "4b034826ad438c4228cb6b6a9332e3f4",
"assets/image/daily_limit.png": "d1cbc387cebf6e8cec25608c5211a26e",
"assets/image/daily_report.png": "8311d92f1306013128e973f103f5e57f",
"assets/image/deposit.png": "21e944bb84e3baa8078e1b844af8923c",
"assets/image/manual_setting.png": "34e262c6b167f64ef1ca5ac37b783951",
"assets/image/memo.png": "8eff86a4952d04da0b152df29b5b1ed4",
"assets/image/monthly_expect.png": "c7b42079bf615a6f33097e356b3ebd57",
"assets/image/monthly_salary.png": "610248ef3e8491c5c272e0f6804dadf4",
"assets/image/monthly_total.png": "588e37a963c71788480be3ef2147ba21",
"assets/image/name.png": "4e516494789c6d10694cd11a0896017d",
"assets/image/password.png": "cc92faf88c4b95800a5598dcea4ed835",
"assets/image/payday.png": "c5c71101e9862731750b5534f5cfaa71",
"assets/image/salary.png": "3d98aa26ea4f94e3200864c1936202a7",
"assets/image/weekly_report.png": "597b986a0f520a32b09a47ef1e42e641",
"assets/NOTICES": "5a5a6eaa4aa3efdba90d3bd9535b1219",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "57d849d738900cfd590e9adc7e208250",
"assets/shaders/ink_sparkle.frag": "57f2f020e63be0dd85efafc7b7b25d80",
"canvaskit/canvaskit.js": "d8ad2fa33cb436ca011f6077f636fe31",
"canvaskit/canvaskit.wasm": "8a69f8da8051cd69aa23d4d5811bb19a",
"favicon.png": "4b0eeb4a676e841dbdfcece1b2cccd37",
"flutter.js": "6b515e434cea20006b3ef1726d2c8894",
"icons/apple-touch-icon.png": "19ed3f0b872e569939e505a01690fe69",
"icons/icon-192.png": "317e8cc2252b6c7800ae40ef2e700baf",
"icons/icon-512.png": "4b0eeb4a676e841dbdfcece1b2cccd37",
"icons/icon-maskable-192.png": "317e8cc2252b6c7800ae40ef2e700baf",
"icons/icon-maskable-512.png": "4b0eeb4a676e841dbdfcece1b2cccd37",
"index.html": "4cdcb6182c113426a184bdacbcfead40",
"/": "4cdcb6182c113426a184bdacbcfead40",
"main.dart.js": "c05eff5611111cca42512305ddfdc641",
"manifest.json": "74b1c5af110cd101ed8dc0fbe296b180",
"version.json": "801cb7283f681e62ba9afe9d3693ae8f"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
