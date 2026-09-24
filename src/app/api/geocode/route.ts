import { NextResponse } from 'next/server';

interface GeocodeResult {
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

// Pre-indexed Indian campuses & tech hubs for instantaneous zero-latency search
const INSTANT_LOCATIONS: GeocodeResult[] = [
  {
    title: 'Christ University Main Campus',
    subtitle: 'Hosur Road, Bhavani Nagar, S.G. Palya, Bengaluru, Karnataka - 560029',
    lat: 12.9344,
    lng: 77.6060,
  },
  {
    title: 'Christ University Bannerghatta Road Campus',
    subtitle: 'Hulimavu, Bannerghatta Road, Bengaluru, Karnataka - 560076',
    lat: 12.8794,
    lng: 77.5951,
  },
  {
    title: 'Christ University Kengeri Campus',
    subtitle: 'Kanmanike, Kumbalgodu, Mysuru Road, Bengaluru - 560074',
    lat: 12.8631,
    lng: 77.4382,
  },
  {
    title: 'PES University Ring Road Campus',
    subtitle: '100 Feet Ring Road, BSK 3rd Stage, Bengaluru, Karnataka - 560085',
    lat: 12.9343,
    lng: 77.5348,
  },
  {
    title: 'PES University Electronic City Campus',
    subtitle: 'Hosur Road, Konappana Agrahara, Electronic City, Bengaluru - 560100',
    lat: 12.8519,
    lng: 77.6657,
  },
  {
    title: 'Koramangala 5th Block',
    subtitle: 'Koramangala, Bengaluru, Karnataka - 560095',
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    title: 'Koramangala 4th Block',
    subtitle: 'Near Sony World Junction, Koramangala, Bengaluru - 560034',
    lat: 12.9339,
    lng: 77.6322,
  },
  {
    title: 'Indiranagar 100 Feet Road',
    subtitle: 'Indiranagar, Bengaluru, Karnataka - 560038',
    lat: 12.9719,
    lng: 77.6412,
  },
  {
    title: 'HSR Layout Sector 1',
    subtitle: 'HSR Layout, Bengaluru, Karnataka - 560102',
    lat: 12.9116,
    lng: 77.6389,
  },
  {
    title: 'IIT Delhi Campus',
    subtitle: 'Hauz Khas, New Delhi, Delhi - 110016',
    lat: 28.5450,
    lng: 77.1926,
  },
  {
    title: 'IIT Madras Campus',
    subtitle: 'Sardar Patel Road, Adyar, Chennai, Tamil Nadu - 600036',
    lat: 12.9915,
    lng: 80.2337,
  },
  {
    title: 'IIT Bombay Campus',
    subtitle: 'Main Gate Road, Powai, Mumbai, Maharashtra - 400076',
    lat: 19.1334,
    lng: 72.9133,
  },
  {
    title: 'Connaught Place',
    subtitle: 'Rajiv Chowk, Central Delhi, New Delhi - 110001',
    lat: 28.6315,
    lng: 77.2167,
  },
  {
    title: 'BMS College of Engineering',
    subtitle: 'Bull Temple Road, Basavanagudi, Bengaluru - 560019',
    lat: 12.9416,
    lng: 77.5658,
  },
  {
    title: 'MS Ramaiah Institute of Technology',
    subtitle: 'MSRIT Post, MSR Nagar, Bengaluru - 560054',
    lat: 13.0315,
    lng: 77.5649,
  },
  {
    title: 'RV College of Engineering',
    subtitle: 'Mysore Road, RV Vidyanikethan Post, Bengaluru - 560059',
    lat: 12.9238,
    lng: 77.4987,
  },
  {
    title: 'Jain University Global Campus',
    subtitle: 'JGI Knowledge Campus, Jayanagar 9th Block, Bengaluru - 560069',
    lat: 12.9171,
    lng: 77.5897,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // --- REVERSE GEOCODING ---
  if (action === 'reverse') {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing lat or lng' }, { status: 400 });
    }

    try {
      // 1. Try Photon reverse
      const photonRes = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, {
        headers: { 'User-Agent': 'XeroxBooking/2.0' },
        cache: 'no-store',
      });

      if (photonRes.ok) {
        const data = await photonRes.json();
        if (data.features && data.features.length > 0) {
          const props = data.features[0].properties || {};
          const parts = [
            props.name,
            props.street,
            props.district || props.locality,
            props.city,
            props.state,
            props.country,
          ].filter(Boolean);

          if (parts.length > 0) {
            return NextResponse.json({ address: parts.join(', ') });
          }
        }
      }
    } catch (err) {
      console.warn('Photon reverse error:', err);
    }

    // 2. Fallback to Nominatim reverse
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'XeroxBookingApp/2.0 (contact@xeroxbooking.com)',
            'Accept-Language': 'en',
          },
          cache: 'no-store',
        }
      );
      if (nomRes.ok) {
        const data = await nomRes.json();
        if (data.display_name) {
          return NextResponse.json({ address: data.display_name });
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse error:', err);
    }

    return NextResponse.json({ address: `📍 Location (${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})` });
  }

  // --- FORWARD SEARCH / AUTOCOMPLETE ---
  const query = (searchParams.get('q') || '').trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results: GeocodeResult[] = [];
  const qLower = query.toLowerCase();

  // 1. Check instant local index first
  for (const item of INSTANT_LOCATIONS) {
    if (
      item.title.toLowerCase().includes(qLower) ||
      item.subtitle.toLowerCase().includes(qLower)
    ) {
      results.push(item);
    }
  }

  // 2. Query Photon for live OpenStreetMap autocomplete
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8`;
    const photonRes = await fetch(photonUrl, {
      headers: { 'User-Agent': 'XeroxBooking/2.0' },
      cache: 'no-store',
    });

    if (photonRes.ok) {
      const data = await photonRes.json();
      if (data.features && Array.isArray(data.features)) {
        for (const feat of data.features) {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates; // [lng, lat]
          if (coords && coords.length >= 2) {
            const lat = coords[1];
            const lng = coords[0];

            const title = props.name || props.street || query;
            const subtitleParts = [
              props.street && props.street !== title ? props.street : null,
              props.district || props.locality,
              props.city,
              props.state,
              props.country,
            ].filter(Boolean);

            const subtitle = subtitleParts.join(', ') || props.country || 'Location';

            // Avoid near duplicates
            const isDuplicate = results.some(
              (r) => Math.abs(r.lat - lat) < 0.001 && Math.abs(r.lng - lng) < 0.001
            );

            if (!isDuplicate) {
              results.push({ title, subtitle, lat, lng });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Photon forward search error:', err);
  }

  // 3. Fallback to Nominatim if results are still empty
  if (results.length === 0) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
      const nomRes = await fetch(nomUrl, {
        headers: {
          'User-Agent': 'XeroxBookingApp/2.0 (contact@xeroxbooking.com)',
          'Accept-Language': 'en',
        },
        cache: 'no-store',
      });

      if (nomRes.ok) {
        const data = await nomRes.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const parts = (item.display_name || '').split(',');
            const title = parts[0]?.trim() || query;
            const subtitle = parts.slice(1, 4).join(',').trim();

            results.push({
              title,
              subtitle: subtitle || item.display_name,
              lat,
              lng,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Nominatim forward search error:', err);
    }
  }

  return NextResponse.json({ results: results.slice(0, 10) });
}
