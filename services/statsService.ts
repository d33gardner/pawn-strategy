
import { supabase } from './supabaseClient';

export interface UserStats {
    email: string;
    wins: number;
    losses: number;
    pawns_captured: number;
    pawns_lost: number;
    games_played: number;
}

export const StatsService = {
    /**
     * Fetches stats for a given email. 
     * If user doesn't exist, returns a default empty stats object (does not create row yet).
     */
    async getStats(email: string): Promise<UserStats | null> {
        if (!email) return null;

        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            // If code is PGRST116, it means no rows returned (new user)
            if (error.code !== 'PGRST116') {
                console.error('Error fetching stats:', error);
            }
            return {
                email,
                wins: 0,
                losses: 0,
                pawns_captured: 0,
                pawns_lost: 0,
                games_played: 0
            };
        }

        return data as UserStats;
    },

    /**
     * Updates (or creates) stats after a game.
     * We use 'upsert' to handle both new and existing users.
     */
    async recordGameResult(email: string, isWin: boolean, captured: number, lost: number) {
        if (!email) return;

        // 1. Get current stats to increment safely
        // (Ideally would use a stored procedure or atomic increment, but read-write is fine for this scale)
        const current = await this.getStats(email);
        if (!current) return;

        const newStats: UserStats = {
            email,
            wins: current.wins + (isWin ? 1 : 0),
            losses: current.losses + (isWin ? 0 : 1),
            pawns_captured: current.pawns_captured + captured,
            pawns_lost: current.pawns_lost + lost,
            games_played: current.games_played + 1
        };

        const { error } = await supabase
            .from('user_stats')
            .upsert(newStats); // upsert matches on Primary Key (email)

        if (error) {
            console.error('Error saving game stats:', error);
        } else {
            console.log('Stats saved successfully for', email);
        }
    }
};
