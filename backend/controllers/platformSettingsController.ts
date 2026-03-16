import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";

export const platformSettingsController = {
  getPlatformSettings: async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("site_settings")
        .select("key, website_name, commission, gcash_qr, paymaya_qr")
        .eq("key", "site")
        .single();
      if (error) throw error;
      return res.json({
        success: true,
        settings: {
          key: data.key,
          name: data.website_name,
          commission_percent: data.commission,
          gcash_qr: data.gcash_qr,
          paymaya_qr: data.paymaya_qr,
        },
      });
    } catch (err: any) {
      console.error("[PlatformSettings] get error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  updatePlatformSettings: async (req: Request, res: Response) => {
    try {
      const { name, commission_percent, gcash_qr, paymaya_qr } = req.body;
      if (
        name === undefined &&
        commission_percent === undefined &&
        gcash_qr === undefined &&
        paymaya_qr === undefined
      ) {
        return res.status(400).json({ error: "Nothing to update" });
      }

      const updates: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.website_name = name;
      if (commission_percent !== undefined) updates.commission = commission_percent;
      if (gcash_qr !== undefined) updates.gcash_qr = gcash_qr;
      if (paymaya_qr !== undefined) updates.paymaya_qr = paymaya_qr;

      const { error } = await supabaseAdmin
        .from("site_settings")
        .upsert({ key: "site", ...updates }, { onConflict: "key" });
      if (error) throw error;
      return res.json({ success: true });
    } catch (err: any) {
      console.error("[PlatformSettings] update error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },
};
