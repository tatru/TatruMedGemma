"""
TatruMedGemma experimental Flask API (stable variant)
This version loads the entire model to GPU without automatic device mapping,
which can be more stable for API serving if you have enough VRAM.
"""

import os

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from transformers import AutoProcessor, AutoModelForImageTextToText, TextIteratorStreamer, BitsAndBytesConfig
from PIL import Image
import torch
import io
import base64
import logging
import gc
import threading

# ---------------------------------------------------------------------------
# Configuration — override with environment variables before starting Flask
# ---------------------------------------------------------------------------
# Base model on HuggingFace (used when no local copy exists)
MODEL_ID = os.environ.get("MODEL_ID", "google/medgemma-1.5-4b-it")
# Path to a local directory saved with model.save_pretrained().
# If set and the directory exists, the server loads from disk (no HF download).
LOCAL_MODEL_DIR = os.environ.get("LOCAL_MODEL_DIR", "").strip()
# Set USE_4BIT=0 to fall back to plain bfloat16 (needs ~8 GB VRAM).
USE_4BIT = os.environ.get("USE_4BIT", "1") == "1"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes (needed for Expo Go app)

# Global variables for model and processor
model = None
processor = None

API_NAME = "MedGemma Experimental Image Description API"
DEFAULT_PROMPT = (
    "Describe this medical image for research/demo use. Do not provide a diagnosis "
    "or treatment recommendation."
)


def get_runtime_device() -> torch.device:
    """Return a concrete runtime device suitable for request tensors."""
    if model is None:
        return torch.device("cpu")

    if hasattr(model, "hf_device_map") and isinstance(model.hf_device_map, dict):
        for mapped in model.hf_device_map.values():
            # Integer values (e.g. 0, 1) mean CUDA device index
            if isinstance(mapped, int):
                return torch.device(f"cuda:{mapped}")
            mapped_str = str(mapped)
            if mapped_str not in {"cpu", "disk", "meta"}:
                # Could be "cuda:0" or a bare digit string like "0"
                if mapped_str.isdigit():
                    return torch.device(f"cuda:{mapped_str}")
                return torch.device(mapped_str)

    for param in model.parameters():
        if param.device.type != "meta":
            return param.device

    return torch.device("cpu")


def build_model_inputs(messages):
    """Prepare tokenized inputs and place tensors on a valid runtime device."""
    inputs = processor.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
    )

    target_device = get_runtime_device()
    for key, value in list(inputs.items()):
        if torch.is_tensor(value):
            inputs[key] = value.to(target_device)

    return inputs

def load_model():
    """Load the MedGemma model and processor once at startup."""
    global model, processor

    # Resolve which weights to load: local directory takes priority.
    source = LOCAL_MODEL_DIR if (LOCAL_MODEL_DIR and os.path.isdir(LOCAL_MODEL_DIR)) else MODEL_ID
    logger.info("Loading MedGemma model from: %s", source)

    try:
        load_kwargs: dict = {"device_map": "auto", "low_cpu_mem_usage": True}

        if torch.cuda.is_available() and USE_4BIT:
            total_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
            logger.info("GPU Memory Available: %.2f GB", total_memory)
            logger.info("Loading with 4-bit NF4 quantization (bitsandbytes)...")
            load_kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_use_double_quant=True,
            )
        elif torch.cuda.is_available():
            logger.info("Loading in bfloat16 (USE_4BIT=0)...")
            load_kwargs["torch_dtype"] = torch.bfloat16
        else:
            logger.info("CUDA not available — loading on CPU in float32 (slow).")
            load_kwargs["torch_dtype"] = torch.float32

        model = AutoModelForImageTextToText.from_pretrained(source, **load_kwargs)
        processor = AutoProcessor.from_pretrained(source)

        logger.info("Model loaded successfully!")
        if hasattr(model, "hf_device_map"):
            logger.info("Device map: %s", model.hf_device_map)
        else:
            logger.info("Model device: %s", next(model.parameters()).device)

    except Exception as e:
        logger.error("Error loading model: %s", e)
        raise

