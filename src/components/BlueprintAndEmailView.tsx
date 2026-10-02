import React, { useState } from 'react';
import { Copy, Check, CheckSquare, Square } from 'lucide-react';

export const BlueprintAndEmailView: React.FC = () => {
  // 1. Petpooja API Access Email Generator State
  const [companyName, setCompanyName] = useState('Midnight Cravings Hospitality Pvt. Ltd.');
  const [outletCount, setOutletCount] = useState('42');
  const [adminEmail, setAdminEmail] = useState('ops@midnightcravings.in');
  const [contactPhone, setContactPhone] = useState('+91 98450 11200');
  const [cityName] = useState('Bengaluru');
  const [copiedEmail, setCopiedEmail] = useState(false);

  // 2. Monthly Cost Estimator State (in INR ₹)
  const [callsPerNightPerOutlet, setCallsPerNightPerOutlet] = useState<number>(45);
  const [activePilotOutlets, setActivePilotOutlets] = useState<number>(1);
  const [avgCallDurationMins, setAvgCallDurationMins] = useState<number>(1.8);
  const [voiceAiCostPerMinInr, setVoiceAiCostPerMinInr] = useState<number>(6.5);
  const [telephonyCostPerMinInr] = useState<number>(0.85);

  // 3. 10-Point Production Gap Checklist State
  const [checkedGaps, setCheckedGaps] = useState<Record<string, boolean>>({
    'gap-1': true,
    'gap-2': true,
    'gap-3': true,
    'gap-4': false,
    'gap-5': true,
    'gap-6': true,
    'gap-7': false,
    'gap-8': false,
    'gap-9': false,
    'gap-10': false,
  });

  const [selectedTelecomSetup, setSelectedTelecomSetup] = useState<'sim_forward' | 'direct_did' | 'sip_trunk'>('sim_forward');

  const costPerCallInr = avgCallDurationMins * (voiceAiCostPerMinInr + telephonyCostPerMinInr);
  const monthlyCallsTotal = callsPerNightPerOutlet * activePilotOutlets * 30;
  const monthlyTotalCostInr = Math.round(monthlyCallsTotal * costPerCallInr);

  const generatedEmailText = `Subject: Request for Petpooja Online Ordering API Credentials (Save Order & Menu Sync) — ${companyName} (${outletCount} Outlets)

Dear Petpooja API Integration & Partnerships Team,

We operate ${outletCount} restaurant outlets in ${cityName} under ${companyName} (Registered Petpooja Admin Email: ${adminEmail}) and currently use Petpooja POS for our billing, KOT printing, and GST reporting.

To handle our high-volume late-night phone delivery orders (11:00 PM to 03:00 AM), we are deploying an automated Cloud Telephony + Voice AI ordering bridge. Instead of staff manually punching phone orders into POS during peak rush, our server needs to pull live menu/stock states and push confirmed phone orders directly into Petpooja.

Please provision Sandbox and Production credentials for the Petpooja Online Ordering API for our account:
1. App Key (app_key), App Secret (app_secret), and Access Token (access_token)
2. Menu Fetch & Item/Addon/Variation ID Mapping webhook configuration
3. Save Order API (/save_order) endpoint access for Home Delivery orders (COD & Online UPI)
4. Item Stock In/Out & Store Open/Close webhook callbacks
5. Commercial terms (if any) for enabling API mapping across our 1 initial pilot outlet, scaling to all ${outletCount} outlets.

Technical Webhook Endpoint Domain: https://api.ratricall.in/webhooks/petpooja
Primary Contact: ${contactPhone} | ${adminEmail}

Thank you,
Operations & Technology Team
${companyName}`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generatedEmailText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const GAPS_LIST = [
    {
      id: 'gap-1',
      title: '01. Petpooja Online Ordering API Approval',
      detail: 'Request app_key, app_secret, and restID mapping from your Petpooja account manager before writing custom POS code.',
    },
    {
      id: 'gap-2',
      title: '02. SIM Call Forwarding to 10+ Channel Cloud SIP Trunk',
      detail: 'Set Call Forwarding Unconditional (*21*) on your existing SIM to an Exotel / Plivo / Twilio virtual DID number so 10+ calls run in parallel.',
    },
    {
      id: 'gap-3',
      title: '03. Menu Item, Variant & Add-on ID Mapping',
      detail: 'Map spoken Hinglish items ("Paneer Tikka Half") to exact Petpooja item_id and variation_id values.',
    },
    {
      id: 'gap-4',
      title: '04. Late-Night Address Pin Verification via WhatsApp',
      detail: 'Always read back the address on call AND trigger a WhatsApp Location Pin request for first-time callers.',
    },
    {
      id: 'gap-5',
      title: '05. Repeat Caller Phone Lookup Database',
      detail: 'Match incoming caller ID against saved customer profiles so repeat callers hear "Same address as last time?"',
    },
    {
      id: 'gap-6',
      title: '06. UPI Payment Link Webhook + COD Support',
      detail: 'Send Razorpay/Cashfree UPI payment links over WhatsApp/SMS and mark Petpooja payment_type as ONLINE once paid.',
    },
    {
      id: 'gap-7',
      title: '07. Live Stock-Out & Outlet Closing Sync',
      detail: 'Listen to Petpooja item toggle webhooks so the AI immediately stops accepting out-of-stock items at 1:30 AM.',
    },
    {
      id: 'gap-8',
      title: '08. Human Supervisor Transfer Fallback',
      detail: 'Route angry callers, delayed rider complaints, or refund queries directly to a night-shift human supervisor phone.',
    },
    {
      id: 'gap-9',
      title: '09. Rider Dispatch & Delivery Radius Rules',
      detail: 'Validate landmark distance against each outlet’s delivery radius (e.g. 6 km) and apply accurate delivery charges.',
    },
    {
      id: 'gap-10',
      title: '10. TRAI Regulations & Call Recording Disclosure',
      detail: 'Play a brief 2-second consent chime/notice ("This call is recorded to process your food order") compliant with Indian telecom rules.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Section 0: Interactive SIM Card & Cloud Telephony Technology Guide */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="text-xs text-amber-400 font-medium">
              00. Telecom Hardware &amp; SIM Technology Explained
            </div>
            <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
              What Type of SIM Card or Technology Takes 10+ Calls at Once?
            </h1>
            <p className="text-sm text-slate-400">
              A physical plastic SIM card inside a mobile phone cannot answer 10 calls at the same time. Instead, you combine your existing SIM with a <span className="text-slate-200 font-medium">Cloud Virtual Number (SIP Trunk / DID)</span>. Compare the 3 ways to set this up in India:
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setSelectedTelecomSetup('sim_forward')}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedTelecomSetup === 'sim_forward'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Existing SIM + Call Forwarding (Easiest)
            </button>
            <button
              onClick={() => setSelectedTelecomSetup('direct_did')}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedTelecomSetup === 'direct_did'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Cloud Virtual Number (No SIM Needed)
            </button>
            <button
              onClick={() => setSelectedTelecomSetup('sip_trunk')}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedTelecomSetup === 'sip_trunk'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Enterprise SIP Trunk (40+ Outlets)
            </button>
          </div>
        </div>

        {selectedTelecomSetup === 'sim_forward' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-amber-400 font-mono">What SIM You Use</div>
              <div className="text-sm font-semibold text-slate-100">
                Your Normal Airtel / Jio / Vi SIM Card
              </div>
              <p className="text-slate-400 leading-relaxed">
                Keep your current 10-digit mobile number that customers already know. Ensure it has an active unlimited voice plan (postpaid or commercial plan recommended so forwarding never runs out of balance at 1 AM).
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-emerald-400 font-mono">How It Connects to AI</div>
              <div className="text-sm font-semibold text-slate-100">
                Dial *21*&lt;Cloud_Number&gt;# on Your Phone
              </div>
              <p className="text-slate-400 leading-relaxed">
                You buy a Cloud Virtual Number from <span className="text-slate-200">Exotel, Tata Tele Smartflo, Airtel IQ, or Knowlarity</span>. Dialing <code className="text-amber-300">*21*08047192001#</code> forwards all incoming SIM calls straight to the cloud server before your phone even rings.
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-slate-300 font-mono">Best For</div>
              <div className="text-sm font-semibold text-slate-100">
                11 PM – 3 AM Rush Without Changing Your Number
              </div>
              <p className="text-slate-400 leading-relaxed">
                From 11 AM to 11 PM, staff can take calls normally (or forward only when busy using <code className="text-amber-300">*67*</code>). At 11 PM, turn on unconditional forwarding (<code className="text-amber-300">*21*</code>) so the AI handles 10+ calls at once.
              </p>
            </div>
          </div>
        )}

        {selectedTelecomSetup === 'direct_did' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-amber-400 font-mono">What Technology You Use</div>
              <div className="text-sm font-semibold text-slate-100">
                Virtual Mobile / Landline Number (DID)
              </div>
              <p className="text-slate-400 leading-relaxed">
                No physical SIM card or mobile handset is used at all. The number lives entirely in the data center of a cloud telephony provider (e.g., <span className="text-slate-200">+91 80 4719 2001</span> or a 10-digit virtual mobile number).
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-emerald-400 font-mono">Concurrency Capacity</div>
              <div className="text-sm font-semibold text-slate-100">
                10, 30, or 100 Simultaneous Calls on 1 Number
              </div>
              <p className="text-slate-400 leading-relaxed">
                Because there is no physical SIM bottleneck, 25 hungry customers can dial the exact same number at 1:30 AM and all 25 calls are answered in parallel on the first ring.
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-slate-300 font-mono">How Audio Reaches OpenAI / Gemini</div>
              <div className="text-sm font-semibold text-slate-100">
                WebSocket Voice Streaming (SIP / WebRTC)
              </div>
              <p className="text-slate-400 leading-relaxed">
                The cloud provider converts the phone call into a live internet audio stream (WebSocket PCM audio) and connects it directly to your AI server.
              </p>
            </div>
          </div>
        )}

        {selectedTelecomSetup === 'sip_trunk' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-amber-400 font-mono">What Technology You Use</div>
              <div className="text-sm font-semibold text-slate-100">
                Cloud SIP Trunking (Tata Tele / Airtel IQ / JioCX + LiveKit/Twilio)
              </div>
              <p className="text-slate-400 leading-relaxed">
                A commercial SIP Trunk gives you a pool of 40–100 virtual numbers (one per restaurant) and 30+ concurrent call channels under a single corporate KYC bill.
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-rose-400 font-mono">What to Avoid</div>
              <div className="text-sm font-semibold text-slate-100">
                Avoid Hardware GSM SIM Boxes / Gateways
              </div>
              <p className="text-slate-400 leading-relaxed">
                Never buy physical multi-SIM GSM gateway boxes. They violate TRAI regulations in India, get SIM cards blocked by operators, add 2–3 seconds of audio lag, and drop calls constantly.
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="text-emerald-400 font-mono">Documents Required in India</div>
              <div className="text-sm font-semibold text-slate-100">
                Standard Business KYC (2–3 Days Activation)
              </div>
              <p className="text-slate-400 leading-relaxed">
                Requires your cafe/company GST certificate, PAN, Incorporation/Shop Act license, and Authorized Signatory Aadhaar to activate commercial virtual numbers legally.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Section 1: Ready-to-Send Petpooja API Request Draft + Cost Calculator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Petpooja API Email Generator */}
        <div className="xl:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs text-amber-400 font-medium">
                01. Step-One Action Item
              </div>
              <h2 className="text-lg font-semibold text-slate-100 mt-0.5">
                Ready-to-Send Petpooja API Access Request Email
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize your cafe details below and send this to your Petpooja Account Manager or support@petpooja.com
              </p>
            </div>

            <button
              onClick={handleCopyEmail}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {copiedEmail ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedEmail ? 'Copied to Clipboard' : 'Copy Email Draft'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Company / Cafe Group Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Total Outlets on Petpooja</label>
              <input
                type="text"
                value={outletCount}
                onChange={(e) => setOutletCount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Registered Petpooja Admin Email</label>
              <input
                type="text"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Owner / Contact Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
              {generatedEmailText}
            </pre>
          </div>
        </div>

        {/* Right 5 Columns: Interactive Cost Calculator (in ₹ INR) */}
        <div className="xl:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <div className="text-xs text-emerald-400 font-medium">
              02. Unit Economics &amp; Telephony Cost Estimator (₹ INR)
            </div>
            <h2 className="text-lg font-semibold text-slate-100 mt-0.5">
              11:00 PM – 03:00 AM Voice AI Cost Calculator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Estimate per-call and monthly cost across your 2-week single-outlet pilot vs all 42 restaurants
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* One-Click Voice AI Engine Cost Presets */}
            <div>
              <div className="text-slate-300 mb-1.5">Select Voice AI Engine Stack (Auto-Sets ₹/min):</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setVoiceAiCostPerMinInr(18.5)}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    voiceAiCostPerMinInr === 18.5
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-100">OpenAI Flagship</div>
                  <div className="font-mono text-[11px] text-amber-300">~₹18.50 / min</div>
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceAiCostPerMinInr(4.5)}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    voiceAiCostPerMinInr === 4.5
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-100">OpenAI Mini</div>
                  <div className="font-mono text-[11px] text-emerald-400">~₹4.50 / min</div>
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceAiCostPerMinInr(2.2)}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    voiceAiCostPerMinInr === 2.2
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-100">Gemini Flash Live</div>
                  <div className="font-mono text-[11px] text-emerald-400">~₹2.20 / min</div>
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceAiCostPerMinInr(0.45)}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    voiceAiCostPerMinInr === 0.45
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-100">Groq LPU Pipeline</div>
                  <div className="font-mono text-[11px] text-emerald-400">~₹0.45 / min</div>
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceAiCostPerMinInr(0.25)}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    voiceAiCostPerMinInr === 0.25
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-100">Cloudflare Workers AI</div>
                  <div className="font-mono text-[11px] text-emerald-400">~₹0.25 / min (Free tier)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceAiCostPerMinInr(0.85)}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    voiceAiCostPerMinInr === 0.85
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-100">Self-Hosted GPU</div>
                  <div className="font-mono text-[11px] text-emerald-400">~₹0.85 / min</div>
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Active Outlets Deployed</span>
                <span className="font-mono text-amber-300 font-semibold tabular-nums">
                  {activePilotOutlets} {activePilotOutlets === 1 ? 'Pilot Outlet' : 'Outlets'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={42}
                value={activePilotOutlets}
                onChange={(e) => setActivePilotOutlets(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-0.5">
                <span>1 Outlet (2-Week Pilot)</span>
                <span>20 Outlets</span>
                <span>42 Outlets (Full Fleet)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Calls per Outlet per Night</span>
                <span className="font-mono text-slate-100 tabular-nums">{callsPerNightPerOutlet} calls/night</span>
              </div>
              <input
                type="range"
                min={10}
                max={150}
                step={5}
                value={callsPerNightPerOutlet}
                onChange={(e) => setCallsPerNightPerOutlet(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Average Call Duration</span>
                <span className="font-mono text-slate-100 tabular-nums">{avgCallDurationMins.toFixed(1)} mins</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={4.0}
                step={0.2}
                value={avgCallDurationMins}
                onChange={(e) => setAvgCallDurationMins(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Realtime Voice AI Cost / Min</span>
                <span className="font-mono text-slate-100 tabular-nums">₹{voiceAiCostPerMinInr.toFixed(2)} / min</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={22.0}
                step={0.25}
                value={voiceAiCostPerMinInr}
                onChange={(e) => setVoiceAiCostPerMinInr(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 text-xs font-mono tabular-nums">
            <div className="flex justify-between text-slate-400">
              <span>Cloud SIP Trunk + WhatsApp Reply / Min</span>
              <span>₹{telephonyCostPerMinInr.toFixed(2)} / min</span>
            </div>
            <div className="flex justify-between text-slate-200">
              <span>Estimated Cost per Completed Order Call</span>
              <span className="text-amber-300 font-semibold">₹{costPerCallInr.toFixed(2)} / call</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Calls Handled / Month ({activePilotOutlets} outlet{activePilotOutlets > 1 ? 's' : ''})</span>
              <span>{monthlyCallsTotal.toLocaleString('en-IN')} calls</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-semibold text-emerald-400">
              <span>Estimated Monthly Voice AI + SIP Bill</span>
              <span>₹{monthlyTotalCostInr.toLocaleString('en-IN')} / mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1.5: OpenAI vs Groq Voice-to-Voice Call Assistant Comparison */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 space-y-1.5">
          <div className="text-xs text-amber-400 font-medium">
            02A. OpenAI vs. Groq for Live Voice Call Assistants
          </div>
          <h2 className="text-lg font-semibold text-slate-100">
            Does Voice-to-Voice Work on Both? Architecture &amp; Exact Price Comparison
          </h2>
          <p className="text-xs text-slate-400 max-w-4xl">
            Both OpenAI and Groq can run a real-time phone call assistant with sub-second response times, but OpenAI uses a single native Speech-to-Speech model while Groq chains 3 ultra-fast models (Whisper STT + Llama 3.3 + TTS) on LPU chips at ~10x to 30x lower cost.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/50">
                <th className="py-3 px-5 font-medium">Feature / Cost Metric</th>
                <th className="py-3 px-5 font-medium">OpenAI Flagship (`gpt-4o-realtime`)</th>
                <th className="py-3 px-5 font-medium">OpenAI Mini (`gpt-4o-mini-realtime`)</th>
                <th className="py-3 px-5 font-medium">Groq Voice Stack (`Whisper + Llama 3.3 + TTS`)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  How Voice Works
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  Native Audio-to-Audio (1 single model listens &amp; speaks)
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  Native Audio-to-Audio (1 single smaller model)
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  3-Step LPU Pipeline (STT 120ms + LLM 130ms + TTS 150ms)
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  Response Speed (Latency)
                </td>
                <td className="py-3.5 px-5 font-mono text-slate-200 tabular-nums">
                  ~300ms – 450ms
                </td>
                <td className="py-3.5 px-5 font-mono text-slate-200 tabular-nums">
                  ~280ms – 400ms
                </td>
                <td className="py-3.5 px-5 font-mono text-emerald-400 tabular-nums">
                  ~400ms – 650ms (Feels like a real call)
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  AI Cost per Minute
                </td>
                <td className="py-3.5 px-5 font-mono text-rose-400 tabular-nums">
                  ~₹18.50 / min ($0.22/min)
                </td>
                <td className="py-3.5 px-5 font-mono text-amber-300 tabular-nums">
                  ~₹4.50 / min ($0.05/min)
                </td>
                <td className="py-3.5 px-5 font-mono text-emerald-400 font-semibold tabular-nums">
                  ~₹0.45 – ₹0.75 / min ($0.006/min)
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  Cost for 1 Order Call (2 mins)
                </td>
                <td className="py-3.5 px-5 font-mono text-rose-400 tabular-nums">
                  ~₹37.00 per call
                </td>
                <td className="py-3.5 px-5 font-mono text-amber-300 tabular-nums">
                  ~₹9.00 per call
                </td>
                <td className="py-3.5 px-5 font-mono text-emerald-400 font-semibold tabular-nums">
                  ~₹0.90 – ₹1.50 per call
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  1,500 Calls / Month (1 Pilot Cafe)
                </td>
                <td className="py-3.5 px-5 font-mono text-slate-300 tabular-nums">
                  ₹55,500 / month
                </td>
                <td className="py-3.5 px-5 font-mono text-slate-200 tabular-nums">
                  ₹13,500 / month
                </td>
                <td className="py-3.5 px-5 font-mono text-emerald-400 font-semibold tabular-nums">
                  ₹1,350 – ₹2,250 / month
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  30,000 Calls / Month (40+ Cafes)
                </td>
                <td className="py-3.5 px-5 font-mono text-rose-400 tabular-nums">
                  ₹11,10,000 / month
                </td>
                <td className="py-3.5 px-5 font-mono text-amber-300 tabular-nums">
                  ₹2,70,000 / month
                </td>
                <td className="py-3.5 px-5 font-mono text-emerald-400 font-semibold tabular-nums">
                  ₹27,000 – ₹45,000 / month
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  Hindi / Hinglish Accuracy
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  High (Understands interruptions &amp; emotion natively)
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  Good (Sometimes rushes long addresses)
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  High when paired with Indian TTS (Gemini Lite TTS / Sarvam / Azure `hi-IN`)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 1.6: Indian Cloud Telephony & Virtual Number Pricing Matrix */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 space-y-1.5">
          <div className="text-xs text-amber-400 font-medium">
            02B. How Indian Cloud Telephony Providers Charge for Virtual Numbers ("Virtual SIMs")
          </div>
          <h2 className="text-lg font-semibold text-slate-100">
            4-Part Billing Structure (Exotel, Tata Tele Smartflo, Airtel IQ, Plivo)
          </h2>
          <p className="text-xs text-slate-400 max-w-4xl">
            Unlike a regular ₹299 mobile recharge, commercial cloud telephony in India is billed across four components: virtual number rental, parallel call channels, per-minute audio streaming, and WhatsApp confirmation messages.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/50">
                <th className="py-3 px-5 font-medium">Billing Component</th>
                <th className="py-3 px-5 font-medium">How Companies Charge</th>
                <th className="py-3 px-5 font-medium">Typical India Rate (₹ INR)</th>
                <th className="py-3 px-5 font-medium">Notes for Your 11 PM – 3 AM Setup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  1. Virtual Number Rental (DID / VMN)
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  Fixed monthly rent per phone number
                </td>
                <td className="py-3.5 px-5 font-mono text-amber-300 tabular-nums whitespace-nowrap">
                  ₹150 – ₹500 / number / mo
                </td>
                <td className="py-3.5 px-5 text-slate-400">
                  Start with 1 number for your pilot (₹300/mo). Bulk pack of 40 numbers usually costs ₹4,000–₹6,000/mo total.
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  2. Parallel Channel / SIP Line Fee
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  Fixed monthly fee per simultaneous call capacity
                </td>
                <td className="py-3.5 px-5 font-mono text-amber-300 tabular-nums whitespace-nowrap">
                  ₹500 – ₹900 / channel / mo
                </td>
                <td className="py-3.5 px-5 text-slate-400">
                  For 10 simultaneous calls, a 10-channel Cloud SIP trunk (Tata Smartflo / Airtel IQ) costs roughly ₹5,000–₹8,500/mo (often includes free call minutes).
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  3. Inbound + WebSocket Audio Streaming
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  Per-minute pulse (30s or 60s billing) while call is live
                </td>
                <td className="py-3.5 px-5 font-mono text-amber-300 tabular-nums whitespace-nowrap">
                  ₹0.40 – ₹0.90 / minute
                </td>
                <td className="py-3.5 px-5 text-slate-400">
                  Incoming calls are normally free on SIP trunks, but streaming live bi-directional audio over WebSockets to AI adds ~₹0.40–₹0.75/min.
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  4. SIM Call Forwarding (Your SIM)
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  Charged by your SIM operator (Jio / Airtel / Vi)
                </td>
                <td className="py-3.5 px-5 font-mono text-emerald-400 tabular-nums whitespace-nowrap">
                  ₹0 (Included in Unlimited Plan)
                </td>
                <td className="py-3.5 px-5 text-slate-400">
                  Use a Postpaid Unlimited Voice SIM (₹399–₹499/mo) so forwarded calls don’t deduct per-minute talktime.
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-100 whitespace-nowrap">
                  5. Voice AI + WhatsApp Utility Message
                </td>
                <td className="py-3.5 px-5 text-slate-300">
                  Billed per minute by AI API + per message by Meta
                </td>
                <td className="py-3.5 px-5 font-mono text-amber-300 tabular-nums whitespace-nowrap">
                  ₹4.50 – ₹9.00 / min + ₹0.15 / msg
                </td>
                <td className="py-3.5 px-5 text-slate-400">
                  Voice AI is the main variable cost. Using cached menu prompts or Flash/Mini voice models keeps a 1.5-min call around ₹8–₹12 total.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: 10-Point Production Gap & Rollout Checklist */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs text-amber-400 font-medium">
              03. Production Gap &amp; Rollout Checklist
            </div>
            <h2 className="text-lg font-semibold text-slate-100 mt-0.5">
              10 Operational Gaps Solved in This Architecture
            </h2>
          </div>
          <div className="text-xs text-slate-400 font-mono tabular-nums">
            {Object.values(checkedGaps).filter(Boolean).length} of 10 Verified
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GAPS_LIST.map((gap) => {
            const isChecked = !!checkedGaps[gap.id];
            return (
              <button
                key={gap.id}
                onClick={() => setCheckedGaps((prev) => ({ ...prev, [gap.id]: !prev[gap.id] }))}
                className={`p-4 rounded-xl border text-left transition-colors flex items-start gap-3 cursor-pointer ${
                  isChecked
                    ? 'bg-slate-950/90 border-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-100">{gap.title}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{gap.detail}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
