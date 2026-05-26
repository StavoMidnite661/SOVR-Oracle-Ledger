
import React, { useState } from 'react';
import { AppSettings } from '../types.js';
import { 
  Globe, 
  ShieldCheck, 
  Cpu, 
  Palette, 
  Activity, 
  Database, 
  Lock, 
  Clock,
  Layout,
  ExternalLink,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

type SettingsTab = 'general' | 'connectivity' | 'security' | 'appearance';

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setSaveMessage('');
    
    // Simulate API delay
    setTimeout(() => {
      setSettings(localSettings);
      setIsSaving(false);
      setSaveMessage('SYSTEM CONFIGURATION UPDATED');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 800);
  };

  const updateNestedSetting = (category: keyof AppSettings, key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof AppSettings],
        [key]: value
      }
    }));
  };

  const TabButton: React.FC<{ id: SettingsTab; icon: React.ReactNode; label: string }> = ({ id, icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-6 py-3 sm:py-4 border-b-2 transition-all duration-300 whitespace-nowrap ${
        activeTab === id
          ? 'border-sov-accent text-sov-accent bg-sov-accent/5'
          : 'border-transparent text-sov-light-alt hover:text-sov-light hover:bg-white/5'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-sov-dark-alt/50 border border-white/5 p-4 sm:p-6 rounded-2xl glass-panel relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu size={120} />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-sov-light tracking-tighter uppercase italic">System <span className="text-sov-primary">Orchestrator</span></h2>
              <p className="text-sov-light-alt text-xs uppercase tracking-widest opacity-60">Central Intelligence Configuration</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="text-right mr-2 sm:mr-4">
                <p className="text-[10px] font-bold text-sov-light-alt uppercase tracking-[0.2em]">Deployment State</p>
                <p className="text-xs font-black uppercase tracking-widest text-sov-green">
                  Production (Live)
                </p>
              </div>
              <div 
                className="p-3 rounded-xl border bg-sov-green/10 border-sov-green/50 text-sov-green"
              >
                <Activity size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-sov-dark-alt/50 border border-white/5 p-4 sm:p-6 rounded-2xl glass-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sov-light-alt mb-2">
              <Clock size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Global Timestamp</span>
            </div>
            <p className="text-xl font-mono text-sov-light">
              {new Date().toLocaleTimeString('en-GB', { 
                timeZone: localSettings.general.timezone === 'UTC' ? 'UTC' : localSettings.general.timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })} {localSettings.general.timezone === 'UTC' ? 'UTC' : localSettings.general.timezone.split('/').pop()?.replace('_', ' ')}
            </p>
          </div>
          <div className="pt-4 border-t border-white/5 mt-4 flex justify-between items-center">
             <span className="text-[10px] font-bold text-sov-light-alt uppercase tracking-widest">Kernel Hash</span>
             <span className="text-[10px] font-mono text-sov-accent">0x8F...E21A</span>
          </div>
        </div>
      </div>

      {/* Main Settings Interface */}
      <div className="bg-sov-dark-alt/30 border border-white/5 rounded-2xl overflow-hidden glass-panel">
        <div className="flex border-b border-white/5 bg-white/2 overflow-x-auto no-scrollbar">
          <TabButton id="general" icon={<Globe />} label="General" />
          <TabButton id="connectivity" icon={<Database />} label="Connectivity" />
          <TabButton id="security" icon={<ShieldCheck />} label="Security" />
          <TabButton id="appearance" icon={<Palette />} label="Appearance" />
        </div>

        <div className="p-4 sm:p-8 min-h-[400px]">
          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-2">Application Identifier</label>
                  <input 
                    type="text" 
                    value={localSettings.general.appName}
                    onChange={(e) => updateNestedSetting('general', 'appName', e.target.value)}
                    className="w-full bg-sov-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-sov-light focus:outline-none focus:border-sov-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-2">Legal Entity Header</label>
                  <input 
                    type="text" 
                    value={localSettings.general.organizationName}
                    onChange={(e) => updateNestedSetting('general', 'organizationName', e.target.value)}
                    className="w-full bg-sov-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-sov-light focus:outline-none focus:border-sov-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-2">Temporal Zone</label>
                  <select 
                    value={localSettings.general.timezone}
                    onChange={(e) => updateNestedSetting('general', 'timezone', e.target.value)}
                    className="w-full bg-sov-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-sov-light focus:outline-none focus:border-sov-accent/50 transition-colors"
                  >
                    <option value="UTC">UTC (Universal Coordinated)</option>
                    <optgroup label="North America">
                      <option value="America/New_York">Eastern Time (EST/EDT)</option>
                      <option value="America/Chicago">Central Time (CST/CDT)</option>
                      <option value="America/Denver">Mountain Time (MST/MDT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                      <option value="America/Anchorage">Alaska Time</option>
                      <option value="Pacific/Honolulu">Hawaii Time</option>
                    </optgroup>
                    <optgroup label="Europe & Africa">
                      <option value="Europe/London">London (GMT/BST)</option>
                      <option value="Europe/Paris">Paris (CET/CEST)</option>
                      <option value="Europe/Berlin">Berlin (CET/CEST)</option>
                      <option value="Africa/Cairo">Cairo</option>
                      <option value="Africa/Johannesburg">Johannesburg</option>
                    </optgroup>
                    <optgroup label="Asia & Oceania">
                      <option value="Asia/Dubai">Dubai</option>
                      <option value="Asia/Singapore">Singapore</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Shanghai">Shanghai</option>
                      <option value="Australia/Sydney">Sydney</option>
                      <option value="Australia/Perth">Perth</option>
                      <option value="Pacific/Auckland">Auckland</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-2">Chronological Format</label>
                  <input 
                    type="text" 
                    value={localSettings.general.dateFormat}
                    onChange={(e) => updateNestedSetting('general', 'dateFormat', e.target.value)}
                    className="w-full bg-sov-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-sov-light focus:outline-none focus:border-sov-accent/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'connectivity' && (
            <div className="max-w-2xl space-y-6 animate-fade-in">
              <div className="bg-sov-primary/5 border border-sov-primary/20 p-4 rounded-xl flex items-start space-x-4 mb-6">
                <div className="mt-1 text-sov-primary"><RefreshCw size={16} /></div>
                <div>
                  <p className="text-xs font-bold text-sov-primary uppercase tracking-widest mb-1">Blockchain Node Bridge</p>
                  <p className="text-[10px] text-sov-light-alt opacity-70 leading-relaxed uppercase">Updates to connectivity parameters will trigger a core re-synchronization with the smart contract integration layers.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-2">Ethereum RPC Provider (Web3)</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      value={localSettings.connectivity.rpcUrl}
                      onChange={(e) => updateNestedSetting('connectivity', 'rpcUrl', e.target.value)}
                      className="flex-1 bg-sov-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-sov-accent focus:outline-none focus:border-sov-accent/50 transition-colors"
                    />
                    <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-sov-light-alt hover:text-sov-light transition-colors"><ExternalLink size={16} /></button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-2">ConsulCreditsBridge Contract Address</label>
                  <input 
                    type="text" 
                    value={localSettings.connectivity.contractAddress}
                    onChange={(e) => updateNestedSetting('connectivity', 'contractAddress', e.target.value)}
                    className="w-full bg-sov-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-sov-primary focus:outline-none focus:border-sov-accent/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-2">REST Gateway API</label>
                    <input 
                      type="text" 
                      value={localSettings.connectivity.apiEndpoint}
                      onChange={(e) => updateNestedSetting('connectivity', 'apiEndpoint', e.target.value)}
                      className="w-full bg-sov-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-sov-light focus:outline-none focus:border-sov-accent/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-2">Websocket Stream Node</label>
                    <input 
                      type="text" 
                      value={localSettings.connectivity.websocketEndpoint}
                      onChange={(e) => updateNestedSetting('connectivity', 'websocketEndpoint', e.target.value)}
                      className="w-full bg-sov-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-sov-light focus:outline-none focus:border-sov-accent/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl space-y-8 animate-fade-in">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-sov-accent/10 text-sov-accent rounded-xl"><Lock size={20} /></div>
                  <div>
                    <p className="text-sm font-bold text-sov-light uppercase tracking-tight">Multi-Factor Biometrics</p>
                    <p className="text-[10px] text-sov-light-alt uppercase opacity-60">Require hardware key for signature authorization</p>
                  </div>
                </div>
                <button 
                  onClick={() => updateNestedSetting('security', 'mfaEnabled', !localSettings.security.mfaEnabled)}
                  className={`w-14 h-7 rounded-full transition-all duration-300 relative ${localSettings.security.mfaEnabled ? 'bg-sov-accent' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${localSettings.security.mfaEnabled ? 'left-8 shadow-[0_0_10px_white]' : 'left-1'}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em]">Session Authorization TTL</label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="range" 
                      min="5" 
                      max="120" 
                      step="5"
                      value={localSettings.security.sessionTimeout}
                      onChange={(e) => updateNestedSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="flex-1 accent-sov-accent"
                    />
                    <span className="text-sm font-bold text-sov-accent w-16">{localSettings.security.sessionTimeout}m</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em]">Audit Verbosity Level</label>
                  <div className="flex space-x-2">
                    {['Minimal', 'Standard', 'Full'].map((level) => (
                      <button
                        key={level}
                        onClick={() => updateNestedSetting('security', 'auditLevel', level)}
                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          localSettings.security.auditLevel === level
                            ? 'bg-sov-accent/20 border-sov-accent text-sov-accent'
                            : 'bg-white/5 border-white/10 text-sov-light-alt hover:text-sov-light'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-sov-red/10 border border-sov-red/20 p-6 rounded-2xl">
                <div className="flex items-center space-x-3 text-sov-red mb-3">
                  <AlertTriangle size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Compliance Lock</span>
                </div>
                <p className="text-[10px] text-sov-light-alt leading-relaxed uppercase opacity-80 mb-4">PCI_DSS Mandatory mode restricts card number visibility and enforces strict session policies across the centralized ledger.</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sov-light uppercase tracking-widest">Enforce PCI-DSS Hardmode</span>
                  <button 
                    onClick={() => updateNestedSetting('security', 'pciComplianceMode', !localSettings.security.pciComplianceMode)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      localSettings.security.pciComplianceMode 
                        ? 'bg-sov-red text-white' 
                        : 'bg-white/5 text-sov-light-alt border border-white/10'
                    }`}
                  >
                    {localSettings.security.pciComplianceMode ? 'ACTIVATED' : 'DEACTIVATED'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-2xl space-y-8 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'Glass', desc: 'HUD Transparency' },
                  { id: 'Dark', desc: 'Solid Midnight' },
                  { id: 'Minimal', desc: 'Clean Contrast' }
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateNestedSetting('appearance', 'theme', theme.id)}
                    className={`p-6 rounded-2xl border flex flex-col items-center text-center transition-all ${
                      localSettings.appearance.theme === theme.id
                        ? 'bg-sov-accent/10 border-sov-accent shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]'
                        : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="mb-4 text-sov-accent"><Layout size={32} /></div>
                    <p className="text-xs font-black text-sov-light uppercase tracking-widest mb-1">{theme.id}</p>
                    <p className="text-[10px] text-sov-light-alt uppercase">{theme.desc}</p>
                  </button>
                ))}
               </div>

               <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-sov-primary/10 text-sov-primary rounded-xl"><Palette size={20} /></div>
                  <div>
                    <p className="text-sm font-bold text-sov-light uppercase tracking-tight">Accent Tone Override</p>
                    <p className="text-[10px] text-sov-light-alt uppercase opacity-60">Primary visual frequency for the UI</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {['#22d3ee', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateNestedSetting('appearance', 'accentColor', color)}
                      className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        localSettings.appearance.accentColor === color ? 'border-white scale-125' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-white/5 bg-white/2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {isSaving ? (
              <div className="flex items-center space-x-2 text-sov-accent animate-pulse">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Kernel...</span>
              </div>
            ) : saveMessage ? (
              <div className="flex items-center space-x-2 text-sov-green">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{saveMessage}</span>
              </div>
            ) : (
               <div className="flex items-center space-x-2 text-sov-light-alt opacity-40">
                <Database size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pending Commit</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button 
              onClick={() => setLocalSettings(settings)}
              disabled={isSaving}
              className="px-4 sm:px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest text-sov-light-alt hover:text-sov-light transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center space-x-2 px-6 sm:px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                isSaving ? 'opacity-50 cursor-not-allowed' : 'bg-sov-accent text-sov-dark hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]'
              }`}
            >
              <Save size={14} />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

