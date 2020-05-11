/*
CORS Anywhere as a Cloudflare Worker!
(c) 2019 by Zibri (www.zibri.org)
email: zibri AT zibri DOT org
https://github.com/Zibri/cloudflare-cors-anywhere
*/

/*
whitelist = [ "^http.?://www.zibri.org$", "zibri.org$", "test\\..*" ];  // regexp for whitelisted urls
*/

let blacklist = []; // regexp for blacklisted urls
// let whitelist = [".*"]; // regexp for whitelisted origins
let whitelist = ["^http.?://mindactuate.github.io$"]; // regexp for whitelisted origins

function isListed(uri, listing) {
  var ret = false;
  if (typeof uri == "string") {
    listing.forEach((m) => {
      if (uri.match(m) != null) ret = true;
    });
  } else {
    // decide what to do when Origin is null
    ret = true; // true accepts null origins false rejects them.
  }
  return ret;
}

addEventListener("fetch", async (event) => {
  event.respondWith(
    (async function () {
      var isOPTIONS = event.request.method == "OPTIONS";
      var origin_url = new URL(event.request.url);

      function fix(myHeaders) {
        // myHeaders.set("Access-Control-Allow-Origin", "*");
        myHeaders.set(
          "Access-Control-Allow-Origin",
          event.request.headers.get("Origin")
        );
        if (isOPTIONS) {
          myHeaders.set(
            "Access-Control-Allow-Methods",
            event.request.headers.get("access-control-request-method")
          );
          acrh = event.request.headers.get("access-control-request-headers");
          // myHeaders.set("Access-Control-Allow-Credentials", "true");

          if (acrh) {
            myHeaders.set("Access-Control-Allow-Headers", acrh);
          }

          myHeaders.delete("X-Content-Type-Options");
        }
        return myHeaders;
      }

      var fetch_url = unescape(unescape(origin_url.search.substr(1)));
      var orig = event.request.headers.get("Origin");
      var remIp = event.request.headers.get("CF-Connecting-IP");

      if (!isListed(fetch_url, blacklist) && isListed(orig, whitelist)) {
        xheaders = event.request.headers.get("x-cors-headers");

        if (xheaders != null) {
          try {
            xheaders = JSON.parse(xheaders);
          } catch (e) {}
        }

        if (origin_url.search.startsWith("?")) {
          recv_headers = {};
          for (var pair of event.request.headers.entries()) {
            if (
              pair[0].match("^origin") == null &&
              pair[0].match("eferer") == null &&
              pair[0].match("^cf-") == null &&
              pair[0].match("^x-forw") == null &&
              pair[0].match("^x-cors-headers") == null
            )
              recv_headers[pair[0]] = pair[1];
          }

          if (xheaders != null) {
            Object.entries(xheaders).forEach(
              (c) => (recv_headers[c[0]] = c[1])
            );
          }

          newreq = new Request(event.request, {
            headers: recv_headers,
          });

          var response = await fetch(fetch_url, newreq);
          var myHeaders = new Headers(response.headers);
          cors_headers = [];
          allh = {};
          for (var pair of response.headers.entries()) {
            cors_headers.push(pair[0]);
            allh[pair[0]] = pair[1];
          }
          cors_headers.push("cors-received-headers");
          myHeaders = fix(myHeaders);

          myHeaders.set(
            "Access-Control-Expose-Headers",
            cors_headers.join(",")
          );

          myHeaders.set("cors-received-headers", JSON.stringify(allh));

          if (isOPTIONS) {
            var body = null;
          } else {
            var body = await response.arrayBuffer();
          }

          var init = {
            headers: myHeaders,
            status: isOPTIONS ? 200 : response.status,
            statusText: isOPTIONS ? "OK" : response.statusText,
          };
          return new Response(body, init);
        } else {
          var myHeaders = new Headers();
          myHeaders = fix(myHeaders);

          if (typeof event.request.cf != "undefined") {
            if (typeof event.request.cf.country != "undefined") {
              country = event.request.cf.country;
            } else country = false;

            if (typeof event.request.cf.colo != "undefined") {
              colo = event.request.cf.colo;
            } else colo = false;
          } else {
            country = false;
            colo = false;
          }

          return new Response("", { status: 200, headers: myHeaders });
        }
      } else {
        return new Response(
          "The origin calling this cloudflare cors proxy is not whitelisted.",
          {
            status: 200,
            statusText: "Forbidden",
            // due to CORS preflight every status other than 200 leads to a CORS blocking by the browser even if you add proper headers
            // headers: {
            //   "Access-Control-Allow-Origin": "*", // Required for CORS support to work
            //   "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
            // },
          }
        );
      }
    })()
  );
});
