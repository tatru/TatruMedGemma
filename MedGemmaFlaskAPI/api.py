"""
TatruMedGemma experimental Flask API for research/demo image description.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoProcessor, AutoModelForImageTextToText
from PIL import Image
import torch
import io
import base64
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes (needed for Expo Go app)

# Global variables for model and processor
model = None
processor = None
device = None

API_NAME = "MedGemma Experimental Image Description API"
DEFAULT_PROMPT = (
    "Describe this medical image for research/demo use. Do not provide a diagnosis "
    "or treatment recommendation."
)

def load_model():
    """Load the MedGemma model and processor once at startup"""
    global model, processor, device
    
    logger.info("Loading MedGemma model...")
    model_id = "google/medgemma-1.5-4b-it"
    
    try:
        # Check if CUDA is available
        if torch.cuda.is_available():
            device = torch.device("cuda:0")
            logger.info(f"CUDA is available. Using device: {device}")
            logger.info(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        else:
            device = torch.device("cpu")
            logger.info("CUDA not available. Using CPU")
        
        # Load model with explicit device mapping to avoid meta device issues
        model = AutoModelForImageTextToText.from_pretrained(
            model_id,
            dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
            device_map="balanced",  # Use balanced instead of auto for better memory management
            low_cpu_mem_usage=True,
        )
        processor = AutoProcessor.from_pretrained(model_id)
        
        logger.info(f"Model loaded successfully")
        logger.info(f"Model device map: {model.hf_device_map if hasattr(model, 'hf_device_map') else 'N/A'}")
        
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise

def analyze_image(image: Image.Image, prompt: str = DEFAULT_PROMPT) -> str:
    """
    Generate an experimental description for an image using the MedGemma model
    
    Args:
        image: PIL Image object
        prompt: Text prompt for the analysis
        
    Returns:
        Generated description text
    """
    try:
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": prompt}
                ]
            }
        ]
        
        # Get the primary device from the model
        model_device = next(model.parameters()).device
        dtype = torch.bfloat16 if model_device.type == 'cuda' else torch.float32
        
        inputs = processor.apply_chat_template(
            messages, 
            add_generation_prompt=True, 
            tokenize=True,
            return_dict=True, 
            return_tensors="pt"
        ).to(model_device, dtype=dtype)
        
        input_len = inputs["input_ids"].shape[-1]
        
        with torch.inference_mode():
            generation = model.generate(**inputs, max_new_tokens=2000, do_sample=False)
            generation = generation[0][input_len:]
        
        decoded = processor.decode(generation, skip_special_tokens=True)
        return decoded
        
    except Exception as e:
        logger.error(f"Error during image analysis: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    device_info = None
    if model is not None and hasattr(model, 'device'):
        device_info = str(model.device)
    elif model is not None and hasattr(model, 'hf_device_map'):
        device_info = str(model.hf_device_map)
    
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "device": device_info,
        "cuda_available": torch.cuda.is_available(),
        "cuda_memory_allocated": f"{torch.cuda.memory_allocated(0) / 1e9:.2f} GB" if torch.cuda.is_available() else "N/A"
    })

@app.route('/analyze', methods=['POST'])
def analyze_xray():
    """
    Analyze an image for research/demo use
    
    Expected request format:
    - Content-Type: multipart/form-data
    - image: image file (required)
    - prompt: custom prompt text (optional)
    
    Or:
    - Content-Type: application/json
    - image_base64: base64 encoded image string (required)
    - prompt: custom prompt text (optional)
    
    Returns:
    - JSON with description and metadata
    """
    try:
        # Check if model is loaded
        if model is None or processor is None:
            return jsonify({"error": "Model not loaded"}), 500
        
        # Get custom prompt if provided
        prompt = request.form.get('prompt', DEFAULT_PROMPT) if request.form else None
        
        # Handle different input formats
        if 'image' in request.files:
            # File upload
            file = request.files['image']
            if file.filename == '':
                return jsonify({"error": "No image file provided"}), 400
            
            image = Image.open(file.stream).convert('RGB')
            
        elif request.is_json:
            # JSON with base64 encoded image
            data = request.get_json()
            if 'image_base64' not in data:
                return jsonify({"error": "No image_base64 provided in JSON"}), 400
            
            prompt = data.get('prompt', DEFAULT_PROMPT)
            
            # Decode base64 image
            image_data = base64.b64decode(data['image_base64'])
            image = Image.open(io.BytesIO(image_data)).convert('RGB')
        else:
            return jsonify({"error": "Invalid request format. Use multipart/form-data or application/json"}), 400
        
        # Analyze the image
        logger.info(
            "Processing image analysis request (prompt_chars=%s)",
            len(prompt or ""),
        )
        description = analyze_image(image, prompt)
        
        return jsonify({
            "success": True,
            "description": description,
            "prompt": prompt
        })
        
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information"""
    return jsonify({
        "name": API_NAME,
        "version": "1.0.0",
        "endpoints": {
            "GET /": "API information",
            "GET /health": "Health check",
            "POST /analyze": "Experimental image description"
        },
        "documentation": {
            "/analyze": {
                "method": "POST",
                "content_types": ["multipart/form-data", "application/json"],
                "parameters": {
                    "image": "Image file (multipart) or image_base64 (JSON)",
                    "prompt": "Optional custom prompt"
                }
            }
        }
    })

if __name__ == '__main__':
    # Load model before starting the server
    load_model()
    
    # Start Flask server
    # Use host='0.0.0.0' to make it accessible from other devices on the network
    app.run(host='0.0.0.0', port=5000, debug=False)