def analyze_image(image: Image.Image | None = None, prompt: str = DEFAULT_PROMPT) -> str:
    """
    Generate an experimental description for an image using the MedGemma model
    
    Args:
        image: PIL Image object
        prompt: Text prompt for the analysis
        
    Returns:
        Generated description text
    """
    content = [{"type": "text", "text": prompt}]
    if image is not None:
        content.insert(0, {"type": "image", "image": image})

    messages = [
        {
            "role": "user",
            "content": content
        }
    ]
    
    inputs = build_model_inputs(messages)
    
    input_len = inputs["input_ids"].shape[-1]
    
    with torch.inference_mode():
        generation = model.generate(**inputs, max_new_tokens=2000, do_sample=False)
        generation = generation[0][input_len:]
    
    decoded = processor.decode(generation, skip_special_tokens=True)
    
    # Aggressive memory cleanup
    del inputs
    del generation
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
    
    return decoded


def analyze_image_stream(image: Image.Image | None = None, prompt: str = DEFAULT_PROMPT):
    """
    Generator that yields tokens from the MedGemma model as they are produced.
    Suitable for use with a streaming Flask response.
    """
    content = [{"type": "text", "text": prompt}]
    if image is not None:
        content.insert(0, {"type": "image", "image": image})

    messages = [
        {
            "role": "user",
            "content": content
        }
    ]

    inputs = build_model_inputs(messages)

    streamer = TextIteratorStreamer(
        processor.tokenizer,
        skip_prompt=True,
        skip_special_tokens=True,
        timeout=30.0,
    )

    generation_error = {"error": None}

    def run_generation():
        try:
            with torch.inference_mode():
                model.generate(
                    **inputs,
                    max_new_tokens=2000,
                    do_sample=False,
                    streamer=streamer,
                )
        except Exception as e:
            generation_error["error"] = e
            logger.error("Error during streamed generation: %s", e, exc_info=True)
            try:
                streamer.end()
            except Exception:
                pass

    thread = threading.Thread(target=run_generation, daemon=True)
    thread.start()

    try:
        for chunk in streamer:
            if chunk:
                # SSE format: "data: <content>\n\n"
                # Multi-line chunks must have each line prefixed with "data: "
                sse_body = chunk.replace("\n", "\ndata: ")
                yield f"data: {sse_body}\n\n"

        if generation_error["error"] is not None:
            yield f"data: [stream_error] {generation_error['error']}\n\n"
    except Exception as e:
        logger.error("Streaming iterator failed: %s", e, exc_info=True)
        err = generation_error["error"] or e
        yield f"data: [stream_error] {err}\n\n"

    finally:
        # clean up once generation is complete
        del inputs
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    health_info = {
        "status": "healthy",
        "model_loaded": model is not None,
    }
    
    if torch.cuda.is_available():
        health_info["cuda_available"] = True
        health_info["cuda_memory_allocated_gb"] = f"{torch.cuda.memory_allocated(0) / 1e9:.2f}"
        health_info["cuda_memory_reserved_gb"] = f"{torch.cuda.memory_reserved(0) / 1e9:.2f}"
        health_info["cuda_memory_total_gb"] = f"{torch.cuda.get_device_properties(0).total_memory / 1e9:.2f}"
    else:
        health_info["cuda_available"] = False
    
    if model is not None:
        if hasattr(model, 'hf_device_map'):
            health_info["device_map"] = str(model.hf_device_map)
        else:
            health_info["device"] = str(next(model.parameters()).device)
    
    return jsonify(health_info)

