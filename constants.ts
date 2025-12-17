import { ProductStyle, ShotDefinition, SubjectType, AspectRatio } from './types';

// Common suffix for all prompts to enforce quality
const PRODUCT_QUALITY_SUFFIX = `
CRITICAL REQUIREMENTS:
- Product must be 100% accurate in shape, proportions, color, label, typography, and branding.
- Zero distortion, deformation, or product redesign.
- Clean separation between product and background.
- Professional studio lighting (soft, controlled, no harsh shadows).
- Editorial luxury advertising aesthetic.
- High-end commercial campaign quality. 4K resolution look.
`;

const HUMAN_QUALITY_SUFFIX = `
CRITICAL REQUIREMENTS:
- Subject must be 100% accurate in facial features, expression, and likeness.
- Zero distortion of anatomy, face, or hands.
- Skin texture must look natural and high-end retouch quality.
- Professional portrait lighting (Rembrandt, Butterfly, or Loop lighting).
- Editorial fashion aesthetic.
- High-end magazine cover quality. 4K resolution look.
`;

export const ASPECT_RATIOS: AspectRatio[] = [
  '1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'
];

export const PRODUCT_STYLES: ProductStyle[] = [
  ProductStyle.HERO,
  ProductStyle.MACRO,
  ProductStyle.LIQUID,
  ProductStyle.SCULPTURAL,
  ProductStyle.FLOATING,
  ProductStyle.SENSORY,
  ProductStyle.COLOR,
  ProductStyle.INGREDIENT,
  ProductStyle.SURREAL
];

export const HUMAN_STYLES: ProductStyle[] = [
  ProductStyle.MCU,
  ProductStyle.MS,
  ProductStyle.OS,
  ProductStyle.WS,
  ProductStyle.HA,
  ProductStyle.LA,
  ProductStyle.P,
  ProductStyle.ThreeQ,
  ProductStyle.B
];

