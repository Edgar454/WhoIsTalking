from pyannote.audio import Pipeline
import soundfile as sf
import torch
import tempfile
import base64

class Model:
    def __init__(self, **kwargs):
        self._model = None
        self._secrets = kwargs["secrets"]

    def load(self):
        self._model = Pipeline.from_pretrained("pyannote/speaker-diarization-community-1" ,token= self._secrets["hf_access_token"])
        self._model.to(torch.device("cuda"))

    def predict(self, model_input):
        # Expecting base64-encoded audio file
        audio_base64 = model_input["audio_base64"]
        audio_bytes = base64.b64decode(audio_base64)

        # Save to a temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio.flush()

            waveform, sample_rate = sf.read(temp_audio.name, always_2d=False, dtype='float32')
            if waveform.ndim == 1:
                waveform = waveform[None, :]  
            else:
                waveform = waveform.T 

            audio_input = {
                "waveform": torch.from_numpy(waveform).float(),
                "sample_rate": sample_rate
                }

            # Run the model on the temp file
            output = self._model(audio_input)
        
        # Convert output to a JSON-serializable format
        result = {}
        for turn, speaker in output.speaker_diarization:
            if speaker not in result:
                result[speaker] = []
            result[speaker].append((turn.start, turn.end))
        return result
