// Builder for data/llm-providers.json
// Source: LLM_PROVIDERS_CATALOG (200-provider research, deduplicated to unique providers).
// Object literals (not positional tuples) so field order cannot break the data.
// Fields:
//   name, domain, isLLM(bool), type, gates(csv: cloudflare|captcha|card|phone|oauth|kyc; blank=none),
//   ease(0-100), freeTier, rpm, rpd, context, expiry, status(active|gated|trial|retired|beta|warning),
//   dealId (DevCheap deal id when one exists, else null)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RAW = [
  // Tier 0 — Zero Friction (Ease 100)
  { name: "BlockRun", domain: "blockrun.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 100, freeTier: "8 models unlimited, no throttle", rpm: "∞", rpd: "∞", context: "131K–256K", expiry: "Never", status: "active", dealId: null },
  { name: "Cerebras", domain: "inference.cerebras.ai", isLLM: true, type: "LLM", gates: "", ease: 100, freeTier: "quota ~1M tokens/day (≈$15/mo)", rpm: "5–30", rpd: "—", context: "8K (free)", expiry: "Daily refresh", status: "active", dealId: "cerebras" },
  { name: "Glhf.chat", domain: "glhf.chat", isLLM: true, type: "LLM-Gateway", gates: "", ease: 100, freeTier: "2 models unlimited", rpm: "∞", rpd: "∞", context: "131K", expiry: "Never", status: "warning", dealId: null },
  { name: "Google AI Studio", domain: "aistudio.google.com", isLLM: true, type: "LLM", gates: "", ease: 100, freeTier: "quota 15 RPM / 1.5K RPD (≈$20+/mo)", rpm: "5–30", rpd: "25–1,500", context: "1M–2M", expiry: "Permanent", status: "active", dealId: "google-ai-studio" },
  { name: "Groq", domain: "console.groq.com", isLLM: true, type: "LLM", gates: "", ease: 100, freeTier: "quota 30 RPM / 14.4K RPD (≈$15–50/mo)", rpm: "30–60", rpd: "250–14,400", context: "128K–131K", expiry: "Permanent", status: "active", dealId: "groq" },
  { name: "Hugging Face Inference", domain: "huggingface.co", isLLM: true, type: "LLM-Gateway", gates: "", ease: 100, freeTier: "$0.10/mo routing + serverless", rpm: "300/hr", rpd: "—", context: "128K", expiry: "Monthly reset", status: "active", dealId: "huggingface-providers" },
  { name: "Lepton AI", domain: "lepton.ai", isLLM: true, type: "LLM", gates: "", ease: 100, freeTier: "free tier available", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "OpenRouter", domain: "openrouter.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 100, freeTier: "25+ :free models, 50 RPD → 1K RPD after $10", rpm: "20", rpd: "50 (1K w/ $10)", context: "128K–262K", expiry: "Permanent", status: "active", dealId: "openrouter" },
  { name: "Pollinations AI", domain: "pollinations.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 100, freeTier: "unlimited, no auth", rpm: "—", rpd: "fair use", context: "128K", expiry: "Never", status: "active", dealId: null },
  { name: "bazaarlink", domain: "bazaarlink.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 100, freeTier: "instant key, no auth", rpm: "10", rpd: "130", context: "128K", expiry: "Never", status: "active", dealId: null },
  { name: "Deepgram", domain: "deepgram.com", isLLM: false, type: "STT/TTS", gates: "", ease: 100, freeTier: "$200 credit", rpm: "—", rpd: "—", context: "43K min Nova", expiry: "Never", status: "active", dealId: "deepgram" },
  { name: "AssemblyAI", domain: "assemblyai.com", isLLM: false, type: "STT", gates: "", ease: 100, freeTier: "$50 credit", rpm: "5 streams/min", rpd: "5 conc.", context: "185 hrs", expiry: "Best-effort", status: "active", dealId: "assemblyai" },
  { name: "GitHub Models", domain: "github.com", isLLM: true, type: "LLM-Gateway", gates: "", ease: 100, freeTier: "100+ models, generous daily", rpm: "15 RPM / 150–1K RPD", rpd: "—", context: "—", expiry: "—", status: "retired", dealId: "github-models" },

  // Tier 1 — Near-Zero Friction (Ease 95)
  { name: "Kilo Code Gateway", domain: "api.kilo.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 95, freeTier: "11 models, no key, per-IP", rpm: "3.3 (200/hr)", rpd: "per-IP", context: "64K–1M", expiry: "Never", status: "active", dealId: null },
  { name: "LLM7.io", domain: "api.llm7.io", isLLM: true, type: "LLM-Gateway", gates: "", ease: 95, freeTier: "500K/day anon → 1M/day w/ token", rpm: "10 (anon) / 40–120 (token)", rpd: "60–250/hr", context: "8K–1M", expiry: "Daily rolling", status: "active", dealId: null },
  { name: "OpenCode Zen", domain: "opencode.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 95, freeTier: "12 free models", rpm: "—", rpd: "—", context: "1M", expiry: "—", status: "active", dealId: null },
  { name: "ByteDance Volcengine", domain: "volcengine.com", isLLM: true, type: "LLM", gates: "oauth", ease: 95, freeTier: "500K tokens/30d per model", rpm: "10K (default) / 30K (Seed 2.0)", rpd: "—", context: "256K", expiry: "30 days", status: "active", dealId: null },

  // Tier 2 — Low Friction (Ease 90–94)
  { name: "Aleph Alpha", domain: "aleph-alpha.com", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "Alibaba Model Studio", domain: "dashscope.aliyun.com", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "1M tokens/90d + 70M signup (real-name)", rpm: "600–30K", rpd: "—", context: "128K–1M", expiry: "90 days", status: "gated", dealId: "alibaba-model-studio" },
  { name: "Anyscale", domain: "anyscale.com", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "Baseten", domain: "baseten.co", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "$30 implied (unpublished)", rpm: "—", rpd: "—", context: "128K", expiry: "30 days", status: "trial", dealId: "baseten" },
  { name: "DeepInfra", domain: "deepinfra.com", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "$5 signup (90d) + $5/mo recurring", rpm: "30/min", rpd: "—", context: "128K", expiry: "90 days", status: "active", dealId: null },
  { name: "DeepSeek", domain: "platform.deepseek.com", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "5M tokens/30d", rpm: "500–2,500 conc.", rpd: "—", context: "1M", expiry: "30 days", status: "active", dealId: null },
  { name: "Mistral AI", domain: "mistral.ai", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "~1B tokens/mo, 500K TPM", rpm: "60", rpd: "—", context: "128K–262K", expiry: "Permanent", status: "active", dealId: "mistral" },
  { name: "NVIDIA NIM", domain: "build.nvidia.com", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "40 RPM / 10K RPD, 1K–5K credits", rpm: "40 (shared)", rpd: "10K", context: "128K–1M", expiry: "Permanent", status: "gated", dealId: "nvidia-nim" },
  { name: "OpenAlchemy", domain: "openalchemy.io", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "SambaNova", domain: "sambanova.ai", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "free plan 20 RPM / 20 RPD / 200K TPD", rpm: "20", rpd: "20", context: "128K", expiry: "Permanent", status: "active", dealId: "sambanova-cloud" },
  { name: "Z.AI", domain: "open.bigmodel.cn", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "20M signup, 1 conc. req", rpm: "1 conc.", rpd: "~1K", context: "200K–1M", expiry: "Varies", status: "gated", dealId: null },
  { name: "agentrouter", domain: "agentrouter.org", isLLM: true, type: "LLM-Gateway", gates: "", ease: 90, freeTier: "email+password, optional verification_code", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "Nscale", domain: "nscale.com", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "free tier, fair use", rpm: "—", rpd: "fair use", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "AIML API", domain: "aimlapi.com", isLLM: true, type: "LLM-Gateway", gates: "", ease: 90, freeTier: "200+ models, free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "OVHcloud AI Endpoints", domain: "ai.cloud.ovh.net", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "2 RPM anon → 400 RPM auth", rpm: "2 (anon) / 400 (auth)", rpd: "—", context: "131K", expiry: "Never", status: "active", dealId: null },
  { name: "Puter", domain: "puter.com", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "free in-browser, no signup", rpm: "—", rpd: "—", context: "—", expiry: "Never", status: "active", dealId: null },
  { name: "NaraRouter", domain: "router.bynara.id", isLLM: true, type: "LLM-Gateway", gates: "", ease: 90, freeTier: "5M tokens/day, Google-only", rpm: "10", rpd: "—", context: "256K", expiry: "Daily 00:00 UTC", status: "active", dealId: null },
  { name: "Ollama Cloud", domain: "ollama.com", isLLM: true, type: "LLM-Gateway", gates: "", ease: 90, freeTier: "16 families, session limits", rpm: "session 5h / weekly 7d", rpd: "—", context: "128K–1M", expiry: "Session", status: "active", dealId: "ollama" },
  { name: "Hetzner Inference", domain: "hetzner.com", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "3M in / 60K out / 60s, 500M in / 5M out / 24h", rpm: "—", rpd: "—", context: "128K", expiry: "beta", status: "beta", dealId: "hetzner" },
  { name: "AnyAPI", domain: "anyapi.io", isLLM: true, type: "LLM-Gateway", gates: "", ease: 90, freeTier: "100K tokens/day, 400+ models", rpm: "—", rpd: "—", context: "128K", expiry: "Daily", status: "active", dealId: null },
  { name: "OrcaRouter", domain: "orcarouter.com", isLLM: true, type: "LLM-Gateway", gates: "", ease: 90, freeTier: "4 free models + orcarouter/free", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "ZeroLimitAI", domain: "zerolimit.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 90, freeTier: "lifetime free tier, model:'auto'", rpm: "—", rpd: "—", context: "128K", expiry: "Never", status: "active", dealId: null },
  { name: "Inference.net (free)", domain: "inference.net", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "fair use, DeepSeek-R1/Llama", rpm: "30", rpd: "fair use", context: "128K", expiry: "—", status: "active", dealId: "inference-net" },
  { name: "Nous Portal", domain: "nousresearch.com", isLLM: true, type: "LLM", gates: "", ease: 90, freeTier: "$0/mo, Hermes 4", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "Coze (ByteDance)", domain: "coze.com", isLLM: true, type: "LLM-Gateway", gates: "", ease: 90, freeTier: "token-based daily, GPT-4o/Gemini", rpm: "—", rpd: "—", context: "128K", expiry: "Daily", status: "active", dealId: null },
  { name: "Featherless AI", domain: "featherless.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 90, freeTier: "free tier, unlimited via HF", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },

  // Tier 3 — Medium-Low Friction (Ease 80–89)
  { name: "Aion Labs", domain: "aionlabs.ai", isLLM: true, type: "LLM", gates: "cloudflare", ease: 85, freeTier: "20K/day → 500 RPM after top-up", rpm: "15", rpd: "—", context: "128K", expiry: "Daily", status: "active", dealId: null },
  { name: "Dataloop", domain: "dataloop.ai", isLLM: true, type: "LLM", gates: "cloudflare", ease: 85, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "Jina AI", domain: "jina.ai", isLLM: true, type: "LLM", gates: "cloudflare", ease: 85, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "LightOn", domain: "lighton.ai", isLLM: true, type: "LLM", gates: "cloudflare", ease: 85, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "Moonshot AI (Kimi)", domain: "platform.moonshot.cn", isLLM: true, type: "LLM", gates: "captcha", ease: 85, freeTier: "Tier0 1 conc./3 RPM → Tier5 $3K", rpm: "3–10K", rpd: "1.5M TPD (free)", context: "128K–1M", expiry: "—", status: "active", dealId: null },
  { name: "OpenAI", domain: "platform.openai.com", isLLM: true, type: "LLM", gates: "cloudflare", ease: 85, freeTier: "$5 trial (inconsistent 2026)", rpm: "—", rpd: "—", context: "1M", expiry: "3 months", status: "trial", dealId: "openai-startup-credits" },
  { name: "SiliconFlow", domain: "siliconflow.cn", isLLM: true, type: "LLM", gates: "captcha", ease: 85, freeTier: "¥14 (~$1) + Qwen3-8B free", rpm: "1K (L0) → 10K (L5)", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: null },
  { name: "StepFun", domain: "platform.stepfun.com", isLLM: true, type: "LLM", gates: "captcha", ease: 85, freeTier: "¥10 credit, 5 conc.", rpm: "10 (V0) → 200K (V5)", rpd: "—", context: "256K", expiry: "—", status: "active", dealId: null },
  { name: "You.com", domain: "you.com", isLLM: true, type: "LLM", gates: "cloudflare", ease: 85, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "Baidu Qianfan", domain: "qianfan.cloud.baidu.com", isLLM: true, type: "LLM", gates: "phone", ease: 80, freeTier: "ERNIE Speed/Lite uncapped (real-name)", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: null },
  { name: "Fireworks AI", domain: "fireworks.ai", isLLM: true, type: "LLM", gates: "cloudflare,oauth", ease: 80, freeTier: "$1 starter + startup $5K–100K", rpm: "10 (no card) → 600 (card)", rpd: "—", context: "128K", expiry: "Until exhausted", status: "active", dealId: "fireworks" },
  { name: "Hyperbolic", domain: "hyperbolic.xyz", isLLM: true, type: "LLM", gates: "captcha,oauth", ease: 80, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: "hyperbolic" },
  { name: "OctoAI", domain: "octo.ai", isLLM: true, type: "LLM", gates: "phone", ease: 80, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "Replicate", domain: "replicate.com", isLLM: true, type: "LLM", gates: "cloudflare,oauth", ease: 80, freeTier: "limited free runs + $10 referral", rpm: "1/sec → 6/min (no billing)", rpd: "—", context: "128K", expiry: "12 months", status: "active", dealId: null },
  { name: "Together AI", domain: "together.ai", isLLM: true, type: "LLM", gates: "cloudflare,oauth", ease: 80, freeTier: "-Free suffix models free + $1 trial", rpm: "—", rpd: "free-tier models", context: "128K", expiry: "3 months", status: "trial", dealId: "together-ai" },
  { name: "Reka", domain: "reka.ai", isLLM: true, type: "LLM", gates: "", ease: 85, freeTier: "$10/mo recurring, 60 RPM", rpm: "60 (free) / 120 (pro)", rpd: "—", context: "128K", expiry: "Monthly refresh", status: "active", dealId: null },
  { name: "Agnes AI", domain: "agnes-ai.com", isLLM: true, type: "LLM", gates: "", ease: 85, freeTier: "20 actual RPM (text free)", rpm: "20 actual / 30 allowed", rpd: "—", context: "256K–1M", expiry: "—", status: "active", dealId: null },
  { name: "Chutes.ai", domain: "chutes.ai", isLLM: true, type: "LLM", gates: "", ease: 80, freeTier: "community retired → $3/mo base", rpm: "(was 200/day)", rpd: "—", context: "131K–1M", expiry: "—", status: "trial", dealId: "chutes" },
  { name: "Vercel AI Gateway", domain: "vercel.com", isLLM: true, type: "LLM-Gateway", gates: "", ease: 80, freeTier: "$5/mo free credits, BYOK", rpm: "dynamic", rpd: "—", context: "128K", expiry: "Monthly", status: "active", dealId: "vercel-ai-gateway" },
  { name: "Scaleway", domain: "scaleway.com", isLLM: true, type: "LLM", gates: "", ease: 80, freeTier: "1M tokens trial, card on file", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: "scaleway" },
  { name: "IBM watsonx.ai", domain: "ibm.com", isLLM: true, type: "LLM", gates: "", ease: 80, freeTier: "trial, Granite/Llama/Mistral", rpm: "dynamic", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: "ibm-cloud-startups" },
  { name: "Perplexity AI", domain: "perplexity.ai", isLLM: true, type: "LLM", gates: "cloudflare,captcha", ease: 80, freeTier: "50 RPM sonar API", rpm: "50", rpd: "5 deep + 3 pro/day", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "Stability AI", domain: "stability.ai", isLLM: false, type: "Image", gates: "cloudflare", ease: 85, freeTier: "25 credits/mo", rpm: "—", rpd: "25/mo", context: "—", expiry: "Monthly", status: "active", dealId: null },
  { name: "Ideogram", domain: "ideogram.ai", isLLM: false, type: "Image", gates: "cloudflare,captcha", ease: 80, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Leonardo AI", domain: "leonardo.ai", isLLM: false, type: "Image", gates: "", ease: 80, freeTier: "150 tokens/day", rpm: "—", rpd: "150/day", context: "—", expiry: "Daily", status: "active", dealId: null },
  { name: "DeepAI", domain: "deepai.org", isLLM: false, type: "Image", gates: "", ease: 80, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "GetImg.ai", domain: "getimg.ai", isLLM: false, type: "Image", gates: "cloudflare", ease: 85, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Jina Embeddings", domain: "jina.ai", isLLM: false, type: "Embeddings", gates: "cloudflare,captcha,phone", ease: 80, freeTier: "1M tokens free", rpm: "500", rpd: "—", context: "1M tokens", expiry: "—", status: "active", dealId: null },
  { name: "Voyage AI", domain: "voyageai.com", isLLM: false, type: "Embeddings", gates: "cloudflare", ease: 85, freeTier: "50M tokens free", rpm: "—", rpd: "—", context: "50M", expiry: "—", status: "active", dealId: null },
  { name: "Codeium", domain: "codeium.com", isLLM: false, type: "Code", gates: "cloudflare", ease: 85, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: "codeium" },
  { name: "Tabnine", domain: "tabnine.com", isLLM: false, type: "Code", gates: "cloudflare,captcha", ease: 80, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "SeekAPI.ai", domain: "seekapi.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 85, freeTier: "$0.50 credit, 1 RPM (Explorer)", rpm: "1 (free) / 30 (Growth)", rpd: "80M/billing", context: "128K", expiry: "7-day refund", status: "active", dealId: null },
  { name: "KKAPI", domain: "kkapi.cc", isLLM: true, type: "LLM-Gateway", gates: "", ease: 85, freeTier: "$0.20 trial, $1 min top-up", rpm: "—", rpd: "—", context: "128K", expiry: "Permanent", status: "active", dealId: null },
  { name: "kkiai.com (SynStar AI)", domain: "kkiai.com", isLLM: true, type: "LLM-Gateway", gates: "", ease: 85, freeTier: "no free tier, 3–12% bonus on top-up", rpm: "—", rpd: "per-token", context: "128K", expiry: "—", status: "active", dealId: null },

  // Tier 4 — Medium Friction (Ease 70–79)
  { name: "Anthropic", domain: "console.anthropic.com", isLLM: true, type: "LLM", gates: "cloudflare,captcha", ease: 70, freeTier: "~$5 one-time + startup $1K–100K", rpm: "—", rpd: "—", context: "200K", expiry: "12 months", status: "trial", dealId: "anthropic-claude-startups" },
  { name: "Cloudflare Workers AI", domain: "cloudflare.com", isLLM: true, type: "LLM", gates: "cloudflare,captcha", ease: 70, freeTier: "10K Neurons/day (shared)", rpm: "150–3K (task)", rpd: "—", context: "24K–131K", expiry: "Daily 00:00 UTC", status: "active", dealId: "cloudflare-workers-ai" },
  { name: "ModelScope", domain: "modelscope.cn", isLLM: true, type: "LLM", gates: "cloudflare,captcha", ease: 70, freeTier: "2K RPD total, ≤500/model", rpm: "dynamic", rpd: "2K total / 500/model", context: "256K", expiry: "—", status: "gated", dealId: null },
  { name: "TextCortex", domain: "textcortex.com", isLLM: true, type: "LLM", gates: "cloudflare,captcha", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "xAI (Grok)", domain: "x.ai", isLLM: true, type: "LLM", gates: "cloudflare,captcha", ease: 70, freeTier: "$25 signup + $150/mo w/ data-share", rpm: "—", rpd: "—", context: "2M", expiry: "Monthly", status: "trial", dealId: "xai-grok" },
  { name: "LeapMind", domain: "leapmind.ai", isLLM: true, type: "LLM", gates: "card", ease: 75, freeTier: "card required", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: null },
  { name: "Novita AI", domain: "novita.ai", isLLM: true, type: "LLM", gates: "card", ease: 75, freeTier: "$0.50 credit (was free)", rpm: "dynamic", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: "novita" },
  { name: "Qdrant", domain: "qdrant.tech", isLLM: false, type: "Embeddings", gates: "cloudflare,card", ease: 70, freeTier: "free tier, card", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "gated", dealId: null },
  { name: "Pinecone", domain: "pinecone.io", isLLM: false, type: "Embeddings", gates: "", ease: 70, freeTier: "free tier (Starter)", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Weaviate", domain: "weaviate.io", isLLM: false, type: "Embeddings", gates: "cloudflare", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Milvus", domain: "milvus.io", isLLM: false, type: "Embeddings", gates: "cloudflare", ease: 70, freeTier: "free tier (Zilliz)", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Supermaven", domain: "supermaven.com", isLLM: false, type: "Code", gates: "card", ease: 75, freeTier: "card required", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: null },
  { name: "Amazon Q", domain: "aws.amazon.com", isLLM: false, type: "Code", gates: "card,phone", ease: 70, freeTier: "free tier (Builder ID)", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: null },
  { name: "Kilo Code", domain: "kilocode.ai", isLLM: false, type: "Code", gates: "card", ease: 70, freeTier: "card required", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: null },
  { name: "Cursor", domain: "cursor.com", isLLM: false, type: "Code", gates: "cloudflare,captcha", ease: 70, freeTier: "free tier (2K completions)", rpm: "—", rpd: "2K", context: "128K", expiry: "Monthly", status: "active", dealId: null },
  { name: "Sourcegraph Cody", domain: "sourcegraph.com", isLLM: false, type: "Code", gates: "cloudflare", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "active", dealId: "cody" },
  { name: "Mixedbread", domain: "mixedbread.ai", isLLM: false, type: "Embeddings", gates: "", ease: 70, freeTier: "free tier (embeddings)", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "ImaginePro", domain: "imaginepro.ai", isLLM: false, type: "Image", gates: "", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Playground AI", domain: "playground.ai", isLLM: false, type: "Image", gates: "", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "NightCafe", domain: "nightcafe.studio", isLLM: false, type: "Image", gates: "cloudflare,captcha", ease: 70, freeTier: "free credits daily", rpm: "—", rpd: "daily", context: "—", expiry: "Daily", status: "active", dealId: null },
  { name: "Tensor.art", domain: "tensor.art", isLLM: false, type: "Image", gates: "cloudflare,captcha", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Civitai", domain: "civitai.com", isLLM: false, type: "Image", gates: "cloudflare,captcha", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "SeaArt", domain: "seaart.ai", isLLM: false, type: "Image", gates: "cloudflare", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "PixAI", domain: "pixai.art", isLLM: false, type: "Image", gates: "cloudflare,oauth,phone", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Krea AI", domain: "krea.ai", isLLM: false, type: "Image", gates: "cloudflare,captcha", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "ModelsLab", domain: "modelslab.com", isLLM: false, type: "Image", gates: "cloudflare,oauth,card", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "gated", dealId: null },
  { name: "Recraft", domain: "recraft.ai", isLLM: false, type: "Image", gates: "", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Freepik", domain: "freepik.com", isLLM: false, type: "Image", gates: "", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Cartesia", domain: "cartesia.ai", isLLM: false, type: "Speech", gates: "", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "ElevenLabs", domain: "elevenlabs.io", isLLM: false, type: "Speech", gates: "", ease: 70, freeTier: "free tier (10K chars/mo)", rpm: "—", rpd: "10K chars", context: "—", expiry: "Monthly", status: "active", dealId: "elevenlabs" },
  { name: "Fish Audio", domain: "fish.audio", isLLM: false, type: "Speech", gates: "cloudflare,oauth", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Resemble AI", domain: "resemble.ai", isLLM: false, type: "Speech", gates: "cloudflare,card", ease: 70, freeTier: "free tier, card", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "gated", dealId: null },
  { name: "Murf AI", domain: "murf.ai", isLLM: false, type: "Speech", gates: "cloudflare,phone", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "gated", dealId: null },
  { name: "PlayHT", domain: "play.ht", isLLM: false, type: "Speech", gates: "", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Gradium", domain: "gradium.ai", isLLM: false, type: "Speech", gates: "", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Lovo AI", domain: "lovo.ai", isLLM: false, type: "Speech", gates: "", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "WellSaid Labs", domain: "wellsaidlabs.com", isLLM: false, type: "Speech", gates: "cloudflare", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Speechify", domain: "speechify.com", isLLM: false, type: "Speech", gates: "cloudflare", ease: 70, freeTier: "free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },

  // Tier 5 — Gated (Ease 60–69)
  { name: "Inference.net", domain: "inference.net", isLLM: true, type: "LLM", gates: "cloudflare,card", ease: 60, freeTier: "card required", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: "inference-net" },
  { name: "upstage", domain: "upstage.ai", isLLM: true, type: "LLM", gates: "card", ease: 60, freeTier: "terms gate isTermAgreed=false", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: "upstage" },
  { name: "friendli", domain: "friendli.ai", isLLM: true, type: "LLM", gates: "", ease: 60, freeTier: "probed only", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "beta", dealId: null },
  { name: "cerebrium", domain: "cerebrium.ai", isLLM: true, type: "LLM", gates: "", ease: 60, freeTier: "probed only", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "beta", dealId: null },
  { name: "Nebius Token Factory", domain: "tokenfactory.nebius.com", isLLM: true, type: "LLM", gates: "card", ease: 60, freeTier: "$50 ($25+$25 Tavily) — card $0 pre-auth", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: "nebius-ai" },
  { name: "Tencent Hunyuan", domain: "cloud.tencent.com", isLLM: true, type: "LLM", gates: "phone,kyc", ease: 60, freeTier: "1M tokens/model, 1 year", rpm: "20/s mgmt", rpd: "—", context: "224K–1M", expiry: "1 year (2026-12-31)", status: "gated", dealId: null },
  { name: "iFlytek Spark", domain: "xfyun.cn", isLLM: true, type: "LLM", gates: "kyc", ease: 60, freeTier: "2M tokens, Lite free forever", rpm: "5", rpd: "—", context: "128K", expiry: "Varies", status: "gated", dealId: null },
  { name: "SenseNova", domain: "sensenova.cn", isLLM: true, type: "LLM", gates: "", ease: 65, freeTier: "1,500 calls/5h per model, 20 keys, free beta", rpm: "—", rpd: "1,500/5h", context: "256K–1M", expiry: "Beta", status: "beta", dealId: null },
  { name: "Huawei DevEco Code", domain: "deveco.huawei.com", isLLM: true, type: "LLM", gates: "kyc", ease: 60, freeTier: "GLM-5.1 unlimited, 50 RPM", rpm: "50", rpd: "∞", context: "202K", expiry: "Never", status: "gated", dealId: null },
  { name: "Alibaba Bailian", domain: "bailian.console.aliyun.com", isLLM: true, type: "LLM", gates: "kyc", ease: 60, freeTier: "70M tokens, 90d expiry", rpm: "600–30K", rpd: "—", context: "128K–1M", expiry: "90 days", status: "gated", dealId: "alibaba-model-studio" },
  { name: "Zhipu GLM (z.ai)", domain: "z.ai", isLLM: true, type: "LLM", gates: "kyc", ease: 60, freeTier: "20M signup, GLM-4.7-Flash free", rpm: "1 conc.", rpd: "~1K", context: "200K–1M", expiry: "Varies", status: "gated", dealId: null },
  { name: "Doubao (Volcengine)", domain: "volcengine.com", isLLM: true, type: "LLM", gates: "kyc", ease: 60, freeTier: "500K/30d per model", rpm: "10K–30K", rpd: "—", context: "256K", expiry: "30 days", status: "gated", dealId: null },
  { name: "Kimi K3", domain: "kimi.com", isLLM: true, type: "LLM", gates: "kyc", ease: 60, freeTier: "Tier0 1 conc., Tier1+ higher", rpm: "3 (free) → 10K", rpd: "1.5M", context: "1M", expiry: "—", status: "gated", dealId: null },
  { name: "MiniMax M2", domain: "minimax.io", isLLM: true, type: "LLM", gates: "cloudflare,card,phone,kyc", ease: 10, freeTier: "trial, M2.7 500 RPM", rpm: "500", rpd: "—", context: "205K–1M", expiry: "30 days", status: "gated", dealId: null },
  { name: "SiliconFlow L0", domain: "siliconflow.cn", isLLM: true, type: "LLM", gates: "kyc", ease: 60, freeTier: "¥14, Qwen3-8B free", rpm: "1K → 10K", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: null },
  { name: "LiteLLM", domain: "litellm.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 65, freeTier: "self-hosted, 100+ LLMs, unlimited", rpm: "∞", rpd: "∞", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Portkey AI", domain: "portkey.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 65, freeTier: "gateway, community+enterprise", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "9Router", domain: "9router.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 65, freeTier: "40+ providers, 2–4x token compression", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "AIML API (2)", domain: "aimlapi.com", isLLM: true, type: "LLM-Gateway", gates: "", ease: 65, freeTier: "200+ models, free tier", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "OmniRoute", domain: "omniroute.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 65, freeTier: "250+ providers, 90+ free", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: null },
  { name: "Scaleway Generative", domain: "scaleway.com", isLLM: true, type: "LLM", gates: "card", ease: 60, freeTier: "1M tokens trial, card on file", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: "scaleway" },
  { name: "Upstash Vector", domain: "upstash.com", isLLM: false, type: "Embeddings", gates: "cloudflare", ease: 65, freeTier: "free tier (vector)", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "active", dealId: "upstash" },

  // Tier 6 — Hard-Gated (Ease 40–59)
  { name: "ai21", domain: "ai21.com", isLLM: true, type: "LLM", gates: "kyc", ease: 50, freeTier: "entitlement gate: email isn't allowed", rpm: "—", rpd: "—", context: "256K", expiry: "—", status: "gated", dealId: "ai21" },
  { name: "fastrouter", domain: "fastrouter.ai", isLLM: true, type: "LLM-Gateway", gates: "captcha,card", ease: 30, freeTier: "captcha + credit gate >$1 balance", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: null },
  { name: "nemorouter", domain: "nrouter.ai", isLLM: true, type: "LLM-Gateway", gates: "card", ease: 40, freeTier: "card required (Stripe)", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: null },
  { name: "DeepSeek 5M", domain: "platform.deepseek.com", isLLM: true, type: "LLM", gates: "", ease: 50, freeTier: "5M/30d, peak 2× off-peak", rpm: "500–2,500 conc.", rpd: "—", context: "1M", expiry: "30 days", status: "active", dealId: null },
  { name: "Kimi Tier0", domain: "platform.moonshot.cn", isLLM: true, type: "LLM", gates: "kyc", ease: 50, freeTier: "1 conc. / 3 RPM / 500K TPM free", rpm: "3", rpd: "—", context: "1M", expiry: "—", status: "gated", dealId: null },
  { name: "SiliconFlow unverified", domain: "siliconflow.cn", isLLM: true, type: "LLM", gates: "kyc", ease: 50, freeTier: "100 req/day unverified → 10K RPM verified", rpm: "1K (verified)", rpd: "100/day (unverified)", context: "128K", expiry: "—", status: "gated", dealId: null },
  { name: "MiniMax trial", domain: "minimax.io", isLLM: true, type: "LLM", gates: "kyc", ease: 50, freeTier: "trial credits, 200–500 RPM", rpm: "200–500", rpd: "—", context: "205K–1M", expiry: "30 days", status: "trial", dealId: null },
  { name: "Together paid", domain: "together.ai", isLLM: true, type: "LLM", gates: "cloudflare,oauth", ease: 50, freeTier: "$1–25 trial, startup $15K–50K", rpm: "—", rpd: "200+ models", context: "128K", expiry: "3–12 months", status: "trial", dealId: "together-ai" },
  { name: "Fireworks $1", domain: "fireworks.ai", isLLM: true, type: "LLM", gates: "cloudflare", ease: 50, freeTier: "$1 starter (10 RPM → 600 RPM w/ card)", rpm: "10 → 600", rpd: "—", context: "128K", expiry: "Until exhausted", status: "trial", dealId: "fireworks" },
  { name: "Baseten $30", domain: "baseten.co", isLLM: true, type: "LLM", gates: "", ease: 50, freeTier: "$30 signup + $25K startup", rpm: "—", rpd: "—", context: "128K", expiry: "30 days / 6 mo", status: "trial", dealId: "baseten" },
  { name: "Nebius $50", domain: "nebius.com", isLLM: true, type: "LLM", gates: "card", ease: 50, freeTier: "$50 ($25+$25 Tavily), card $0 pre-auth", rpm: "—", rpd: "—", context: "128K", expiry: "—", status: "gated", dealId: "nebius-ai" },
  { name: "Modal $30", domain: "modal.com", isLLM: true, type: "LLM", gates: "card", ease: 50, freeTier: "$30/mo free plan + startup $5K–25K", rpm: "—", rpd: "—", context: "—", expiry: "30 days / 12 mo", status: "trial", dealId: "modal" },
  { name: "Cohere card", domain: "cohere.com", isLLM: true, type: "LLM", gates: "cloudflare,oauth,card,kyc", ease: 40, freeTier: "1K calls/mo trial, card at upgrade", rpm: "20", rpd: "1K/mo", context: "128K", expiry: "Monthly", status: "trial", dealId: "cohere" },
  { name: "xAI data-share", domain: "x.ai", isLLM: true, type: "LLM", gates: "", ease: 50, freeTier: "$25 + $150/mo w/ data-share, else paid", rpm: "—", rpd: "—", context: "2M", expiry: "Monthly", status: "trial", dealId: "xai-grok" },
  { name: "SeekAPI.ai (2)", domain: "seekapi.ai", isLLM: true, type: "LLM-Gateway", gates: "", ease: 50, freeTier: "$0.50 free (Explorer 1 RPM)", rpm: "1 (free) → 100+", rpd: "80M–400M/cycle", context: "128K", expiry: "60–90d rollover", status: "active", dealId: null },
  { name: "KKAPI (2)", domain: "kkapi.cc", isLLM: true, type: "LLM-Gateway", gates: "", ease: 50, freeTier: "$0.20 trial", rpm: "—", rpd: "—", context: "128K", expiry: "Permanent", status: "active", dealId: null },
  { name: "kkiai.com (2)", domain: "kkiai.com", isLLM: true, type: "LLM-Gateway", gates: "", ease: 50, freeTier: "no free tier (3–12% bonus)", rpm: "—", rpd: "per-token", context: "128K", expiry: "—", status: "active", dealId: null },
  { name: "kktoken.cc", domain: "kktoken.cc", isLLM: true, type: "LLM-Gateway", gates: "", ease: 50, freeTier: "minimal public info", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "gated", dealId: null },

  // Tier 7 — Startup Programs (Ease 25–59)
  { name: "Anthropic Startup", domain: "claude.com", isLLM: true, type: "LLM", gates: "cloudflare", ease: 40, freeTier: "$1K base → $100K top via VC", rpm: "—", rpd: "—", context: "200K", expiry: "12 months", status: "trial", dealId: "anthropic-claude-startups" },
  { name: "Google for Startups", domain: "cloud.google.com", isLLM: true, type: "LLM", gates: "card", ease: 30, freeTier: "$2K (pre-funded) → $350K (AI tier)", rpm: "—", rpd: "Gemini/Gemma", context: "1M", expiry: "12–24 mo", status: "trial", dealId: "google-cloud-startups" },
  { name: "AWS Activate", domain: "aws.amazon.com", isLLM: true, type: "LLM", gates: "card,phone", ease: 25, freeTier: "$1K (Founders) → $200K (Portfolio)", rpm: "—", rpd: "Bedrock", context: "200K", expiry: "24 mo", status: "trial", dealId: "aws-activate" },
  { name: "Microsoft for Startups", domain: "microsoft.com", isLLM: true, type: "LLM", gates: "card", ease: 30, freeTier: "$5K (no VC) → $150K (VC)", rpm: "—", rpd: "Azure OpenAI", context: "128K", expiry: "24 mo", status: "trial", dealId: "microsoft-for-startups" },
  { name: "Together Accelerator", domain: "together.ai", isLLM: true, type: "LLM", gates: "cloudflare", ease: 40, freeTier: "$15K (≤$5M) → $50K (>$10M)", rpm: "—", rpd: "200+ models", context: "128K", expiry: "12 mo", status: "trial", dealId: "together-ai" },
  { name: "Baseten Startup", domain: "baseten.co", isLLM: true, type: "LLM", gates: "", ease: 50, freeTier: "$25K + $2.5K Model APIs", rpm: "—", rpd: "—", context: "128K", expiry: "6 mo", status: "trial", dealId: "baseten" },
  { name: "Modal Startup", domain: "modal.com", isLLM: true, type: "LLM", gates: "card", ease: 50, freeTier: "$5K (bootstrapped) → $25K (Seed–A)", rpm: "—", rpd: "—", context: "—", expiry: "12 mo", status: "trial", dealId: "modal" },
  { name: "RunPod", domain: "runpod.io", isLLM: false, type: "GPU", gates: "card", ease: 50, freeTier: "$1K (Starter) → $25K bonus on $50K commit", rpm: "—", rpd: "Pods/Serverless", context: "—", expiry: "12 mo", status: "trial", dealId: null },
  { name: "Fireworks Ignite", domain: "fireworks.ai", isLLM: true, type: "LLM", gates: "", ease: 50, freeTier: "$5K–10K (typical) → $100K (L3 >$10M)", rpm: "—", rpd: "50+ models", context: "128K", expiry: "12 mo", status: "trial", dealId: "fireworks" },
  { name: "IBM for Startups", domain: "ibm.com", isLLM: true, type: "LLM", gates: "", ease: 40, freeTier: "$12K (Builder) → $120K (Premium)", rpm: "—", rpd: "watsonx", context: "128K", expiry: "12 mo (monthly)", status: "trial", dealId: "ibm-cloud-startups" },
  { name: "DigitalOcean Hatch", domain: "digitalocean.com", isLLM: false, type: "GPU", gates: "card", ease: 40, freeTier: "$10K cap/mo → $100K/12mo", rpm: "—", rpd: "Droplets/GPU", context: "—", expiry: "12 mo", status: "trial", dealId: "digitalocean-startups" },
  { name: "NVIDIA Inception", domain: "nvidia.com", isLLM: true, type: "LLM", gates: "", ease: 50, freeTier: "~$300K ceiling (DGX $100K + AWS $100K + …)", rpm: "—", rpd: "NIM + DGX", context: "—", expiry: "Varies", status: "trial", dealId: "nvidia-inception" },

  // Tier 9 — Recently Retired (unique addition)
  { name: "FreeTheAi", domain: "freetheai.xyz", isLLM: true, type: "LLM-Gateway", gates: "", ease: 0, freeTier: "was 80+ models Discord key", rpm: "—", rpd: "—", context: "—", expiry: "—", status: "retired", dealId: null },
];

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const used = new Set();
const providers = RAW.map((r) => {
  let id = slugify(r.name);
  if (used.has(id)) {
    let n = 2;
    while (used.has(`${id}-${n}`)) n++;
    id = `${id}-${n}`;
  }
  used.add(id);
  const gateArr = r.gates ? r.gates.split(',').map((g) => g.trim()).filter(Boolean) : [];
  if (gateArr.length === 0) gateArr.push('none');
  return {
    id,
    name: r.name,
    domain: r.domain,
    isLLM: !!r.isLLM,
    type: r.type,
    gates: gateArr,
    ease: Number(r.ease),
    freeTier: r.freeTier,
    rpm: r.rpm,
    rpd: r.rpd,
    context: r.context,
    expiry: r.expiry,
    status: r.status,
    signupUrl: `https://${r.domain}`,
    dealId: r.dealId || null,
  };
});

const outPath = path.join(__dirname, '..', 'data', 'llm-providers.json');
fs.writeFileSync(outPath, JSON.stringify(providers, null, 2), 'utf-8');
console.log(`✅ Wrote ${providers.length} LLM providers to ${outPath}`);
