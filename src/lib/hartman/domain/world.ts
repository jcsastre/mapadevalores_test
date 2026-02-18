import { DimensionType, Dimension } from './dimension';

export interface WorldDimension {
  title: string;
  explanation: string;
}

export interface WorldDefinition {
  largeName: string;
  dimI: WorldDimension;
  dimE: WorldDimension;
  dimS: WorldDimension;
}

const worldDefinitions: Record<string, WorldDefinition> = {
  EXTERNAL: {
    largeName: 'Mundo Externo',
    dimI: { title: 'Empatía', explanation: 'Capacidad para reconocer la singularidad y el valor fundamental de cada persona; capacidad de amar y dejarse amar y entender los límites de las interacciones afectivas sin relaciones de dominio o dependencia. Empatía cognitiva, para comprender las ideas de otros; capacidad para valorar a los demás por su función social.' },
    dimE: { title: 'Juicio práctico', explanation: 'Capacidad para planear, organizar y ejecutar tareas, presentes y futuras. Capacidad de entender el orden y la funcionalidad de los objetos y procesos en tiempo real. Juicio positivo para leer el contexto como un campo de oportunidad para la acción.' },
    dimS: { title: 'Juicio normativo', explanation: 'Pensamiento conceptual para la comprensión de reglas, normas, teorías y el desarrollo de la cosmovisión, relación con la autoridad; capacidad de significar los sistemas y tener perspectiva de la totalidad.' },
  },
  INTERNAL: {
    largeName: 'Mundo Interno',
    dimI: { title: 'Autoestima', explanation: 'Comprensión de la singularidad del yo, sentido de autoafirmación, capacidad de autocuidado, reconocimiento de las necesidades personales y compromiso para atenderlas. Autoaceptación básica. Valorar el yo a partir de las actividades realizadas e independientemente de logros o fracasos. Capacidad para desarrollar un sentido de pertenencia.' },
    dimE: { title: 'Vocación y roles sociales', explanation: 'Capacidad de valorarse en los distintos roles sociales: hijo/ cónyuge, hermano, padre/madre/profesionista/creyente, etc., Capacidad para formar y elegir valores libremente en el desarrollo de la vocación y las funciones sociales, sumando pasos y procesos en tiempo lineal.' },
    dimS: { title: 'Autodirección y autodisciplina', explanation: 'Capacidad para desarrollar valores libremente elegidos en el diseño de la auto meta o misión para la autodirección. Normatividad Interna. Capacidad de ponerse metas personales y cumplirlas sin rigidez/per-feccionismo o pereza y laxitud.' },
  },
  SEXUAL: {
    largeName: 'Mundo Sexual',
    dimI: { title: 'Empatía', explanation: 'Entrega amorosa, dar y recibir afecto. Unión e intimidad. con ternura, gracia y empatía. Aspecto trascendente de la sexualidad, éxtasis del corazón. Acción de reunir el sexo con el amor en un romanticismo con imaginación. Capacidad para reconocer la singularidad del otro, detectando las sutilezas de la comunicación erótica; contacto de miradas, bromas y juegos íntimos. Dejarse amar y saber expresar lo que enciende la conexión sin inhibición en la entrega.' },
    dimE: { title: 'Descarga orgásmica/placer', explanation: 'La bioenergética consumada en el orgasmo físico sexual. Cognición encarnada de la función del placer reconociendo las sensaciones mutuas en cada fase del coito: cortejo, excitación, clímax, e integración en la paz. Se asume el impulso agresivo positivo del movimiento pélvico acelerado para alcanzar el orgasmo. Así el clímax sexual cumple su función bioenergética de liberación de tensiones físicas y emocionales para desarmar la rigidez corporal asumiendo el flujo instintivo sin temor ni represión.' },
    dimS: { title: 'Juicio normativo', explanation: 'Representa las teorías sexuales que se asumen, así como el conocimiento de las técnicas y el ritual sexual espacio temporal. Reconoce los límites y alcances de la práctica sexual, así como el mejoramiento de la destreza sexual y la evolución de los conceptos sexuales conforme madura el yo.' },
  },
};

export const World = {
  EXTERNAL: 'EXTERNAL',
  INTERNAL: 'INTERNAL',
  SEXUAL: 'SEXUAL',
} as const;

export type WorldType = (typeof World)[keyof typeof World];

export function getWorldLargeName(world: WorldType): string {
  return worldDefinitions[world].largeName;
}

export function getWorldDefinition(world: WorldType): WorldDefinition {
  return worldDefinitions[world];
}

export function getDimensionTitle(world: WorldType, dimension: DimensionType): string {
  const def = worldDefinitions[world];
  if (dimension === Dimension.INTRINSIC) return def.dimI.title;
  if (dimension === Dimension.EXTRINSIC) return def.dimE.title;
  if (dimension === Dimension.SISTEMIC) return def.dimS.title;
  return '';
}

export function getDimensionExplanation(world: WorldType, dimension: DimensionType): string {
  const def = worldDefinitions[world];
  if (dimension === Dimension.INTRINSIC) return def.dimI.explanation;
  if (dimension === Dimension.EXTRINSIC) return def.dimE.explanation;
  if (dimension === Dimension.SISTEMIC) return def.dimS.explanation;
  return '';
}
