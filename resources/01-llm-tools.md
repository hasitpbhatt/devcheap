# LLM Tooling: Quickstart

This short guide helps you pick a path for prototyping with LLMs while keeping costs low and development fast.

## 1) Pick a model
- Hosted APIs (OpenAI, Azure OpenAI): fastest to prototype, easy SDKs.
- Open-source (Llama, Mistral, Falcon): cheaper at scale; requires GPU or inference hosts.

## 2) Cheap hosting options
- Use low-cost inference providers (e.g., Hugging Face Inference, Replicate) or rent small GPU instances.
- For prototypes, parameter-reduced models (e.g., 7B) are often enough.

## 3) Safety & rate limits
- Always validate user input and limit token usage. Cache outputs for repeated requests.

## 4) Example quickstart (Node.js)

```bash
# install
npm init -y
npm i node-fetch
```

```js
// simple fetch to an LLM API
import fetch from 'node-fetch';
const res = await fetch('https://api.example.com/v1/generate',{method:'POST',headers:{'Authorization':'Bearer $KEY','Content-Type':'application/json'},body:JSON.stringify({prompt:'Say hi',max_tokens:64})});
console.log(await res.json());
```

## Links & resources
- Prompt templates: /prompts/prompt-templates.md
- Open models: https://huggingface.co/models

