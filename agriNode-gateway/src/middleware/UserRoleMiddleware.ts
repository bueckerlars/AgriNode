import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

class UserRoleMiddleware {
  /**
   * Prüft, ob der authentifizierte Benutzer die erforderliche Rolle hat
   * @param requiredRole - Die erforderliche Rolle (standardmäßig 'admin')
   */
  checkRole(requiredRole: string = 'admin') {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Stellen sicher, dass der Benutzer authentifiziert ist
      if (!req.user) {
        logger.warn('Zugriff auf geschützte Route ohne Authentifizierung versucht');
        res.status(401).json({ message: 'Authentifizierung erforderlich' });
        return;
      }

      // Prüfen, ob der Benutzer die erforderliche Rolle hat
      if (req.user.role !== requiredRole) {
        logger.warn(`Benutzer ${req.user.id} hat versucht, auf Administratorfunktionen zuzugreifen`);
        res.status(403).json({ 
          message: `Zugriff verweigert. Benötigte Rolle: ${requiredRole}`
        });
        return;
      }

      // Wenn der Benutzer die erforderliche Rolle hat, fahren wir fort
      next();
    };
  }
}

export default new UserRoleMiddleware();