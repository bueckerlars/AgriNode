import { Sensor, SensorData } from '@/types/api';

const DB_NAME = 'agrinode';
const DB_VERSION = 1;
const SENSOR_STORE = 'sensors';
const SENSOR_DATA_STORE = 'sensorData';

export class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Error opening IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create sensors store
        if (!db.objectStoreNames.contains(SENSOR_STORE)) {
          const sensorStore = db.createObjectStore(SENSOR_STORE, { keyPath: 'sensor_id' });
          sensorStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // Create sensor data store
        if (!db.objectStoreNames.contains(SENSOR_DATA_STORE)) {
          const sensorDataStore = db.createObjectStore(SENSOR_DATA_STORE, { keyPath: ['sensor_id', 'timestamp'] });
          sensorDataStore.createIndex('sensor_id', 'sensor_id', { unique: false });
          sensorDataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async cacheSensors(sensors: Sensor[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(SENSOR_STORE, 'readwrite');
    const store = tx.objectStore(SENSOR_STORE);

    return Promise.all(sensors.map(sensor => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(sensor);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    })).then(() => undefined);
  }

  async getCachedSensors(): Promise<Sensor[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(SENSOR_STORE, 'readonly');
      const store = tx.objectStore(SENSOR_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheSensorData(sensorId: string, data: SensorData[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(SENSOR_DATA_STORE, 'readwrite');
    const store = tx.objectStore(SENSOR_DATA_STORE);

    return Promise.all(data.map(item => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put({ ...item, sensor_id: sensorId });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    })).then(() => undefined);
  }

  async getCachedSensorData(sensorId: string, startTime?: Date, endTime?: Date): Promise<SensorData[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(SENSOR_DATA_STORE, 'readonly');
      const store = tx.objectStore(SENSOR_DATA_STORE);
      const index = store.index('sensor_id');
      const request = index.getAll(IDBKeyRange.only(sensorId));

      request.onsuccess = () => {
        let data = request.result;
        if (startTime && endTime) {
          data = data.filter(item => {
            const timestamp = new Date(item.timestamp);
            return timestamp >= startTime && timestamp <= endTime;
          });
        }
        resolve(data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearCache(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction([SENSOR_STORE, SENSOR_DATA_STORE], 'readwrite');
    const sensorStore = tx.objectStore(SENSOR_STORE);
    const sensorDataStore = tx.objectStore(SENSOR_DATA_STORE);

    return Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = sensorStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = sensorDataStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]).then(() => undefined);
  }
}