import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";

export const platformSettingsController = {
  getPlatformSettings: async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("platform_settings")
        .select("key, name, commission_percent")
        .eq("key", "site")
        .single();
      if (error) throw error;
      return res.json({ success: true, settings: data });
    } catch (err: any) {
      console.error("[PlatformSettings] get error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  updatePlatformSettings: async (req: Request, res: Response) => {
    try {
      const { name, commission_percent } = req.body;
      if (name === undefined && commission_percent === undefined) {
        return res.status(400).json({ error: "Nothing to update" });
      }

      const updates: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (commission_percent !== undefined) updates.commission_percent = commission_percent;

      const { error } = await supabaseAdmin
        .from("platform_settings")
        .upsert({ key: "site", ...updates }, { onConflict: "key" });
      if (error) throw error;
      return res.json({ success: true });
    } catch (err: any) {
      console.error("[PlatformSettings] update error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },
};
