/**
 * Acuity Scheduling API Client
 * Handles authentication, request construction, and response normalization
 * All API calls use HTTP Basic Auth (server-side only)
 */

const ACUITY_BASE_URL = "https://acuityscheduling.com/api/v1";

interface AcuityRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, string | number | boolean>;
  body?: Record<string, any>;
}

interface AcuityErrorResponse {
  error: string;
  message?: string;
  code?: string;
  statusCode?: number;
}

/**
 * Make a request to Acuity Scheduling API
 * Handles Basic Auth, query params, request body, and error handling
 */
export async function makeAcuityRequest(
  endpoint: string,
  options: AcuityRequestOptions = {}
): Promise<any> {
  const { method = "GET", params = {}, body } = options;

  // Validate credentials exist
  const userId = process.env.ACUITY_USER_ID;
  const apiKey = process.env.ACUITY_API_KEY;

  if (!userId || !apiKey) {
    throw new Error(
      "Acuity credentials not configured. Set ACUITY_USER_ID and ACUITY_API_KEY."
    );
  }

  // Build URL with query parameters
  const url = new URL(`${ACUITY_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  // Construct Basic Auth header
  const auth = Buffer.from(`${userId}:${apiKey}`).toString("base64");

  // Prepare request options
  const fetchOptions: RequestInit = {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  };

  // Add request body for POST/PUT requests
  if (body && (method === "POST" || method === "PUT")) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);

    // Parse response
    let data: any;
    try {
      data = await response.json();
    } catch {
      // If not JSON, response text might contain error info
      data = { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    // Handle non-2xx responses
    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        `Acuity API error: ${response.status} ${response.statusText}`;

      console.error(`[Acuity API Error] ${endpoint}:`, {
        status: response.status,
        error: errorMessage,
        // DO NOT log credentials
      });

      throw {
        statusCode: response.status,
        message: errorMessage,
        error: data,
      };
    }

    return data;
  } catch (error: any) {
    // Network errors or other exceptions
    const message =
      error?.message || "Failed to connect to Acuity Scheduling API";

    console.error(`[Acuity Client Error] ${endpoint}:`, {
      message,
      // DO NOT log credentials or sensitive data
    });

    throw {
      statusCode: error?.statusCode || 500,
      message,
      error: error?.error || { error: message },
    };
  }
}

/**
 * Validate Acuity credentials by calling GET /me
 * Called on server startup to ensure API access works
 */
export async function validateAcuityCredentials(): Promise<boolean> {
  try {
    const response = await makeAcuityRequest("/me");
    console.log("[Acuity] Credentials validated successfully");
    return true;
  } catch (error: any) {
    console.error("[Acuity] Credential validation failed:", {
      message: error.message,
      statusCode: error.statusCode,
    });
    return false;
  }
}
