'use client';

import React from 'react';
import { CharacterConfig, DEFAULT_CHARACTER_CONFIG } from '@/lib/supabase/types';

interface PixelCharacterProps {
  config?: CharacterConfig | null;
  size?: number; // rendered pixel size (e.g. 64, 128, 160)
  className?: string;
  animate?: boolean;
}

// 18 x 22 Pixel Grid Coordinates
export const PixelCharacter: React.FC<PixelCharacterProps> = ({
  config = DEFAULT_CHARACTER_CONFIG,
  size = 128,
  className = '',
  animate = false,
}) => {
  const currentConfig = {
    ...DEFAULT_CHARACTER_CONFIG,
    ...(config || {}),
  };

  const { hairStyle, hairColor, skinTone, outfit, accessory } = currentConfig;

  // Color palettes
  const skinPalettes: Record<string, { base: string; shadow: string; blush: string }> = {
    fair: { base: '#fce0cb', shadow: '#ecc0a3', blush: '#ff8ca3' },
    warm: { base: '#f4cca1', shadow: '#dfaa7c', blush: '#ff859d' },
    tan: { base: '#e2a774', shadow: '#c48957', blush: '#f0748c' },
    caramel: { base: '#b87d52', shadow: '#975c35', blush: '#e06078' },
  };

  const hairPalettes: Record<string, { base: string; highlight: string; shadow: string }> = {
    black: { base: '#2b262d', highlight: '#443d47', shadow: '#1a171c' },
    chestnut: { base: '#593231', highlight: '#7a4443', shadow: '#3b2020' },
    caramel: { base: '#945747', highlight: '#b36e5d', shadow: '#693c31' },
    indigo: { base: '#34304d', highlight: '#4c466e', shadow: '#222033' },
    'cyber-cyan': { base: '#00c8e0', highlight: '#54f0ff', shadow: '#008b9c' },
    golden: { base: '#c8912e', highlight: '#e6b04e', shadow: '#96691c' },
  };

  const outfitPalettes: Record<
    string,
    { jacket: string; shadow: string; tie: string; pants: string; shoes: string }
  > = {
    'academy-navy': {
      jacket: '#232a3d',
      shadow: '#171c29',
      tie: '#2563eb',
      pants: '#1c1f2b',
      shoes: '#11131a',
    },
    'explorer-khaki': {
      jacket: '#56534f',
      shadow: '#3d3b38',
      tie: '#dc2626',
      pants: '#382e2c',
      shoes: '#181515',
    },
    'cyber-purple': {
      jacket: '#352945',
      shadow: '#231b2e',
      tie: '#a855f7',
      pants: '#282333',
      shoes: '#13111a',
    },
    'casual-charcoal': {
      jacket: '#38353d',
      shadow: '#242228',
      tie: '#64748b',
      pants: '#1e1c22',
      shoes: '#100f13',
    },
    'sci-fi-cyan': {
      jacket: '#0f2838',
      shadow: '#091822',
      tie: '#00f0ff',
      pants: '#111e29',
      shoes: '#080d12',
    },
  };

  const skin = skinPalettes[skinTone] || skinPalettes.warm;
  const hair = hairPalettes[hairColor] || hairPalettes.black;
  const cloth = outfitPalettes[outfit] || outfitPalettes['academy-navy'];
  const outline = '#181622';
  const white = '#ffffff';
  const eye = '#15141e';

  // Pixel drawing helper: list of rects {x, y, w, h, color}
  const pixels: { x: number; y: number; w?: number; h?: number; fill: string }[] = [];

  const add = (x: number, y: number, fill: string, w = 1, h = 1) => {
    pixels.push({ x, y, w, h, fill });
  };

  // 1. BASE HEAD OUTLINE & SKIN (Chibi Head: 18x22 grid, head center x=4..13, y=2..12)
  // Head Outline
  add(5, 2, outline, 8, 1);
  add(4, 3, outline, 1, 9);
  add(13, 3, outline, 1, 9);
  add(5, 12, outline, 8, 1);

  // Face Skin
  add(5, 3, skin.base, 8, 9);

  // Eyes (Simple 2 vertical pixels spaced 4 apart, as in reference)
  add(6, 6, eye, 1, 2);
  add(11, 6, eye, 1, 2);

  // Cute Pink Blushes (1 pixel under outside of eyes)
  add(4, 8, skin.blush, 1, 1);
  add(13, 8, skin.blush, 1, 1);

  // Subtle mouth
  add(8, 9, skin.shadow, 2, 1);

  // 2. HAIRSTYLES (Matching the 8 styles in reference image!)
  switch (hairStyle) {
    case 'side-part':
      // Swept side-part with tuft on right (Row 1, #2)
      add(5, 1, hair.shadow, 7, 1);
      add(4, 2, hair.base, 9, 2);
      add(3, 3, hair.base, 2, 4);
      add(13, 3, hair.base, 2, 3);
      add(14, 4, hair.base, 1, 2); // Side tuft
      add(5, 3, hair.highlight, 7, 1);
      // Front bangs swept
      add(5, 4, hair.base, 3, 2);
      add(8, 4, hair.base, 4, 1);
      break;

    case 'bowl-cut':
      // Rounded bangs with slight side curl (Row 1, #3)
      add(5, 1, hair.shadow, 8, 1);
      add(4, 2, hair.base, 10, 2);
      add(3, 3, hair.base, 2, 5);
      add(13, 3, hair.base, 2, 5);
      add(5, 2, hair.highlight, 8, 1);
      // Bangs covering forehead neatly
      add(5, 4, hair.base, 8, 1);
      add(5, 5, hair.base, 7, 1);
      break;

    case 'slick-part':
      // Center-parted sleek hair showing center forehead (Row 1, #4)
      add(5, 1, hair.shadow, 8, 1);
      add(4, 2, hair.base, 10, 2);
      add(3, 3, hair.base, 2, 6);
      add(13, 3, hair.base, 2, 6);
      add(5, 2, hair.highlight, 8, 1);
      // Parted bangs left and right
      add(5, 4, hair.base, 3, 2);
      add(10, 4, hair.base, 3, 2);
      break;

    case 'top-bun':
      // High bun with bangs (Row 2, #1)
      add(2, 1, hair.shadow, 2, 2); // Cute bun on top-left
      add(2, 1, hair.highlight, 1, 1);
      add(5, 1, hair.shadow, 8, 1);
      add(4, 2, hair.base, 10, 2);
      add(3, 3, hair.base, 2, 5);
      add(13, 3, hair.base, 2, 5);
      add(5, 2, hair.highlight, 8, 1);
      // Bangs
      add(5, 4, hair.base, 8, 1);
      add(5, 5, hair.base, 4, 1);
      add(11, 5, hair.base, 2, 1);
      break;

    case 'bob-cut':
      // Rounded bob framing face down to neck (Row 2, #2)
      add(5, 1, hair.shadow, 8, 1);
      add(4, 2, hair.base, 10, 2);
      add(2, 4, hair.base, 3, 6); // Left bob volume
      add(13, 4, hair.base, 3, 6); // Right bob volume
      add(5, 2, hair.highlight, 8, 1);
      // Bangs
      add(5, 4, hair.base, 8, 1);
      add(5, 5, hair.base, 5, 1);
      break;

    case 'ponytail':
      // High ponytail on left side (Row 2, #3)
      add(2, 2, hair.shadow, 2, 7); // Ponytail drop
      add(2, 2, hair.highlight, 1, 4);
      add(5, 1, hair.shadow, 8, 1);
      add(4, 2, hair.base, 10, 2);
      add(3, 3, hair.base, 2, 5);
      add(13, 3, hair.base, 2, 5);
      add(5, 2, hair.highlight, 8, 1);
      // Bangs
      add(5, 4, hair.base, 8, 1);
      add(5, 5, hair.base, 4, 1);
      break;

    case 'long-wavy':
      // Long hair flaring outwards at bottom (Row 2, #4)
      add(5, 1, hair.shadow, 8, 1);
      add(4, 2, hair.base, 10, 2);
      add(3, 3, hair.base, 2, 6);
      add(13, 3, hair.base, 2, 6);
      add(1, 7, hair.base, 3, 3); // Left flare
      add(14, 7, hair.base, 3, 3); // Right flare
      add(5, 2, hair.highlight, 8, 1);
      // Bangs
      add(5, 4, hair.base, 8, 1);
      add(5, 5, hair.base, 3, 1);
      add(10, 5, hair.base, 3, 1);
      break;

    case 'short-neat':
    default:
      // Classic side-swept bangs (Row 1, #1)
      add(5, 1, hair.shadow, 8, 1);
      add(4, 2, hair.base, 10, 2);
      add(3, 3, hair.base, 2, 5);
      add(13, 3, hair.base, 2, 5);
      add(5, 2, hair.highlight, 8, 1);
      // Bangs
      add(5, 4, hair.base, 8, 1);
      add(5, 5, hair.base, 4, 1);
      add(11, 5, hair.base, 2, 1);
      break;
  }

  // 3. BODY & OUTFIT
  // Body Outline
  add(4, 13, outline, 10, 1);
  add(3, 14, outline, 1, 3);
  add(14, 14, outline, 1, 3);
  add(4, 17, outline, 10, 1);

  // Jacket / Shirt Base
  add(4, 14, cloth.jacket, 10, 3);
  add(4, 16, cloth.shadow, 10, 1);

  // White Shirt Collar
  add(7, 13, white, 2, 1);
  add(9, 13, white, 2, 1);

  // Necktie
  add(8, 14, cloth.tie, 2, 2);
  add(8, 16, cloth.tie, 2, 1);

  // Hands (tiny skin tone on each side)
  add(2, 14, outline, 1, 2);
  add(3, 14, skin.base, 1, 2);
  add(14, 14, skin.base, 1, 2);
  add(15, 14, outline, 1, 2);

  // Pants / Skirt
  add(4, 17, cloth.pants, 10, 1);
  add(5, 18, cloth.pants, 8, 1);

  // Legs & Shoes (Chibi 2 little legs with dark shoes)
  add(5, 19, outline, 3, 2);
  add(10, 19, outline, 3, 2);
  add(5, 19, cloth.shoes, 2, 2);
  add(11, 19, cloth.shoes, 2, 2);

  // 4. ACCESSORIES
  switch (accessory) {
    case 'cyber-headband':
      add(4, 4, '#00f0ff', 10, 1);
      add(8, 4, '#ffffff', 2, 1); // Center glow badge
      break;

    case 'glasses':
      add(5, 6, outline, 3, 2);
      add(10, 6, outline, 3, 2);
      add(8, 6, outline, 2, 1); // Bridge
      add(6, 7, '#38bdf8', 1, 1); // Lens glare
      add(11, 7, '#38bdf8', 1, 1);
      break;

    case 'cat-ears':
      add(3, 0, hair.shadow, 2, 2);
      add(4, 1, '#ff859d', 1, 1);
      add(13, 0, hair.shadow, 2, 2);
      add(13, 1, '#ff859d', 1, 1);
      break;

    case 'headset':
      add(2, 5, '#00f0ff', 2, 4); // Left earcup
      add(14, 5, '#00f0ff', 2, 4); // Right earcup
      add(4, 1, '#38bdf8', 10, 1); // Top band
      break;

    case 'none':
    default:
      break;
  }

  return (
    <div
      className={`inline-block select-none ${animate ? 'hover:scale-105 transition-transform duration-200' : ''} ${className}`}
      style={{
        width: size,
        height: (size * 22) / 18,
        imageRendering: 'pixelated',
      }}
    >
      <svg
        viewBox="0 0 18 22"
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
      >
        {pixels.map((p, idx) => (
          <rect
            key={idx}
            x={p.x}
            y={p.y}
            width={p.w || 1}
            height={p.h || 1}
            fill={p.fill}
          />
        ))}
      </svg>
    </div>
  );
};
