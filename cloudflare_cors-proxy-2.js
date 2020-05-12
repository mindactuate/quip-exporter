// https://developers.cloudflare.com/workers/templates/pages/cors_header_proxy/

// We support the GET, POST, HEAD, and OPTIONS methods from any origin,
// and accept the Content-Type header on requests. These headers must be
// present on all responses to all CORS requests. In practice, this means
// all responses to OPTIONS requests.
const corsHeaders = {
  // "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Origin": "https://mindactuate.github.io",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
};

async function handleRequest(event) {
  let request = event.request;
  const url = new URL(request.url)
  const apiurl = url.searchParams.get("apiurl");

  if(apiurl && apiurl.length > 0){
    return handleError("No param apiurl",400);
  }

  // Rewrite request to point to API url. This also makes the request mutable
  // so we can add the correct Origin header to make the API server think
  // that this request isn't cross-site.
  request = new Request(apiurl, request);
  // request.headers.set("Origin", new URL(apiurl).origin);

  let response = await fetch(request);

  // Recreate the response so we can modify the headers
  response = new Response(response.body, response);

  // Set CORS headers
  Object.keys(corsHeaders).map(headerName => {
    response.headers.set(headerName, corsHeaders[headerName]);
  })

  // Append to/Add Vary header so browser will cache response correctly
  response.headers.append("Vary", "Origin");

  // Debug
  // response.headers.set("X-Debug-1", JSON.stringify(event));
  // response.headers.set("X-Debug-2", JSON.stringify([...event.request.headers]));

  return response;
}

function handleOptions(event) {
  // Make sure the necesssary headers are present
  // for this to be a valid pre-flight request
  return new Response(null, {
    headers: {
      ...corsHeaders,
      // "X-Debug-1": JSON.stringify(event),
      // "X-Debug-2": JSON.stringify([...event.request.headers]),
    },
  });
}

function handleError(message, statusCode){
  let code = 400;
  if(statusCode && Number.isInteger(statusCode)){
    code = Number.parseInt(statusCode);
  }
  return new Response(message, {status: code})
}

addEventListener("fetch", (event) => {
  const request = event.request;
  const origin = request.headers.get('Origin')
  if (origin && origin === corsHeaders["Access-Control-Allow-Origin"]) {
    if (request.method === "OPTIONS") {
      // Handle CORS preflight requests
      event.respondWith(handleOptions(event));
    } else if (
      request.method === "GET" ||
      request.method === "HEAD" ||
      request.method === "POST"
    ) {
      // Handle requests to the API server
      event.respondWith(handleRequest(event));
    } else {
      event.respondWith(handleError("Method Not Allowed",405));
    }
  } else {
    event.respondWith(handleError("Origin Not Allowed",403));
  }
});