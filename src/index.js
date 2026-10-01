// JP Digital AI Platform
// Cloudflare Worker Backend

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
        status: "online",
        database: env.DB ? "connected" : "not connected"
      }, corsHeaders);
    }

    // =========================================
    // WEBSITE SCANNER
    // =========================================

    if (
      url.pathname === "/api/scan" &&
      request.method === "POST"
    ) {
      return handleScan(request, env, corsHeaders);
    }

    // =========================================
    // AI WEBSITE BUILDER
    // =========================================

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
    // RECEPTIONIST 7-DAY TRIAL
    // =========================================

    if (
      url.pathname === "/api/receptionist/trial" &&
      request.method === "POST"
    ) {
      return handleReceptionistTrial(
        request,
        env,
        corsHeaders
      );
    }

    // =========================================
    // PRODUCT LOOKUP
    // =========================================

    if (
      url.pathname === "/api/product" &&
      request.method === "GET"
    ) {
      return handleProduct(request, env, corsHeaders);
    }

    // =========================================
    // DEFAULT
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


// =========================================
// WEBSITE SCANNER
// =========================================

async function handleScan(request, env, corsHeaders) {
  try {
    const body = await request.json();

    const websiteUrl = body.url?.trim();

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

    const id = crypto.randomUUID();

    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO scanner_results (
          id,
          website_url,
          seo_score,
          performance_score,
          trust_score,
          conversion_score,
          authority_score,
          crawlability_score,
          ai_visibility_score,
          total_score,
          results_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          id,
          parsedUrl.href,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          JSON.stringify({
            status: "received",
            message: "Website received for analysis."
          })
        )
        .run();
    }

    return json({
      success: true,
      id,
      url: parsedUrl.href,
      status: "received",
      message: "Website received by JP Business Scanner."
    }, corsHeaders);

  } catch (error) {
    return json({
      success: false,
      error: "Unable to process scanner request.",
      details: error.message
    }, corsHeaders, 500);
  }
}


// =========================================
// AI WEBSITE BUILDER
// =========================================

async function handleBuilderGeneration(
  request,
  env,
  corsHeaders
) {
  try {
    const body = await request.json();

    // Supports both the old and new frontend format
    const businessName =
      body.businessName?.trim() ||
      body.business?.trim();

    const businessType =
      body.businessType?.trim() || "";

    const description =
      body.description?.trim() ||
      body.business?.trim();

    const userId =
      body.userId || null;

    if (!businessName || !description) {
      return json({
        success: false,
        error: "Business name and description are required."
      }, corsHeaders, 400);
    }

    const projectId = crypto.randomUUID();
    const websiteId = crypto.randomUUID();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(businessName)}</title>
<meta name="description" content="${escapeHTML(description)}">
</head>

<body>

<header>
  <h1>${escapeHTML(businessName)}</h1>
  <p>${escapeHTML(description)}</p>
  <button>Contact Us</button>
</header>

<main>

<section>
  <h2>Welcome to ${escapeHTML(businessName)}</h2>
  <p>
    We are here to provide quality services
    and help our customers get the results they need.
  </p>
</section>

<section>
  <h2>Our Services</h2>
  <p>
    Discover our services and see how we can
    help you.
  </p>
</section>

<section>
  <h2>Get In Touch</h2>
  <p>Contact us today to learn more.</p>
  <button>Contact Us</button>
</section>

</main>

</body>
</html>
`;

    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO website_projects (
          id,
          user_id,
          business_name,
          business_type,
          description,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `)
        .bind(
          projectId,
          userId,
          businessName,
          businessType,
          description,
          "preview"
        )
        .run();

      await env.DB.prepare(`
        INSERT INTO generated_websites (
          id,
          user_id,
          project_id,
          prompt,
          generated_html,
          status,
          unlocked
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          websiteId,
          userId,
          projectId,
          description,
          html,
          "preview",
          0
        )
        .run();
    }

    return json({
      success: true,
      projectId,
      websiteId,
      status: "preview",
      unlocked: false,
      business: {
        name: businessName,
        type: businessType,
        description
      },
      html,
      message: "Website preview generated successfully."
    }, corsHeaders);

  } catch (error) {
    return json({
      success: false,
      error: "Unable to generate website.",
      details: error.message
    }, corsHeaders, 500);
  }
}


// =========================================
// AI RECEPTIONIST 7-DAY TRIAL
// =========================================

async function handleReceptionistTrial(
  request,
  env,
  corsHeaders
) {
  try {
    const body = await request.json();

    const businessName =
      body.businessName?.trim();

    const email =
      body.email?.trim();

    const phone =
      body.phone?.trim() || null;

    const userId =
      body.userId || null;

    if (!businessName || !email) {
      return json({
        success: false,
        error: "Business name and email are required."
      }, corsHeaders, 400);
    }

    const trialId = crypto.randomUUID();

    const started = new Date();

    const ends = new Date(
      started.getTime() +
      7 * 24 * 60 * 60 * 1000
    );

    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO receptionist_trials (
          id,
          user_id,
          business_name,
          business_email,
          business_phone,
          trial_started_at,
          trial_ends_at,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          trialId,
          userId,
          businessName,
          email,
          phone,
          started.toISOString(),
          ends.toISOString(),
          "active"
        )
        .run();
    }

    return json({
      success: true,
      trialId,
      trialStartedAt: started.toISOString(),
      trialEndsAt: ends.toISOString(),
      trialDays: 7,
      activationPriceUSD: 200,
      status: "active",
      message:
        "Your 7-day AI Receptionist trial has started."
    }, corsHeaders);

  } catch (error) {
    return json({
      success: false,
      error: "Unable to start receptionist trial.",
      details: error.message
    }, corsHeaders, 500);
  }
}


// =========================================
// PRODUCT LOOKUP
// =========================================

async function handleProduct(
  request,
  env,
  corsHeaders
) {
  try {
    const url = new URL(request.url);

    const slug =
      url.searchParams.get("slug");

    if (!slug) {
      return json({
        success: false,
        error: "Product slug is required."
      }, corsHeaders, 400);
    }

    if (!env.DB) {
      return json({
        success: false,
        error: "Database is not connected."
      }, corsHeaders, 500);
    }

    const product =
      await env.DB.prepare(`
        SELECT *
        FROM products
        WHERE slug = ?
        LIMIT 1
      `)
        .bind(slug)
        .first();

    if (!product) {
      return json({
        success: false,
        error: "Product not found."
      }, corsHeaders, 404);
    }

    return json({
      success: true,
      product
    }, corsHeaders);

  } catch (error) {
    return json({
      success: false,
      error: "Unable to load product.",
      details: error.message
    }, corsHeaders, 500);
  }
}


// =========================================
// HTML ESCAPE
// =========================================

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// =========================================
// JSON RESPONSE
// =========================================

function json(
  data,
  corsHeaders = {},
  status = 200
) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",
        ...corsHeaders
      }
    }
  );
        }
