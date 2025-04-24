import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import jwt from 'jsonwebtoken';
import { OllamaService } from '../services/OllamaService';
import http from 'http';
import { URL } from 'url';

// Singleton-Instanz des OllamaService
const ollamaService = new OllamaService();

interface OllamaWebSocketMessage {
  type: string;
  payload: any;
}

interface RegisterInstanceMessage {
  host: string;
  name: string;
  makeDefault?: boolean;
}

interface RemoveInstanceMessage {
  instanceId: string;
}

interface SetDefaultInstanceMessage {
  instanceId: string;
}

// Verbindungen mit Benutzerzuordnung speichern
const connections: Map<string, {
  ws: WebSocket, 
  userId: string,
  instanceIds: string[]
}> = new Map();

/**
 * WebSocket-Server für Ollama-Instanzen einrichten
 * @param wss WebSocketServer-Instanz
 * @param pathFilter Optional: Pfadfilter, um nur Verbindungen zu einem bestimmten Pfad zu akzeptieren
 */
export function setupWebSocketServer(wss: WebSocketServer, pathFilter?: string) {
  logger.info(`Setting up Ollama WebSocket server ${pathFilter ? `with path filter: ${pathFilter}` : 'without path filter'}`);

  wss.on('connection', async (ws: WebSocket, request: http.IncomingMessage) => {
    // URL-Pfad extrahieren, falls ein Pfadfilter angegeben ist
    if (pathFilter) {
      const path = request.url ? new URL(request.url, 'http://localhost').pathname : '/';
      if (path !== pathFilter) {
        // Ignoriere diese Verbindung, da sie von einem anderen Handler verarbeitet wird
        return;
      }
    }

    // Erstelle eine eindeutige ID für diese Verbindung
    const connectionId = uuidv4();
    
    // Initiale Authentifizierung noch ausstehend
    connections.set(connectionId, {
      ws,
      userId: '',
      instanceIds: []
    });

    logger.info(`New WebSocket connection established: ${connectionId}`);

    // Willkommensnachricht senden
    ws.send(JSON.stringify({
      type: 'welcome',
      payload: {
        message: 'Willkommen beim AgriNode Ollama WebSocket-Server',
        connectionId
      }
    }));

    // Nachrichtenverarbeitung
    ws.on('message', async (message: string) => {
      try {
        const data: OllamaWebSocketMessage = JSON.parse(message);
        const connection = connections.get(connectionId);

        if (!connection) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            payload: { 
              message: 'Verbindung nicht gefunden'
            } 
          }));
          return;
        }

        // Authentifizierung
        if (data.type === 'authenticate') {
          const token = data.payload?.token;
          if (!token) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              payload: { 
                message: 'Kein Authentifizierungstoken bereitgestellt'
              } 
            }));
            return;
          }

          try {
            // Überprüfe das JWT-Token
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const decodedToken = jwt.verify(token, secret) as { userId: string };
            
            // Aktualisiere die Verbindungsinformationen mit der Benutzer-ID
            connections.set(connectionId, {
              ...connection,
              userId: decodedToken.userId
            });

            // Sende die Liste der Instanzen des Benutzers
            const userInstances = ollamaService.getOllamaInstancesForUser(decodedToken.userId);
            
            ws.send(JSON.stringify({
              type: 'authenticated',
              payload: {
                userId: decodedToken.userId,
                message: 'Erfolgreich authentifiziert',
                instances: userInstances
              }
            }));
            
            logger.info(`WebSocket connection ${connectionId} authenticated for user ${decodedToken.userId}`);
          } catch (error) {
            logger.error('Authentication error:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              payload: { 
                message: 'Ungültiges Authentifizierungstoken'
              } 
            }));
          }
          return;
        }

        // Für alle anderen Nachrichten muss der Benutzer authentifiziert sein
        if (!connection.userId) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            payload: { 
              message: 'Nicht authentifiziert'
            } 
          }));
          return;
        }

        // Nachrichtentypen verarbeiten
        switch (data.type) {
          case 'registerInstance':
            await handleRegisterInstance(connectionId, connection, data.payload);
            break;
            
          case 'removeInstance':
            await handleRemoveInstance(connectionId, connection, data.payload);
            break;
            
          case 'setDefaultInstance':
            await handleSetDefaultInstance(connectionId, connection, data.payload);
            break;
          
          case 'checkInstanceConnection':
            await handleCheckInstanceConnection(connectionId, connection, data.payload);
            break;
            
          case 'listInstances':
            await handleListInstances(connectionId, connection);
            break;
            
          default:
            ws.send(JSON.stringify({ 
              type: 'error', 
              payload: { 
                message: 'Unbekannter Nachrichtentyp'
              } 
            }));
        }
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          payload: { 
            message: 'Fehler bei der Verarbeitung der Nachricht',
            details: (error as Error).message
          } 
        }));
      }
    });

    // Verbindung schließen
    ws.on('close', () => {
      logger.info(`WebSocket connection closed: ${connectionId}`);
      connections.delete(connectionId);
    });

    // Fehlerbehandlung
    ws.on('error', (error) => {
      logger.error(`WebSocket error for connection ${connectionId}:`, error);
    });
  });
}

