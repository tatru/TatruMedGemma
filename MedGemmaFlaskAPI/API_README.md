# TatruMedGemma Flask API

This directory contains an experimental Flask service used by the
TatruMedGemma prototype for text and image requests against MedGemma-style
models.

> Medical safety disclaimer
>
> This server is part of a research/demo prototype. It is not a medical
> device, not a diagnostic service, and not suitable for clinical use,
> emergency use, or autonomous medical decision-making.

## What It Does

- exposes `/health`
- accepts prompts and optional images at `/analyze`
- exposes a streaming variant at `/analyze_stream`
- can load directly from an upstream model ID or from a user-supplied local
  model directory

## Setup

```sh
conda activate medgemma2
pip install -r requirements-api.txt
python api_stable.py
```

By default the service listens on `http://127.0.0.1:5000`.

## Important Privacy And Security Notes

- This API has no built-in authentication.
- If you bind it to `0.0.0.0` or expose it through a reverse proxy, anyone
  with network access may be able to send prompts or images unless you add
  your own protections.
- Prompts, images, and request metadata may be visible to your server logs,
  proxy logs, debugging tools, and crash reports depending on how you run it.
- Do not use real patient data unless you fully control the environment and
  understand the privacy, security, and regulatory implications.

## Local Model Directory

The code supports `LOCAL_MODEL_DIR` for user-supplied local model artifacts,
for example:

```sh
set LOCAL_MODEL_DIR=.\quant-medgemma
python api_stable.py
```

This repository does not grant any rights to upstream model weights,
tokenizers, or processor files. Populate local model directories yourself
from upstream sources you are allowed to use.

## API Endpoints

### `GET /`

Returns a small JSON description of the experimental API.

### `GET /health`

Returns runtime status and model/device metadata.

### `POST /analyze`

Accepts:

- `multipart/form-data` with `image` and optional `prompt`
- `application/json` with optional `image_base64` and optional `prompt`

The response includes generated text only. It must not be treated as a
diagnosis or clinically reliable interpretation.

### `POST /analyze_stream`

Same inputs as `/analyze`, but streams incremental text output.

## LAN Access

If you want the mobile app to reach this service from another device on your
network, configure the app with your own reachable host/IP and secure the
service appropriately. Review firewalling, TLS, authentication, and logging
before exposing the API beyond localhost.

## Related Documentation

- [Repository README](../README.md)
- [Privacy](../PRIVACY.md)
- [Safety](../docs/SAFETY.md)
- [Security](../SECURITY.md)
