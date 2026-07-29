---
title: 'AI Security Guard with Envoy ext_authz + MobileBERT'
description: 'Add an AI guardrail to any API with Envoy ext_authz and a MobileBERT SQL-injection classifier — block unsafe requests at the edge and fail closed, on Docker.'
pubDate: 2026-07-28
updatedDate: 2026-07-28
image: '/images/envoy-ai-security-guard/architecture-og.png'
tags: ['ai', 'security', 'envoy', 'api-security', 'ext-authz', 'sql-injection', 'prompt-injection', 'mobilebert', 'llm-security', 'machine-learning', 'zero-trust', 'docker', 'tutorial']
draft: false
---

**[Envoy AI Security Guard](https://github.com/jeevanbisht/AISecurityGuard)** is a small, self-contained lab that puts a machine-learning security decision directly in the request path — using [Envoy Proxy](https://www.envoyproxy.io/)'s native [external authorization (`ext_authz`)](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/security/ext_authz_filter) filter to inspect every request with a [MobileBERT SQL-injection classifier](https://huggingface.co/cssupport/mobilebert-sql-injection-detect) before it can reach your application, and blocking anything it judges unsafe at the edge. If you've ever wondered how to add an AI-driven guardrail to an API *without rewriting the API*, this lab is a working, end-to-end answer you can run on Docker Desktop in a couple of minutes.

## The problem: security checks live inside every app

The usual way to stop a malicious request is to validate it inside the application — a filter in each service, in each language, maintained by each team. That works, but it scatters enforcement across your whole estate and raises an uncomfortable question: what happens to the one endpoint whose developer forgot to add the check?

Moving the decision to the proxy turns that scattered logic into a single, consistent control point. Every routed request follows the same inspection path, the guard can look at the URL, headers, query, and body, and a denied request never touches the backend. Just as importantly, the detection engine can evolve — from rules, to a model, to a layered risk score — without changing a line of application code.

> Envoy supports external authorization: the filter calls an external gRPC or HTTP service to check whether the request is authorized or not. If the check fails, the request is denied.
>
> — [Envoy `ext_authz` filter documentation](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/ext_authz_filter)

This is not a replacement for secure coding, authentication, or authorization. It's an additional layer — one that's especially useful when the threat changes faster than the application can be redeployed.

## Why I built it

AI for security is easy to talk about and harder to wire into something real. I wanted a lab where a trained model makes an actual allow-or-deny call on live traffic, not a notebook that scores strings in isolation. The interesting part isn't the classifier — it's the *architecture* around it: a clean boundary where the proxy owns enforcement and a separate service owns analysis.

Starting with a published SQL-injection model let me validate the whole control plane end to end, then reason about the questions that actually matter in production — latency, availability, false positives, and evasion — with a working system in front of me instead of a slide. It sits alongside my other hands-on security labs, like [SPIFFE & SPIRE on your laptop](/blog/spiffe-spire-on-your-laptop/) for workload identity.

## What it does

The lab runs three containers wired together with Docker Compose. Clients connect to Envoy, never directly to the backend. The [architecture diagram above](#) shows the full flow; here are the moving parts:

| Component | Port | Role |
| --- | --- | --- |
| **Envoy Proxy** | `8080` / `8443` | Terminates TLS, enforces the authorization decision, routes allowed traffic |
| **AI Security Guard** | `5000` | Loads MobileBERT + prompt rules, returns `200` allow or `403` deny |
| **Web application** | `8000` | A simple backend that only ever sees requests the guard approved |

For every request, Envoy runs this sequence via `ext_authz`:

| Step | What happens |
| --- | --- |
| 1 | Client sends an HTTP or TLS request to Envoy |
| 2 | Envoy calls the guard with the path, approved headers, and up to **64 KB** of body — waiting max **2s** |
| 3 | Guard scores the input and returns `200 OK` (allow) or `403 Forbidden` (deny) |
| 4 | Allow → Envoy forwards to the app · Deny → `403` returned · **Guard unavailable → request blocked** |

That last row is the important one. The lab sets [`failure_mode_allow: false`](https://www.envoyproxy.io/docs/envoy/latest/api-v3/extensions/filters/http/ext_authz/v3/ext_authz.proto), so if the guard can't return a decision, Envoy **fails closed** rather than open:

```yaml
http_filters:
  - name: envoy.filters.http.ext_authz
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.ext_authz.v3.ExtAuthz
      http_service:
        server_uri:
          cluster: ai_model_service
          timeout: 2.000s
          uri: http://ai_model_service:5000/check
      with_request_body:
        max_request_bytes: 65536
        pack_as_bytes: false
      failure_mode_allow: false
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

Fail-closed is the safer default for an experiment, but it's also an availability decision — a real deployment has to decide which routes demand strict enforcement and what latency budget is acceptable.

## Quick start

The whole environment comes up with one command — the guard image downloads the model at build time, so the first request isn't blocked on a model pull.

```bash
# Clone the lab
git clone https://github.com/jeevanbisht/AISecurityGuard.git
cd AISecurityGuard

# Build and start Envoy, the AI guard, and the backend
docker compose up --build -d
docker compose ps
```

Send a normal query through the TLS listener — expect `200 OK` and the backend response:

```bash
curl -k "https://localhost:8443/search?q=laptops"
```

Now send an obvious SQL-injection string — expect `403 Forbidden`, and the backend never processes it:

```bash
curl -k "https://localhost:8443/search?q=SELECT%20*%20FROM%20users;--"
```

A prompt-injection attempt takes the same path over the HTTP listener:

```bash
curl "http://localhost:8080/search?q=ignore%20previous%20instructions"
```

The lab also ships an automated check that verifies one allowed request and two blocked requests:

```bash
python test_lab.py
```

Requirements: [Docker Desktop](https://www.docker.com/products/docker-desktop/) and, for the test script, Python 3. Nothing else — no cloud account, no API keys.

## How detection works

The guard is a **hybrid**: a trained model for SQL injection, deterministic patterns for prompt injection. Each request is URL-decoded and whitespace-normalized, then passed through both layers.

| Layer | Engine | What it catches |
| --- | --- | --- |
| **SQL injection** | [MobileBERT sequence classifier](https://huggingface.co/cssupport/mobilebert-sql-injection-detect) — blocks when the injection-class probability ≥ threshold | `UNION SELECT`, boolean tautologies, stacked queries, obfuscated variants |
| **Prompt injection / unsafe payloads** | Regex signatures | `ignore previous instructions`, `system prompt`, `<script>`, `/etc/passwd` |

The SQL-injection decision is genuine model inference — [PyTorch](https://pytorch.org/) + [Hugging Face Transformers](https://huggingface.co/docs/transformers) running MobileBERT:

```python
def predict_sql_injection(content: str) -> float:
    tokenizer, model = load_model()
    inputs = tokenizer(content, truncation=True,
                       return_tensors="pt", max_length=512)

    with torch.inference_mode():
        logits = model(**inputs).logits

    probabilities = torch.softmax(logits, dim=-1)
    return probabilities[0, SQL_INJECTION_CLASS_ID].item()
```

A blocked request comes back with a machine-readable reason header and the model's confidence — useful in development, though in production I'd keep the detailed reason in protected telemetry and return something terse to an untrusted client:

```http
HTTP/1.1 403 Forbidden
x-ext-auth-reason: unsafe-query-blocked
content-type: application/json

{ "status": "blocked",
  "reason": "SQL injection detected by MobileBERT (confidence: 0.997)" }
```

Two environment variables tune the behavior without touching code:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SQL_INJECTION_MODEL_ID` | `cssupport/mobilebert-sql-injection-detect` | Swap in any compatible sequence-classification model |
| `SQL_INJECTION_THRESHOLD` | `0.70` | Raise for fewer false positives, lower to be more aggressive |

## Scope and limitations

This is a **lab**, and it's deliberately narrow. It's a foundation to build on, not a drop-in WAF:

- The model classifies **SQL injection only** — prompt-injection coverage is a handful of illustrative regexes, not a trained detector.
- The guard is now on the **latency and availability path**. With fail-closed enabled, a slow or down guard means blocked traffic.
- Regex prompt rules are trivially evaded; real coverage needs normalization against encoding, fragmentation, and alternate syntax.
- No identity, rate limiting, or per-route policy yet — every route is treated the same.

None of that undercuts the point. The lab proves you can insert **model-backed inspection in front of an application without modifying it**, with a clean split between the enforcement point (Envoy) and the decision engine (the guard).

## From a classifier to layered AI security

The natural next step isn't "replace every rule with an LLM" — it's a layered decision:

1. **Normalize first** so equivalent payloads get equivalent analysis.
2. **Keep high-confidence rules** — fast, cheap, explainable.
3. **Use specialized classifiers** — MobileBERT scores SQL injection today; other models can own other attack classes.
4. **Extract structured signals** — route, method, content type, identity, payload size, history — not just raw text.
5. **Apply policy to model scores** — a confidence value is evidence for a decision, not the entire policy.
6. **Close the loop** — store reviewed false positives and negatives for evaluation.

Envoy still enforces a binary allow-or-deny, while a richer decision object supports logging, tuning, and future response actions:

```json
{
  "decision": "deny",
  "risk_score": 0.97,
  "category": "sql_injection",
  "signals": ["union_select", "stacked_query"],
  "policy": "high-risk-input-v1"
}
```

That's the real value of putting AI at a proper enforcement point: the proxy doesn't need to understand MobileBERT, tokenization, or confidence scores — it just needs a fast, trustworthy answer, and the application receives only traffic that policy allowed.

## FAQ

**How do you add AI security to an API without changing the app?**
Put the decision at the proxy. Envoy's `ext_authz` filter calls an external guard for every request and only forwards it on an allow, so the application itself needs no security-specific code.

**What does the MobileBERT model actually detect?**
It classifies SQL injection and returns a probability. The guard blocks the request when that probability crosses a configurable threshold (default `0.70`). Prompt injection and other unsafe payloads are handled by separate deterministic rules.

**What happens if the security guard is unavailable?**
Envoy is configured to fail closed (`failure_mode_allow: false`), so if the guard can't return a decision within the timeout, the request is blocked rather than allowed through.

**Is this a replacement for a Web Application Firewall (WAF)?**
No — it's a hands-on lab and architectural foundation. It shows how to run model-backed inspection in front of an app; production use needs broader attack coverage, latency and availability engineering, and threshold tuning.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do you add AI security to an API without changing the app?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Put the decision at the proxy. Envoy's ext_authz filter calls an external guard for every request and only forwards it on an allow, so the application itself needs no security-specific code."
      }
    },
    {
      "@type": "Question",
      "name": "What does the MobileBERT model actually detect?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It classifies SQL injection and returns a probability. The guard blocks the request when that probability crosses a configurable threshold (default 0.70). Prompt injection and other unsafe payloads are handled by separate deterministic rules."
      }
    },
    {
      "@type": "Question",
      "name": "What happens if the security guard is unavailable?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Envoy is configured to fail closed (failure_mode_allow: false), so if the guard cannot return a decision within the timeout, the request is blocked rather than allowed through."
      }
    },
    {
      "@type": "Question",
      "name": "Is this a replacement for a Web Application Firewall (WAF)?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. It is a hands-on lab and architectural foundation that shows how to run model-backed inspection in front of an app. Production use needs broader attack coverage, latency and availability engineering, and threshold tuning."
      }
    }
  ]
}
</script>

---

**Source:** [github.com/jeevanbisht/AISecurityGuard](https://github.com/jeevanbisht/AISecurityGuard) — [Envoy `ext_authz`](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/security/ext_authz_filter) in front of a Flask guard running [`cssupport/mobilebert-sql-injection-detect`](https://huggingface.co/cssupport/mobilebert-sql-injection-detect) on [PyTorch](https://pytorch.org/) + [Transformers](https://huggingface.co/docs/transformers), packaged with [Docker Compose](https://docs.docker.com/compose/) and **fail-closed by default**.
