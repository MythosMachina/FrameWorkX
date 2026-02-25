export type PresetStyle = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  negative_prompt: string;
};

const styles: PresetStyle[] = [
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Moody film still, soft contrast, subtle grain.",
    prompt: "cinematic still, moody lighting, soft contrast, film grain, shallow depth of field",
    negative_prompt: "anime, cartoon, CGI, text, watermark, harsh lighting, over-saturated"
  },
  {
    id: "clean-studio",
    name: "Clean Studio",
    description: "Bright studio light, crisp detail, neutral backdrop.",
    prompt: "studio lighting, clean background, crisp focus, high detail",
    negative_prompt: "blurry, grainy, lowres, oversaturated, messy background"
  },
  {
    id: "painterly",
    name: "Painterly",
    description: "Brush strokes, soft edges, artful texture.",
    prompt: "painterly style, visible brush strokes, textured canvas",
    negative_prompt: "photorealistic, sharp edges, plastic skin, 3d render"
  },
  {
    id: "photograph",
    name: "Photograph",
    description: "Natural lens look, realistic exposure.",
    prompt: "photograph, natural light, 50mm, realistic exposure, detailed skin",
    negative_prompt: "illustration, anime, 3d render, oversharpened, synthetic"
  },
  {
    id: "vintage-film",
    name: "Vintage Film",
    description: "Warm tones, slight fade, retro feel.",
    prompt: "vintage film look, warm tones, slight fade, subtle grain",
    negative_prompt: "modern digital look, ultra sharp, neon, glitch"
  },
  {
    id: "high-detail",
    name: "High Detail",
    description: "Ultra crisp detail, high clarity.",
    prompt: "ultra-detailed, sharp focus, micro-detail, high clarity",
    negative_prompt: "low detail, blur, soft focus, low quality"
  },
  {
    id: "soft-portrait",
    name: "Soft Portrait",
    description: "Gentle contrast, flattering skin tones.",
    prompt: "soft portrait lighting, gentle contrast, natural skin tones",
    negative_prompt: "harsh shadows, over-sharpened, gritty texture"
  },
  {
    id: "anime-polish",
    name: "Anime Polish",
    description: "Clean linework, vibrant stylization.",
    prompt: "anime style, clean linework, vibrant colors, high polish",
    negative_prompt: "photorealistic, muted palette, noisy texture"
  }
  ,
  {
    id: "pony",
    name: "Pony",
    description: "PonyDiffusion score ladder preset.",
    prompt: "score_9, score_8_up, score_7_up",
    negative_prompt: "score_6, score_5, score_4"
  }
];

const normalizePrompt = (value: string) => value.replace(/\{prompt\}/gi, "").trim();

export const presetStyles = styles.map((style) => ({
  ...style,
  prompt: normalizePrompt(style.prompt),
  negative_prompt: style.negative_prompt.trim()
}));

export const presetStylesById = presetStyles.reduce<Record<string, PresetStyle>>((acc, style) => {
  acc[style.id] = style;
  return acc;
}, {});

export const presetStylePublic = presetStyles.map(({ id, name, description }) => ({
  id,
  name,
  description
}));
