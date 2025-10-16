import { z } from 'zod';

// Schema para el evento de usuario creado
export const userCreatedEventSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
  nationalityOrOrigin: z.string().min(1, 'nationalityOrOrigin es requerido'),
  roles: z.array(z.string()).min(1, 'roles debe tener al menos un elemento'),
  createdAt: z.string().datetime('createdAt debe ser una fecha ISO válida'),
});

// Tipo TypeScript derivado del schema
export type UserCreatedEvent = z.infer<typeof userCreatedEventSchema>;

// Función para validar el evento antes de enviarlo
export function validateUserCreatedEvent(data: unknown): UserCreatedEvent {
  return userCreatedEventSchema.parse(data);
}

// Función para crear un evento de usuario creado
export function createUserCreatedEvent(userData: {
  id: string;
  nacionalidad: string;
  rol: string;
  created_at: string;
}): UserCreatedEvent {
  return {
    userId: userData.id,
    nationalityOrOrigin: userData.nacionalidad,
    roles: [userData.rol], // Convertir rol único a array
    createdAt: userData.created_at,
  };
}

// Schema completo del mensaje Kafka (incluyendo metadatos)
export const kafkaUserMessageSchema = z.object({
  event_type: z.literal('users.user.created'),
  schema_version: z.literal('1.0'),
  payload: userCreatedEventSchema,
});

export type KafkaUserMessage = z.infer<typeof kafkaUserMessageSchema>;

// Función para crear el mensaje completo de Kafka
export function createKafkaUserMessage(userData: {
  id: string;
  nacionalidad: string;
  rol: string;
  created_at: string;
}): KafkaUserMessage {
  return {
    event_type: 'users.user.created',
    schema_version: '1.0',
    payload: createUserCreatedEvent(userData),
  };
}
