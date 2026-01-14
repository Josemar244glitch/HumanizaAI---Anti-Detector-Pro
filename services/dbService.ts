
import Dexie, { Table } from 'dexie';
import { supabase, isSupabaseConfigured, saveToCloud } from './supabaseClient';
import { AppMode } from '../types';

export interface HistoryItem {
  id?: number; // Auto-incrementado pelo Dexie
  cloud_id?: string; // ID do Supabase se houver
  user_id: string;
  original_text: string;
  humanized_text: string;
  mode: string;
  created_at: string;
}

// Definição do Banco de Dados Local (IndexedDB)
export class HumanizaDatabase extends Dexie {
  history!: Table<HistoryItem>;

  constructor() {
    super('HumanizaProDB');
    // Fix: Use type assertion to ensure the version method is recognized by the compiler
    (this as Dexie).version(1).stores({
      history: '++id, user_id, cloud_id, mode, created_at'
    });
  }
}

export const localDb = new HumanizaDatabase();

export const dbService = {
  /**
   * Salva um registro. Prioriza LocalDB e tenta Cloud em background.
   */
  async saveRecord(userId: string, original: string, humanized: string, mode: AppMode): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // 1. Salvar no Banco Local (Funciona offline/sem config)
    await localDb.history.add({
      user_id: userId,
      original_text: original,
      humanized_text: humanized,
      mode,
      created_at: timestamp
    });

    // 2. Tentar salvar no Supabase (Nuvem)
    if (isSupabaseConfigured()) {
      await saveToCloud(userId, original, humanized, mode);
    }
  },

  /**
   * Busca histórico. Tenta Cloud primeiro se online, senão retorna Local.
   */
  async getHistory(userId: string): Promise<HistoryItem[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('humanization_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (!error && data) return data as HistoryItem[];
      } catch (e) {
        console.warn('Busca em nuvem falhou, usando banco local.');
      }
    }

    // Retorna do IndexedDB local
    return await localDb.history
      .where('user_id')
      .equals(userId)
      .reverse()
      .sortBy('created_at');
  },

  /**
   * Deleta um item de ambos os bancos
   */
  async deleteItem(id: number, cloudId?: string): Promise<boolean> {
    await localDb.history.delete(id);

    if (isSupabaseConfigured() && supabase && cloudId) {
      try {
        await supabase.from('humanization_history').delete().eq('id', cloudId);
      } catch (e) {
        console.error('Erro ao deletar na nuvem:', e);
      }
    }
    return true;
  },

  /**
   * Limpa todo o histórico
   */
  async clearAll(userId: string): Promise<boolean> {
    await localDb.history.where('user_id').equals(userId).delete();

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('humanization_history').delete().eq('user_id', userId);
      } catch (e) {
        console.error('Erro ao limpar nuvem:', e);
      }
    }
    return true;
  }
};