export const SHOT_DEFINITIONS: Record<ProductStyle, ShotDefinition> = {
  // --- PRODUCT MODE STYLES ---
  [ProductStyle.HERO]: {
    id: ProductStyle.HERO,
    label: 'Iconic Hero',
    description: 'Definitive showcase with bold composition and commanding presence.',
    emotional: 'Authority, Desire, Aspiration',
    promptTemplate: `Create an iconic hero shot of the same [PRODUCT] with bold, striking composition. The subject must be 100% accurate—no distortion. Position as the clear hero with commanding presence. Minimal supporting elements if any. Clean white or sophisticated neutral background. Professional studio lighting with dramatic key light. Ultra-sharp focus, high dynamic range. Premium luxury advertising aesthetic. This is the definitive hero shot for brand campaigns.`
  },
  [ProductStyle.MACRO]: {
    id: ProductStyle.MACRO,
    label: 'Extreme Macro',
    description: 'High-magnification detail shot emphasizing texture and craftsmanship.',
    emotional: 'Intimacy, Precision, Quality',
    promptTemplate: `Create an extreme macro close-up detail shot of the same [PRODUCT] highlighting texture, finish, or fine details. Magnify the craftsmanship/features dramatically. Ultra-shallow depth of field with artistic blur. Raking light that emphasizes texture. The subject must be 100% accurate—no distortion. Sharp focus on the detail, everything else artistically blurred. Premium luxury aesthetic.`
  },
  [ProductStyle.LIQUID]: {
    id: ProductStyle.LIQUID,
    label: 'Dynamic Energy',
    description: 'High-speed capture with liquid splashes or particle interactions.',
    emotional: 'Energy, Freshness, Motion',
    promptTemplate: `Create a dynamic, energetic shot of the same [PRODUCT] with liquid splash, pour, or particle interaction. The subject must be 100% accurate and clearly recognizable—positioned as the anchor within the dynamic interaction. The elements should surround, complement, or interact naturally. Captured mid-action. Professional studio lighting revealing both detail and movement energy. High-speed photography effect suggesting dynamism. Editorial luxury aesthetic.`
  },
  [ProductStyle.SCULPTURAL]: {
    id: ProductStyle.SCULPTURAL,
    label: 'Sculptural Minimal',
    description: 'Geometric arrangement with abstract forms and strong shadows.',
    emotional: 'Balance, Modernity, Art',
    promptTemplate: `Create a minimal sculptural arrangement of the same [PRODUCT] surrounded by abstract geometric forms (blocks, spheres, planes, clean shapes). The subject must be 100% accurate and clearly recognizable as the focal point. Composition is extremely minimal with prominent negative space. Geometric precision in arrangement. Professional studio lighting emphasizing form and shadow. Strong geometric shadows creating depth. Monochromatic or controlled color palette. Editorial, design-focused aesthetic.`
  },
  [ProductStyle.FLOATING]: {
    id: ProductStyle.FLOATING,
    label: 'Anti-Gravity',
    description: 'Levitating composition suggesting lightness and innovation.',
    emotional: 'Innovation, Future, Uplift',
    promptTemplate: `Create a floating, weightless composition of the same [PRODUCT] appearing to levitate or float suspended. The subject must be 100% accurate and undistorted. Suggest innovation or ethereal quality through suspension in space. Supporting elements float around the subject creating sense of uplift and lightness. Professional studio lighting highlighting undersides and creating dimensional shadow suggesting ground distance. Clear or ethereal background. Contemporary, aspirational aesthetic.`
  },
  [ProductStyle.SENSORY]: {
    id: ProductStyle.SENSORY,
    label: 'Sensory Tactile',
    description: 'Intimate framing emphasizing material authenticity and touch.',
    emotional: 'Connection, Warmth, Tactility',
    promptTemplate: `Create a sensory, intimate close-up of the same [PRODUCT] emphasizing tactility and hyperreal authenticity. The subject must be 100% accurate. Frame the subject to suggest touchability and immediate desire. Close-up proximity making viewer feel connection. Features rendered in hyperreal detail. Warm, intimate studio lighting creating sensory appeal.`
  },
  [ProductStyle.COLOR]: {
    id: ProductStyle.COLOR,
    label: 'Color Concept',
    description: 'Scene built entirely around the subject\'s color palette.',
    emotional: 'Harmony, Identity, Mood',
    promptTemplate: `Create a color-driven conceptual scene of the same [PRODUCT] where the entire composition is built around the subject's color palette. Extract and amplify the primary colors, building a harmonious scene around this palette. The composition may be abstract or conceptual, but always anchored by the subject as the focal point. Color harmony is paramount—monochromatic, analogous, or color-blocked. Professional studio lighting emphasizing color saturation and richness.`
  },
  [ProductStyle.INGREDIENT]: {
    id: ProductStyle.INGREDIENT,
    label: 'Component Story',
    description: 'Symbolic arrangement of ingredients or materials.',
    emotional: 'Integrity, Nature, Source',
    promptTemplate: `Create an ingredient or component abstraction composition of the same [PRODUCT]. Extract and visually represent the key ingredients, materials, or elements that create this subject. Presentation is non-literal and symbolic—a conceptual arrangement. The subject must be 100% accurate and positioned as the hero result of these component elements. Abstract, artistic, sophisticated. Editorial luxury aesthetic.`
  },
  [ProductStyle.SURREAL]: {
    id: ProductStyle.SURREAL,
    label: 'Surreal Fusion',
    description: 'Dream-like fusion of realism and imagination.',
    emotional: 'Wonder, Magic, Uniqueness',
    promptTemplate: `Create a surreal yet elegant fusion scene featuring the same [PRODUCT] merged or blended with imaginative, dream-like elements that feel impossible yet visually elegant. The subject must be 100% accurate and clearly recognizable, but seamlessly integrated into this surreal fusion. Refined surrealism—not chaotic. Unexpected juxtapositions that create memorable visual impact. Grounded in photorealism. Rich color palette, saturated and dreamlike. Editorial luxury aesthetic.`
  },

  // --- HUMAN PORTRAIT MODE STYLES ---
  [ProductStyle.MCU]: {
    id: ProductStyle.MCU,
    label: 'Macro Close Up',
    description: 'Extreme facial detail, eye focus, expression capture',
    emotional: 'Intimacy, Vulnerability, Detail',
    promptTemplate: `Create a macro close-up shot of the same person showing extreme detail with professional studio lighting, sharp focus on facial features, and minimal background. Shallow depth of field with soft bokeh. Focus on eyes with perfect clarity. Skin texture and detail should be visible and flattering. Professional beauty photography style.`
  },
  [ProductStyle.MS]: {
    id: ProductStyle.MS,
    label: 'Medium Shot',
    description: 'Professional portrait standard, waist-up framing',
    emotional: 'Professional, Approachable, Confident',
    promptTemplate: `Create a medium shot showing the same person from waist up with clear detail. Professional portrait lighting setup with warm key light and subtle fill. Neutral background slightly out of focus. Subject should look confident and approachable. Studio photography quality with excellent skin tone and feature definition.`
  },
  [ProductStyle.OS]: {
    id: ProductStyle.OS,
    label: 'Over the Shoulder',
    description: 'Intimate perspective, relationship focus, 45-degree angle',
    emotional: 'Intimate, Engaging, Relatable',
    promptTemplate: `Create an over-the-shoulder perspective shot at approximately 45 degrees of the same person. Show the person's shoulder partially in frame on one side while their face is visible in three-quarter view. Professional lighting that wraps around the subject. Background slightly blurred but contextual. Intimate and engaging composition.`
  },
  [ProductStyle.WS]: {
    id: ProductStyle.WS,
    label: 'Wide Shot',
    description: 'Full-body with environment, storytelling composition',
    emotional: 'Contextual, Environmental, Storytelling',
    promptTemplate: `Create a full-body wide shot showing the same person with surrounding environment visible and contributing to composition. Cinematic framing with balanced depth. The person should be positioned following rule of thirds. Professional lighting that complements the setting. Rich color and environmental detail visible.`
  },
  [ProductStyle.HA]: {
    id: ProductStyle.HA,
    label: 'High Angle',
    description: 'From above looking down, vulnerable mood, contemplative',
    emotional: 'Vulnerable, Introspective, Humble',
    promptTemplate: `Create a high-angle shot from above at 45-60 degree angle, looking down at the same person with dramatic perspective. The person should appear vulnerable or contemplative. Top-lighting that creates dimension. Subject in lower frame position with space above. Professional lighting that emphasizes the downward perspective.`
  },
  [ProductStyle.LA]: {
    id: ProductStyle.LA,
    label: 'Low Angle',
    description: 'From below looking up, powerful/heroic mood, confident',
    emotional: 'Powerful, Heroic, Dominant',
    promptTemplate: `Create a low-angle shot from below looking up at the same person with powerful dramatic perspective. The person should appear confident and commanding. Upward-tilted camera creates heroic composition. Subject fills upper frame with sky or ceiling visible below. Dramatic lighting that emphasizes power and dominance.`
  },
  [ProductStyle.P]: {
    id: ProductStyle.P,
    label: 'Profile View',
    description: 'Pure 90-degree side view, classical silhouette',
    emotional: 'Classical, Defined, Structured',
    promptTemplate: `Create a pure profile view at 90-degree side angle showing the same person in clean silhouette. The profile should be sharp and well-defined showing complete side features from forehead to chin. Professional side-lighting that emphasizes facial structure and contours. One eye clearly visible with sharp focus. Neutral background creates clean profile separation.`
  },
  [ProductStyle.ThreeQ]: {
    id: ProductStyle.ThreeQ,
    label: 'Three-Quarter View',
    description: 'Most popular angle, natural dimensional perspective',
    emotional: 'Natural, Dimensional, Personable',
    promptTemplate: `Create a three-quarter angle view with the same person turned 45 degrees, showing approximately three-quarters of the face. Both eyes should be visible with natural dimensional appearance. Professional three-quarter lighting (Rembrandt style) with key light creating shadow triangle. Good cheekbone and jawline definition. Soft focus background. Warm skin tones and flattering facial positioning.`
  },
  [ProductStyle.B]: {
    id: ProductStyle.B,
    label: 'Back View',
    description: 'Back view, hair detail, movement, story',
    emotional: 'Mystery, Intrigue, Motion',
    promptTemplate: `Create a back view shot showing the same person from behind with body posture clearly visible. Full back including shoulders and head visible. Environmental context visible and contributing to story. Hair detail and texture visible. Professional lighting that emphasizes form and creates dimension. Backlighting or side-lighting creates rim light on edges. The back view creates sense of movement, mystery, or contemplation.`
  }
};

