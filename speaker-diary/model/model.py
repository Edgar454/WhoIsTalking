from pyannote.audio import Pipeline
import torch
import tempfile
import base64

HF_ACCESS_TOKEN = "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"

class Model:
    def __init__(self, **kwargs):
        self._model = None

    def load(self):
        self._model = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1" ,use_auth_token= HF_ACCESS_TOKEN)
        self._model.to(torch.device("cuda"))

    def predict(self, model_input):
        # Expecting base64-encoded audio file
        audio_base64 = model_input["audio_base64"]
        audio_bytes = base64.b64decode(audio_base64)

        # Save to a temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio.flush()

            # Run the model on the temp file
            output = self._model(temp_audio.name)
        
        # Convert output to a JSON-serializable format
        result = {}
        for turn, _, speaker in output.itertracks(yield_label=True):
            if speaker not in result:
                result[speaker] = []
            result[speaker].append((turn.start, turn.end))
        return result
