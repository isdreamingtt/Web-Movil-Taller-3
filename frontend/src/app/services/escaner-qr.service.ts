import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface EscanerQrPlugin {
  escanear(): Promise<{ valor?: string; cancelado: boolean }>;
}
const escaner = registerPlugin<EscanerQrPlugin>('EscanerQr');

@Injectable({ providedIn: 'root' })
export class EscanerQrService {
  readonly disponible = Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('EscanerQr');
  async escanear(): Promise<string | null> {
    if (!this.disponible) throw new Error('Escáner no disponible. Usa Android o ingresa el código manualmente.');
    const resultado = await escaner.escanear();
    return resultado.cancelado ? null : (resultado.valor ?? null);
  }
}

export function interpretarCodigoLista(valor: string): string | null {
  const coincidencia = /^(?:icpctracker:(?:lista|list):)?([a-f0-9]{32})$/i.exec(valor.trim());
  return coincidencia ? coincidencia[1].toLowerCase() : null;
}
