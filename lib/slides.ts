/**
 * Helper utility for Google Slides & Canva Presentation URL validation and safe iframe embedding
 */

export type PresentationPlatform = 'google_slides' | 'canva' | 'unknown';

export interface ParsedPresentation {
  isValid: boolean;
  platform: PresentationPlatform;
  platformLabel: string;
  embedUrl: string | null;
  presentationId: string | null;
  openUrl: string | null;
  errorMessage?: string;
}

// Backward compatibility alias
export type ParsedGoogleSlides = ParsedPresentation;

/**
 * Validates and transforms a Google Slides or Canva presentation URL into a safe embed URL
 */
export function parsePresentationUrl(rawUrl: string | null | undefined): ParsedPresentation {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      isValid: false,
      platform: 'unknown',
      platformLabel: 'ไม่ทราบแหล่งที่มา',
      embedUrl: null,
      presentationId: null,
      openUrl: null,
      errorMessage: 'กรุณาระบุลิงก์ Google Slides หรือ Canva',
    };
  }

  const cleanUrl = rawUrl.trim();

  // Validate URL format
  let urlObj: URL;
  try {
    urlObj = new URL(cleanUrl);
  } catch {
    return {
      isValid: false,
      platform: 'unknown',
      platformLabel: 'ไม่ทราบแหล่งที่มา',
      embedUrl: null,
      presentationId: null,
      openUrl: null,
      errorMessage: 'รูปแบบ URL ไม่ถูกต้อง กรุณาใส่ลิงก์ที่ขึ้นต้นด้วย https://',
    };
  }

  const hostname = urlObj.hostname.toLowerCase();

  // ==========================================
  // CASE 1: GOOGLE SLIDES
  // ==========================================
  if (hostname === 'docs.google.com' && urlObj.pathname.includes('/presentation/')) {
    // Pattern 1.1: Published to web (docs.google.com/presentation/d/e/2PACX-.../pub or /embed)
    const pubMatch = urlObj.pathname.match(/\/presentation\/d\/e\/([^/]+)/);
    if (pubMatch && pubMatch[1]) {
      const pubId = pubMatch[1];
      const embedUrl = `https://docs.google.com/presentation/d/e/${pubId}/embed?start=false&loop=false&delayms=3000`;
      const openUrl = `https://docs.google.com/presentation/d/e/${pubId}/pub`;
      return {
        isValid: true,
        platform: 'google_slides',
        platformLabel: 'Google Slides',
        embedUrl,
        presentationId: pubId,
        openUrl,
      };
    }

    // Pattern 1.2: Standard presentation (docs.google.com/presentation/d/PRESENTATION_ID/...)
    const stdMatch = urlObj.pathname.match(/\/presentation\/d\/([^/]+)/);
    if (stdMatch && stdMatch[1]) {
      const presentationId = stdMatch[1];
      const embedUrl = `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`;
      const openUrl = `https://docs.google.com/presentation/d/${presentationId}/preview`;
      return {
        isValid: true,
        platform: 'google_slides',
        platformLabel: 'Google Slides',
        embedUrl,
        presentationId,
        openUrl,
      };
    }

    return {
      isValid: false,
      platform: 'google_slides',
      platformLabel: 'Google Slides',
      embedUrl: null,
      presentationId: null,
      openUrl: null,
      errorMessage: 'ไม่พบรหัส Presentation ในลิงก์ Google Slides กรุณาคัดลอกลิงก์จากแถบเบราว์เซอร์หรือปุ่มแชร์',
    };
  }

  // ==========================================
  // CASE 2: CANVA PRESENTATION
  // ==========================================
  // Matches: canva.com/design/DA.../view, /edit, /watch, etc.
  if (hostname === 'canva.com' || hostname === 'www.canva.com') {
    if (urlObj.pathname.startsWith('/design/')) {
      // Canva path typically: /design/{DESIGN_ID}/{SLUG}/{ACTION} or /design/{DESIGN_ID}/{ACTION}
      // e.g. /design/DAHXzjG3uio/BAGonn97Pyo/view?embed or /design/DAHXzjG3uio/view
      const canvaMatch = urlObj.pathname.match(/^\/design\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?/);
      if (canvaMatch && canvaMatch[1]) {
        const part1 = canvaMatch[1]; // designId
        const part2 = canvaMatch[2]; // slug or action
        const part3 = canvaMatch[3]; // action if part2 was slug

        let designId = part1;
        let slug = '';

        // If part3 exists, part2 was a slug (e.g. /design/DA123/my-presentation/view)
        if (part3) {
          slug = part2;
        } else if (part2 && !['view', 'edit', 'watch', 'present'].includes(part2.toLowerCase())) {
          // If part2 is not an action keyword, it's a slug
          slug = part2;
        }

        const slugPath = slug ? `${encodeURIComponent(slug)}/` : '';
        const embedUrl = `https://www.canva.com/design/${designId}/${slugPath}view?embed`;
        const openUrl = `https://www.canva.com/design/${designId}/${slugPath}view`;

        return {
          isValid: true,
          platform: 'canva',
          platformLabel: 'Canva Presentation',
          embedUrl,
          presentationId: designId,
          openUrl,
        };
      }
    }

    return {
      isValid: false,
      platform: 'canva',
      platformLabel: 'Canva',
      embedUrl: null,
      presentationId: null,
      openUrl: null,
      errorMessage: 'ลิงก์ Canva ต้องอยู่ในรูปแบบ https://www.canva.com/design/... กรุณาคัดลอกลิงก์จากหน้างานนำเสนอ',
    };
  }

  return {
    isValid: false,
    platform: 'unknown',
    platformLabel: 'ไม่รองรับ',
    embedUrl: null,
    presentationId: null,
    openUrl: null,
    errorMessage: 'ระบบรองรับเฉพาะลิงก์ Google Slides (docs.google.com) และ Canva (canva.com/design/...) เท่านั้น',
  };
}

// Keep original function name as alias for backward compatibility
export const parseGoogleSlidesUrl = parsePresentationUrl;