/**
 * Registriert eine neue Ollama-Instanz für einen Benutzer
 */
async function handleRegisterInstance(connectionId: string, connection: any, payload: RegisterInstanceMessage) {
  try {
    const { ws, userId } = connection;

    // Validierung
    if (!payload.host || !payload.name) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { 
          message: 'Host und Name sind erforderlich'
        } 
      }));
      return;
    }

    // Instanz registrieren
    const instance = await ollamaService.registerOllamaInstance({
      userId,
      host: payload.host,
      name: payload.name,
      makeDefault: payload.makeDefault
    });

    // Instanz-ID zur Verbindung hinzufügen
    connection.instanceIds.push(instance.id);
    connections.set(connectionId, connection);

    ws.send(JSON.stringify({
      type: 'instanceRegistered',
      payload: {
        instance,
        message: 'Ollama-Instanz erfolgreich registriert'
      }
    }));
    
    logger.info(`Ollama instance registered for user ${userId}: ${instance.id} (${instance.name})`);
  } catch (error) {
    logger.error('Error registering Ollama instance:', error);
    connection.ws.send(JSON.stringify({ 
      type: 'error', 
      payload: { 
        message: 'Fehler bei der Registrierung der Ollama-Instanz',
        details: (error as Error).message
      } 
    }));
  }
}

/**
 * Entfernt eine Ollama-Instanz eines Benutzers
 */
async function handleRemoveInstance(connectionId: string, connection: any, payload: RemoveInstanceMessage) {
  try {
    const { ws, userId } = connection;

    // Validierung
    if (!payload.instanceId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { 
          message: 'Instance-ID ist erforderlich'
        } 
      }));
      return;
    }

    // Überprüfen, ob die Instanz diesem Benutzer gehört
    const instance = ollamaService.getOllamaInstance(payload.instanceId);
    if (!instance || instance.userId !== userId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { 
          message: 'Instanz nicht gefunden oder keine Berechtigung'
        } 
      }));
      return;
    }

    // Instanz entfernen
    const success = ollamaService.removeOllamaInstance(payload.instanceId);

    if (success) {
      // Instanz-ID aus der Verbindung entfernen
      connection.instanceIds = connection.instanceIds.filter((id: string) => id !== payload.instanceId);
      connections.set(connectionId, connection);

      ws.send(JSON.stringify({
        type: 'instanceRemoved',
        payload: {
          instanceId: payload.instanceId,
          message: 'Ollama-Instanz erfolgreich entfernt'
        }
      }));
      
      logger.info(`Ollama instance removed for user ${userId}: ${payload.instanceId}`);
    } else {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { 
          message: 'Fehler beim Entfernen der Ollama-Instanz'
        } 
      }));
    }
  } catch (error) {
    logger.error('Error removing Ollama instance:', error);
    connection.ws.send(JSON.stringify({ 
      type: 'error', 
      payload: { 
        message: 'Fehler beim Entfernen der Ollama-Instanz',
        details: (error as Error).message
      } 
    }));
  }
}

/**
 * Setzt eine Instanz als Standard für einen Benutzer
 */
