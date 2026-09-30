// JP Digital AI Platform
// Cloudflare Worker Backend

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================
    // CORS
    // =========================================

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }


    // =========================================
    // HEALTH CHECK
    // =========================================

    if (url.pathname === "/api/health") {
      return json({
        success: true,
        service: "JP Digital AI Platform",
        status: "online"
      }, corsHeaders);
    }


    // =========================================
    // BASIC API ROUTES
    // =========================================

    if (url.pathname === "/api/scan" && request.method === "POST") {
      return handleScan(request, env, corsHeaders);
    }


    if (
      url.pathname === "/api/builder/generate" &&
      request.method === "POST"
    ) {
      return handleBuilderGeneration(
        request,
        env,
        corsHeaders
      );
    }


    // =========================================
    // DEFAULT RESPONSE
    // =========================================

    return new Response(
      "JP Digital AI Platform is online.",
      {
        status: 200,
        headers: corsHeaders
      }
    );
  }
};


/* =========================================
   SCANNER
========================================= */

async function handleScan(request, env, corsHeaders) {
  try {
    const body = await request.json();

    const websiteUrl = body.url;

    if (!websiteUrl) {
      return json({
        success: false,
        error: "Website URL is required."
      }, corsHeaders, 400);
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(websiteUrl);
    } catch {
      return json({
        success: false,
        error: "Invalid website URL."
      }, corsHeaders, 400);
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return json({
        success: false,
        error: "Only HTTP and HTTPS websites are supported."
      }, corsHeaders, 400);
    }

    /*
      The full JP Business Scanner will be connected here.

      For now we safely test that the Worker
      received the website URL.
    */

    return json({
      success: true,
      url: parsedUrl.href,
      status: "received",
      message: "Website received by JP Business Scanner.",
      next_step: "Full scanner analysis will run here."
    }, corsHeaders);

  } catch (error) {
    return json({
      success: false,
      error: "Unable to process scanner request."
    }, corsHeaders, 500);
  }
}


/* =========================================
   AI WEBSITE BUILDER
========================================= */

async function handleBuilderGeneration(
  request,
  env,
  corsHeaders
) {
  try {
    const body = await request.json();

    const {
      businessName,
      businessType,
      description
    } = body;

    if (!businessName || !description) {
      return json({
        success: false,
        error: "Business name and description are required."
      }, corsHeaders, 400);
    }

    /*
      Workers AI will be connected here.

      The AI will eventually generate:

      - Website structure
      - Homepage copy
      - Services
      - About section
      - Contact section
      - CTA
      - SEO title
      - SEO description
      - FAQ
      - Lead capture flow
      - Complete website HTML
    */

    return json({
      success: true,
      status: "received",
      business: {
        name: businessName,
        type: businessType || "",
        description
      },
      message:
        "Website request received. Workers AI generation will be connected next."
    }, corsHeaders);

  } catch (error) {
    return json({
      success: false,
      error: "Unable to process website request."
    }, corsHeaders, 500);
  }
}


/* =========================================
   JSON RESPONSE HELPER
========================================= */

function json(data, corsHeaders = {}, status = 200) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        ...corsHeaders
      }
    }
  );
}