export const SUBJECT_CONFIGS = {
  [SubjectType.UNKNOWN]: {
    uiLabel: 'Auto-Detect',
    recommendations: ['System will attempt to identify the subject']
  },
  [SubjectType.PRODUCT]: {
    uiLabel: 'Product',
    recommendations: ['Optimized for inanimate objects', 'Preserves branding and geometry']
  },
  [SubjectType.HUMAN]: {
    uiLabel: 'Person',
    recommendations: ['Optimized for portraits and fashion', 'Preserves facial features']
  },
  [SubjectType.MIXED]: {
    uiLabel: 'Lifestyle',
    recommendations: ['Product in use', 'Balanced focus between person and object']
  }
};

export const getShotDefinition = (style: ProductStyle, subjectType: SubjectType = SubjectType.PRODUCT): ShotDefinition => {
  const def = SHOT_DEFINITIONS[style];
  
  // Determine if this is a human style or product style based on the ID itself
  const isHumanStyle = HUMAN_STYLES.includes(style);
  
  // Apply specific quality suffix based on the style set
  const suffix = isHumanStyle ? HUMAN_QUALITY_SUFFIX : PRODUCT_QUALITY_SUFFIX;

  return {
    ...def,
    promptTemplate: def.promptTemplate + suffix
  };
};