async function handleSetDefaultInstance(connectionId: string, connection: any, payload: SetDefaultInstanceMessage) {
  try {
    const { ws, userId } = connection;

    // Validierung
    if (!payload.instanceId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { 
          message: 'Instance-ID ist erforderlich'
        } 
      }));
      return;
    }

    // Überprüfen, ob die Instanz diesem Benutzer gehört
    const instance = ollamaService.getOllamaInstance(payload.instanceId);
    if (!instance || instance.userId !== userId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { 
          message: 'Instanz nicht gefunden oder keine Berechtigung'
        } 
      }));
      return;
    }

    // Als Standard setzen
    const success = ollamaService.setUserDefaultInstance(userId, payload.instanceId);

    if (success) {
      // Alle aktualisierten Instanzen abrufen
      const userInstances = ollamaService.getOllamaInstancesForUser(userId);
      
      ws.send(JSON.stringify({
        type: 'defaultInstanceSet',
        payload: {
          instanceId: payload.instanceId,
          instances: userInstances,
          message: 'Standardinstanz erfolgreich gesetzt'
        }
      }));
      
      logger.info(`Default Ollama instance set for user ${userId}: ${payload.instanceId}`);
    } else {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { 
          message: 'Fehler beim Setzen der Standardinstanz'
        } 
      }));
    }
  } catch (error) {
    logger.error('Error setting default Ollama instance:', error);
    connection.ws.send(JSON.stringify({ 
      type: 'error', 
      payload: { 
        message: 'Fehler beim Setzen der Standardinstanz',
        details: (error as Error).message
      } 
    }));
  }
}

/**
 * Überprüft die Verbindung zu einer Ollama-Instanz
 */
async function handleCheckInstanceConnection(connectionId: string, connection: any, payload: { instanceId: string }) {
  try {
    const { ws, userId } = connection;

    // Validierung
    if (!payload.instanceId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { 
          message: 'Instance-ID ist erforderlich'
        } 
      }));
      return;
    }

    // Überprüfen, ob die Instanz diesem Benutzer gehört
    const instance = ollamaService.getOllamaInstance(payload.instanceId);
    if (!instance || instance.userId !== userId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { 
          message: 'Instanz nicht gefunden oder keine Berechtigung'
        } 
      }));
      return;
    }

    // Verbindung überprüfen
    const isConnected = await ollamaService.updateOllamaInstanceConnection(payload.instanceId);
    const updatedInstance = ollamaService.getOllamaInstance(payload.instanceId);

    ws.send(JSON.stringify({
      type: 'connectionStatus',
      payload: {
        instanceId: payload.instanceId,
        connected: isConnected,
        instance: updatedInstance,
        message: isConnected 
          ? 'Verbindung zur Ollama-Instanz erfolgreich hergestellt' 
          : 'Verbindung zur Ollama-Instanz konnte nicht hergestellt werden'
      }
    }));
    
    logger.info(`Ollama instance connection check for user ${userId}, instance ${payload.instanceId}: ${isConnected ? 'connected' : 'disconnected'}`);
  } catch (error) {
    logger.error('Error checking Ollama instance connection:', error);
    connection.ws.send(JSON.stringify({ 
      type: 'error', 
      payload: { 
        message: 'Fehler bei der Überprüfung der Ollama-Instanz-Verbindung',
        details: (error as Error).message
      } 
    }));
  }
}

/**
 * Listet alle Ollama-Instanzen eines Benutzers auf
 */
async function handleListInstances(connectionId: string, connection: any) {
  try {
    const { ws, userId } = connection;
    
    // Instanzen für diesen Benutzer abrufen
    const userInstances = ollamaService.getOllamaInstancesForUser(userId);

    ws.send(JSON.stringify({
      type: 'instancesList',
      payload: {
        instances: userInstances
      }
    }));
    
    logger.info(`Listed ${userInstances.length} Ollama instances for user ${userId}`);
  } catch (error) {
    logger.error('Error listing Ollama instances:', error);
    connection.ws.send(JSON.stringify({ 
      type: 'error', 
      payload: { 
        message: 'Fehler beim Abrufen der Ollama-Instanzen',
        details: (error as Error).message
      } 
    }));
  }
}