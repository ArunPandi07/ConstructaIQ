import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';

const ACTIVE_MODEL_ID = 'google/gemma-4-26b-a4b-it';
const ACTIVE_MODEL_LABEL = 'Gemma 4 26B — Active';

interface UserSettings {
  model_preference: string;
  alert_weather_crane: boolean;
  alert_lumber_hedge: boolean;
}

const Settings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get<UserSettings>('/settings');
        setSettings({
          ...response.data,
          model_preference: ACTIVE_MODEL_ID,
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await apiClient.put('/settings', {
        ...settings,
        model_preference: ACTIVE_MODEL_ID,
      });
      // Optionally show a toast
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-stone-500" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">Settings</h1>
        <p className="text-stone-500 text-sm font-medium mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">AI Model Configuration</h2>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-stone-700">Construct-Model Credentials</label>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-xl border border-[#F5C518]/40 bg-[#F5C518]/10 px-4 py-2.5 text-sm font-bold text-stone-900">
              {ACTIVE_MODEL_LABEL}
            </span>
            <span className="text-xs font-semibold text-stone-400">{ACTIVE_MODEL_ID}</span>
          </div>
          <p className="text-xs font-semibold text-stone-400">
            This deployment uses a single configured model for all project blueprint analysis.
          </p>
        </div>
      </div>

      <div className="glass-card p-6 space-y-6">
        <h2 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">Site Alert Handlers</h2>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-bold text-stone-700">Critical Weather Crane Stop</label>
            <p className="text-xs font-semibold text-stone-400">Receive alerts when wind speeds exceed safe crane operational limits.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings?.alert_weather_crane || false}
              onChange={(e) => setSettings(prev => prev ? {...prev, alert_weather_crane: e.target.checked} : null)}
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F5C518]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F5C518]"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-bold text-stone-700">Lumber Price Index Hedge</label>
            <p className="text-xs font-semibold text-stone-400">Receive notifications for significant lumber commodity price fluctuations.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings?.alert_lumber_hedge || false}
              onChange={(e) => setSettings(prev => prev ? {...prev, alert_lumber_hedge: e.target.checked} : null)}
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F5C518]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F5C518]"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="px-6 py-2.5 bg-[#F5C518] text-black font-extrabold rounded-xl text-sm flex items-center hover:bg-[#e2b30d] transition disabled:opacity-50"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default Settings;
