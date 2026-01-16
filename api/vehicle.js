// api/vehicle.js

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: "Only GET method allowed",
      credit: "@SxThunder"
    });
  }

  // Get vehicle number from different possible query params
  const vehicleNum = req.query.num || 
                     req.query.test1 || 
                     req.query.v || 
                     req.query.vehicle || 
                     req.query.q;

  if (!vehicleNum) {
    return res.status(400).json({
      success: false,
      error: "Vehicle number missing. Example: ?num=KA04JW3068 or ?test1=UP32AB1234",
      credit: "@SxThunder"
    });
  }

  try {
    const originalUrl = `https://api.x10.network/numapi.php?action=api&key=thunder&test1=${encodeURIComponent(vehicleNum)}`;

    const response = await fetch(originalUrl, {
      headers: {
        'User-Agent': 'VehicleProxy/1.0 (Credit @SxThunder)'
      }
    });

    if (!response.ok) {
      throw new Error(`Original API error: ${response.status} ${response.statusText}`);
    }

    // Get raw response as text (most safe way)
    let rawData = await response.text();

    // Try to parse as JSON, if fails → treat as string
    let parsedData;
    try {
      parsedData = JSON.parse(rawData);
    } catch (e) {
      parsedData = rawData; // keep as string if not valid JSON
    }

    // Clean function: remove @mentions & links
    const cleanValue = (value) => {
      if (typeof value !== 'string') return value;

      return value
        .replace(/https?:\/\/[^\s]+/gi, '[LINK HIDDEN]')
        .replace(/www\.[^\s]+/gi, '[LINK HIDDEN]')
        .replace(/@[\w\d_.-]+/gi, '[USER HIDDEN]')
        .trim();
    };

    // Deep clean (handles objects, arrays, strings)
    const cleanDeep = (data) => {
      if (typeof data === 'string') {
        return cleanValue(data);
      }
      if (Array.isArray(data)) {
        return data.map(cleanDeep);
      }
      if (data && typeof data === 'object') {
        const cleaned = {};
        for (const key in data) {
          cleaned[key] = cleanDeep(data[key]);
        }
        return cleaned;
      }
      return data;
    };

    const cleanedData = cleanDeep(parsedData);

    // Final ALWAYS JSON response
    return res.status(200).json({
      success: true,
      vehicle_number: vehicleNum.toUpperCase(),
      data: cleanedData,
      original_response_type: typeof parsedData === 'string' ? 'text' : 'json',
      cleaned: true,
      credit: "@SxThunder",
      note: "All @mentions and links are hidden | Powered by @SxThunder proxy"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch vehicle details",
      details: error.message,
      credit: "@SxThunder"
    });
  }
    }