@app.route('/analyze', methods=['POST'])
def analyze_xray():
    """
    Analyze an image or text-only prompt for research/demo use
    
    Expected request format:
    - Content-Type: multipart/form-data
    - image: image file (optional)
    - prompt: custom prompt text (optional)
    
    Or:
    - Content-Type: application/json
    - image_base64: base64 encoded image string (optional)
    - prompt: custom prompt text (optional)
    
    Returns:
    - JSON with description and metadata
    """
    try:
        # Check if model is loaded
        if model is None or processor is None:
            return jsonify({"error": "Model not loaded"}), 500
        
        prompt = DEFAULT_PROMPT
        image = None
        
        # Handle different input formats
        if 'image' in request.files:
            # File upload
            file = request.files['image']
            if file.filename == '':
                return jsonify({"error": "No image file provided"}), 400
            
            image = Image.open(file.stream).convert('RGB')
            prompt = request.form.get('prompt', prompt) if request.form else prompt
            
        elif request.is_json:
            data = request.get_json(silent=True) or {}
            prompt = data.get('prompt', prompt)

            if data.get('image_base64'):
                image_data = base64.b64decode(data['image_base64'])
                image = Image.open(io.BytesIO(image_data)).convert('RGB')
        elif request.form:
            prompt = request.form.get('prompt', prompt)
        else:
            return jsonify({"error": "Invalid request format. Use multipart/form-data or application/json"}), 400
        
        # Analyze the image
        logger.info(
            "Processing analysis request (input_type=%s, prompt_chars=%s)",
            "image+text" if image is not None else "text",
            len(prompt or ""),
        )
        description = analyze_image(image, prompt)
        logger.info("Analysis complete")
        
        return jsonify({
            "success": True,
            "description": description,
            "prompt": prompt,
            "input_type": "image+text" if image is not None else "text"
        })
        
    except Exception as e:
        logger.error(f"Error during analysis: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/analyze_stream', methods=['POST'])
def analyze_xray_stream():
    """
    Streaming version of the /analyze endpoint.  The response body is sent
    token-by-token as the model generates. Accepts image+text or text-only,
    using the same input formats as /analyze.
    """
    try:
        # ensure model is ready
        if model is None or processor is None:
            return jsonify({"error": "Model not loaded"}), 500

        # diagnostic logging to help troubleshoot Postman/other clients
        logger.debug("headers: %s", dict(request.headers))
        logger.debug("content_type: %r", request.content_type)
        logger.debug("form keys: %s", list(request.form.keys()))
        logger.debug("files keys: %s", list(request.files.keys()))
        logger.debug("is_json: %s", request.is_json)

        prompt = DEFAULT_PROMPT
        image = None

        if 'image' in request.files:
            file = request.files['image']
            if file.filename == '':
                return jsonify({"error": "No image file provided"}), 400
            image = Image.open(file.stream).convert('RGB')
            prompt = request.form.get('prompt', prompt) if request.form else prompt
        elif request.is_json:
            data = request.get_json(silent=True)
            data = data or {}
            prompt = data.get('prompt', prompt)
            if data.get('image_base64'):
                image_data = base64.b64decode(data['image_base64'])
                image = Image.open(io.BytesIO(image_data)).convert('RGB')
        elif request.form:
            prompt = request.form.get('prompt', prompt)
        else:
            # include a little more detail to make debugging easier
            return jsonify({
                "error": "Invalid request format. Use multipart/form-data or application/json",
                "content_type": request.content_type,
                "form_keys": list(request.form.keys()),
                "files_keys": list(request.files.keys()),
                "is_json": request.is_json,
            }), 400

        logger.info(
            "Streaming analysis request (input_type=%s, prompt_chars=%s)",
            "image+text" if image is not None else "text",
            len(prompt or ""),
        )
        gen = analyze_image_stream(image, prompt)
        return Response(
            stream_with_context(gen),
            mimetype='text/event-stream; charset=utf-8',
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as e:
        logger.error(f"Error during streaming analysis: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information"""
    return jsonify({
        "name": API_NAME,
        "version": "1.1.0",
        "endpoints": {
            "GET /": "API information",
            "GET /health": "Health check",
            "POST /analyze": "Experimental image description",
            "POST /analyze_stream": "Streamed experimental image description"
        },
        "documentation": {
            "/analyze": {
                "method": "POST",
                "content_types": ["multipart/form-data", "application/json"],
                "parameters": {
                    "image": "Optional image file (multipart) or image_base64 (JSON)",
                    "prompt": "Optional custom prompt"
                }
            },
            "/analyze_stream": {
                "method": "POST",
                "description": "Same inputs as /analyze but response is streamed token-by-token",
                "content_types": ["multipart/form-data", "application/json"]
            }
        }
    })

if __name__ == '__main__':
    # Load model before starting the server
    load_model()
    
    # Start Flask server
    # Use host='0.0.0.0' to make it accessible from other devices on the network
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
